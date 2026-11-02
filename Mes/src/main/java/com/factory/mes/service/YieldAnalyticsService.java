package com.factory.mes.service;

import com.factory.mes.dto.YieldReportDTO;
import com.factory.mes.entity.ProductionOrder;
import com.factory.mes.exception.ResourceNotFoundException;
import com.factory.mes.repository.MaterialIssueRepository;
import com.factory.mes.repository.ProductionOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class YieldAnalyticsService {

    /**
     * Standard allowed raw material consumption per syringe unit:
     * 0.008 kg (8 grams) of medical-grade polypropylene per 5ml syringe.
     */
    public static final BigDecimal STANDARD_MATERIAL_PER_UNIT = new BigDecimal("0.008");

    private final ProductionOrderRepository productionOrderRepository;
    private final MaterialIssueRepository materialIssueRepository;

    /**
     * Generates real-time yield analytics and variance calculations for a specific production order.
     *
     * @param poId Production Order ID
     * @return YieldReportDTO with calculated variance and efficiency metrics
     */
    @Transactional(readOnly = true)
    public YieldReportDTO getYieldReport(String poId) {
        ProductionOrder order = productionOrderRepository.findById(poId)
                .orElseThrow(() -> new ResourceNotFoundException("Production order not found: " + poId));

        return buildYieldReport(order);
    }

    /**
     * Generates real-time yield reports for all production orders.
     */
    @Transactional(readOnly = true)
    public List<YieldReportDTO> getAllYieldReports() {
        return productionOrderRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::buildYieldReport)
                .collect(Collectors.toList());
    }

    private YieldReportDTO buildYieldReport(ProductionOrder order) {
        int goodOutput = order.getGoodOutput() != null ? order.getGoodOutput() : 0;
        int scrapQty = order.getScrapQty() != null ? order.getScrapQty() : 0;
        int totalProduced = goodOutput + scrapQty;

        // 1. Calculate Standard Allowed Material = Good Output * 0.008 kg
        BigDecimal standardAllowed = BigDecimal.valueOf(goodOutput)
                .multiply(STANDARD_MATERIAL_PER_UNIT)
                .setScale(3, RoundingMode.HALF_UP);

        // 2. Fetch Actual Material Issued from validated lots
        BigDecimal totalIssued = materialIssueRepository.sumIssuedQtyByPoId(order.getPoId());
        if (totalIssued == null) {
            totalIssued = BigDecimal.ZERO.setScale(3, RoundingMode.HALF_UP);
        } else {
            totalIssued = totalIssued.setScale(3, RoundingMode.HALF_UP);
        }

        // 3. Compute Material Variance Quantity = Total Issued - Standard Allowed
        BigDecimal varianceQty = totalIssued.subtract(standardAllowed).setScale(3, RoundingMode.HALF_UP);

        // 4. Compute Variance Percentage = (Variance Qty / Standard Allowed) * 100%
        BigDecimal variancePercentage;
        if (standardAllowed.compareTo(BigDecimal.ZERO) > 0) {
            variancePercentage = varianceQty
                    .multiply(BigDecimal.valueOf(100))
                    .divide(standardAllowed, 2, RoundingMode.HALF_UP);
        } else if (totalIssued.compareTo(BigDecimal.ZERO) > 0) {
            variancePercentage = BigDecimal.valueOf(100).setScale(2, RoundingMode.HALF_UP);
        } else {
            variancePercentage = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        // 5. Compute Yield Efficiency % = Good Output / (Good Output + Scrap) * 100%
        BigDecimal yieldEfficiency;
        BigDecimal scrapRatePercentage;
        if (totalProduced > 0) {
            yieldEfficiency = BigDecimal.valueOf(goodOutput)
                    .multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(totalProduced), 2, RoundingMode.HALF_UP);

            scrapRatePercentage = BigDecimal.valueOf(scrapQty)
                    .multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(totalProduced), 2, RoundingMode.HALF_UP);
        } else {
            yieldEfficiency = BigDecimal.valueOf(100).setScale(2, RoundingMode.HALF_UP);
            scrapRatePercentage = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        // 6. Determine Material Variance Status
        String evaluation;
        String summary;
        if (standardAllowed.compareTo(BigDecimal.ZERO) == 0 && totalIssued.compareTo(BigDecimal.ZERO) == 0) {
            evaluation = "READY_TO_START";
            summary = "Order planned. No raw material issued yet.";
        } else if (variancePercentage.compareTo(new BigDecimal("5.00")) > 0) {
            evaluation = "EXCESSIVE_VARIANCE";
            summary = String.format("WARNING: Raw material consumption is %s%% above standard allowed limit! Check mold flash and scrap.",
                    variancePercentage);
        } else if (variancePercentage.compareTo(new BigDecimal("-5.00")) < 0) {
            evaluation = "UNDER_CONSUMPTION";
            summary = String.format("NOTICE: Raw material consumption is %s%% below nominal standard. Verify part weight.",
                    variancePercentage.abs());
        } else {
            evaluation = "OPTIMAL";
            summary = "Yield within strict +/-5% medical-grade tolerance specification.";
        }

        return YieldReportDTO.builder()
                .poId(order.getPoId())
                .productName(order.getProductName())
                .targetQty(order.getTargetQty())
                .goodOutput(goodOutput)
                .scrapQty(scrapQty)
                .totalProduced(totalProduced)
                .orderStatus(order.getStatus())
                .totalMaterialIssued(totalIssued)
                .standardAllowedMaterial(standardAllowed)
                .varianceQty(varianceQty)
                .variancePercentage(variancePercentage)
                .unit("kg")
                .yieldEfficiency(yieldEfficiency)
                .scrapRatePercentage(scrapRatePercentage)
                .statusEvaluation(evaluation)
                .summary(summary)
                .build();
    }
}
