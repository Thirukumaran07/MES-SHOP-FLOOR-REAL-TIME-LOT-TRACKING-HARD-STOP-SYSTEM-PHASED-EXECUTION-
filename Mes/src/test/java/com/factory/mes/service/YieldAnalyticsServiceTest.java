package com.factory.mes.service;

import com.factory.MesApplication.dto.YieldReportDTO;
import com.factory.MesApplication.entity.OrderStatus;
import com.factory.MesApplication.entity.ProductionOrder;
import com.factory.MesApplication.repository.MaterialIssueRepository;
import com.factory.MesApplication.repository.ProductionOrderRepository;
import com.factory.MesApplication.service.YieldAnalyticsService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class YieldAnalyticsServiceTest {

    @Mock
    private ProductionOrderRepository productionOrderRepository;

    @Mock
    private MaterialIssueRepository materialIssueRepository;

    @InjectMocks
    private YieldAnalyticsService yieldAnalyticsService;

    @Test
    @DisplayName("YIELD CALCULATIONS: 100,000 syringes target with 95,000 good output & 800 kg material issued")
    void testYieldCalculations_NormalScenario() {
        // Given 95,000 good syringes produced, standard allowed = 95,000 * 0.008 kg = 760.000 kg
        // Actual material issued = 800.000 kg
        // Variance Qty = 800 - 760 = +40.000 kg
        // Variance % = (40 / 760) * 100 = 5.26%
        ProductionOrder order = ProductionOrder.builder()
                .poId("PO-2026-1001")
                .productName("5ml Disposable Sterile Syringe")
                .targetQty(100000)
                .goodOutput(95000)
                .scrapQty(2000)
                .status(OrderStatus.IN_PROGRESS)
                .createdAt(LocalDateTime.now())
                .build();

        when(productionOrderRepository.findById("PO-2026-1001")).thenReturn(Optional.of(order));
        when(materialIssueRepository.sumIssuedQtyByPoId("PO-2026-1001")).thenReturn(new BigDecimal("800.000"));

        YieldReportDTO report = yieldAnalyticsService.getYieldReport("PO-2026-1001");

        assertThat(report).isNotNull();
        assertThat(report.getGoodOutput()).isEqualTo(95000);
        assertThat(report.getScrapQty()).isEqualTo(2000);
        assertThat(report.getTotalProduced()).isEqualTo(97000);
        assertThat(report.getStandardAllowedMaterial()).isEqualByComparingTo(new BigDecimal("760.000"));
        assertThat(report.getTotalMaterialIssued()).isEqualByComparingTo(new BigDecimal("800.000"));
        assertThat(report.getVarianceQty()).isEqualByComparingTo(new BigDecimal("40.000"));
        assertThat(report.getVariancePercentage()).isEqualByComparingTo(new BigDecimal("5.26"));
        assertThat(report.getStatusEvaluation()).isEqualTo("EXCESSIVE_VARIANCE");
    }

    @Test
    @DisplayName("ZERO OUTPUT HANDLING: Safe handling when batch has just started with zero good output")
    void testYieldCalculations_ZeroOutput() {
        ProductionOrder order = ProductionOrder.builder()
                .poId("PO-2026-1002")
                .productName("5ml Disposable Sterile Syringe")
                .targetQty(100000)
                .goodOutput(0)
                .scrapQty(0)
                .status(OrderStatus.PLANNED)
                .createdAt(LocalDateTime.now())
                .build();

        when(productionOrderRepository.findById("PO-2026-1002")).thenReturn(Optional.of(order));
        when(materialIssueRepository.sumIssuedQtyByPoId("PO-2026-1002")).thenReturn(BigDecimal.ZERO);

        YieldReportDTO report = yieldAnalyticsService.getYieldReport("PO-2026-1002");

        assertThat(report).isNotNull();
        assertThat(report.getStandardAllowedMaterial()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(report.getVariancePercentage()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(report.getStatusEvaluation()).isEqualTo("READY_TO_START");
    }
}
