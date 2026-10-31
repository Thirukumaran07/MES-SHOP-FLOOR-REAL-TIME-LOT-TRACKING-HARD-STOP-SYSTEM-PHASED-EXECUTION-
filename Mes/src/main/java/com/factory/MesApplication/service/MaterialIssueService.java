package com.factory.MesApplication.service;

import com.factory.MesApplication.dto.MaterialIssueRequest;
import com.factory.MesApplication.dto.MaterialIssueResponse;
import com.factory.MesApplication.entity.LotStatus;
import com.factory.MesApplication.entity.MaterialIssue;
import com.factory.MesApplication.entity.MaterialLot;
import com.factory.MesApplication.entity.OrderStatus;
import com.factory.MesApplication.entity.ProductionOrder;
import com.factory.MesApplication.exception.QuarantineBlockException;
import com.factory.MesApplication.exception.ResourceNotFoundException;
import com.factory.MesApplication.repository.MaterialIssueRepository;
import com.factory.MesApplication.repository.MaterialLotRepository;
import com.factory.MesApplication.repository.ProductionOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class MaterialIssueService {

    private final MaterialLotRepository materialLotRepository;
    private final ProductionOrderRepository productionOrderRepository;
    private final MaterialIssueRepository materialIssueRepository;

    /**
     * Issues raw material to a production order with strict Hard-Stop validation.
     * Prevents Quarantined or Rejected materials from reaching the production line.
     *
     * @param request the scan issue request containing poId, lotId, and issuedQty
     * @return MaterialIssueResponse with updated balances and audit details
     */
    @Transactional
    public MaterialIssueResponse issueMaterial(MaterialIssueRequest request) {
        log.info("Processing shop-floor material scan issue: PO=[{}], LOT=[{}], Qty=[{}]",
                request.getPoId(), request.getLotId(), request.getIssuedQty());

        // 1. Verify Production Order exists
        ProductionOrder order = productionOrderRepository.findById(request.getPoId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Production Order not found: " + request.getPoId()));

        if (order.getStatus() == OrderStatus.COMPLETED) {
            throw new IllegalArgumentException(
                    "Production Order [" + request.getPoId() + "] is already COMPLETED. No further material issues allowed.");
        }

        // 2. Verify Raw Material Lot exists
        MaterialLot lot = materialLotRepository.findById(request.getLotId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Material Lot not found: " + request.getLotId()));

        // 3. HARD-STOP ENGINE: Validate Quality Clearance Status
        if (lot.getStatus() == LotStatus.QUARANTINED) {
            String errorMsg = String.format(
                    "CRITICAL HARD-STOP: Raw material lot [%s] is QUARANTINED! " +
                    "Quality Control clearance has NOT been granted. Material cannot be issued to production order [%s].",
                    lot.getLotId(), order.getPoId());
            log.error(errorMsg);
            throw new QuarantineBlockException(lot.getLotId(), lot.getStatus(), order.getPoId(), errorMsg);
        }

        if (lot.getStatus() == LotStatus.REJECTED) {
            String errorMsg = String.format(
                    "CRITICAL HARD-STOP: Raw material lot [%s] is REJECTED by Quality Control! " +
                    "Discard or return to supplier. Material cannot be issued to production order [%s].",
                    lot.getLotId(), order.getPoId());
            log.error(errorMsg);
            throw new QuarantineBlockException(lot.getLotId(), lot.getStatus(), order.getPoId(), errorMsg);
        }

        // 4. Verify Available Quantity
        BigDecimal requestedQty = request.getIssuedQty();
        if (lot.getAvailableQty().compareTo(requestedQty) < 0) {
            String errorMsg = String.format(
                    "INSUFFICIENT STOCK: Requested issue quantity [%s kg] exceeds available lot inventory [%s kg] for lot [%s].",
                    requestedQty, lot.getAvailableQty(), lot.getLotId());
            log.error(errorMsg);
            throw new IllegalArgumentException(errorMsg);
        }

        // 5. Deduct Issued Quantity from Available Lot Inventory
        BigDecimal newRemainingQty = lot.getAvailableQty().subtract(requestedQty);
        lot.setAvailableQty(newRemainingQty);
        materialLotRepository.save(lot);

        // 6. Record Material Issue in Immutable Audit Log
        MaterialIssue issue = MaterialIssue.builder()
                .productionOrder(order)
                .materialLot(lot)
                .issuedQty(requestedQty)
                .issuedAt(LocalDateTime.now())
                .build();
        MaterialIssue savedIssue = materialIssueRepository.save(issue);

        // 7. Transition Order from PLANNED to IN_PROGRESS upon first issue
        if (order.getStatus() == OrderStatus.PLANNED) {
            order.setStatus(OrderStatus.IN_PROGRESS);
            productionOrderRepository.save(order);
            log.info("Production order [{}] transitioned from PLANNED to IN_PROGRESS.", order.getPoId());
        }

        log.info("Material successfully issued. IssueID=[{}], Lot=[{}], Remaining=[{} kg]",
                savedIssue.getIssueId(), lot.getLotId(), newRemainingQty);

        return MaterialIssueResponse.builder()
                .issueId(savedIssue.getIssueId())
                .poId(order.getPoId())
                .lotId(lot.getLotId())
                .materialId(lot.getMaterial().getMaterialId())
                .materialName(lot.getMaterial().getName())
                .issuedQty(requestedQty)
                .remainingQty(newRemainingQty)
                .lotStatus(lot.getStatus())
                .issuedAt(savedIssue.getIssuedAt())
                .status("SUCCESS")
                .message("Material verified & issued successfully to " + order.getPoId())
                .build();
    }

    @Transactional(readOnly = true)
    public List<MaterialIssue> getIssuesForOrder(String poId) {
        return materialIssueRepository.findByProductionOrderPoIdOrderByIssuedAtDesc(poId);
    }

    @Transactional(readOnly = true)
    public List<MaterialIssue> getAllIssues() {
        return materialIssueRepository.findAllByOrderByIssuedAtDesc();
    }

    @Transactional(readOnly = true)
    public BigDecimal getTotalMaterialIssued(String poId) {
        BigDecimal sum = materialIssueRepository.sumIssuedQtyByPoId(poId);
        return sum != null ? sum : BigDecimal.ZERO;
    }
}
