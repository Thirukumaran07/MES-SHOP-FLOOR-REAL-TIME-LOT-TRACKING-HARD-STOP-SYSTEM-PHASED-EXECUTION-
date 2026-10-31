package com.factory.mes.service;

import com.factory.MesApplication.dto.MaterialIssueRequest;
import com.factory.MesApplication.dto.MaterialIssueResponse;
import com.factory.MesApplication.entity.LotStatus;
import com.factory.MesApplication.entity.Material;
import com.factory.MesApplication.entity.MaterialIssue;
import com.factory.MesApplication.entity.MaterialLot;
import com.factory.MesApplication.entity.OrderStatus;
import com.factory.MesApplication.entity.ProductionOrder;
import com.factory.MesApplication.exception.QuarantineBlockException;
import com.factory.MesApplication.exception.ResourceNotFoundException;
import com.factory.MesApplication.repository.MaterialIssueRepository;
import com.factory.MesApplication.repository.MaterialLotRepository;
import com.factory.MesApplication.repository.ProductionOrderRepository;
import com.factory.MesApplication.service.MaterialIssueService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MaterialIssueServiceTest {

    @Mock
    private MaterialLotRepository materialLotRepository;

    @Mock
    private ProductionOrderRepository productionOrderRepository;

    @Mock
    private MaterialIssueRepository materialIssueRepository;

    @InjectMocks
    private MaterialIssueService materialIssueService;

    private ProductionOrder activeOrder;
    private Material sampleMaterial;
    private MaterialLot releasedLot;
    private MaterialLot quarantinedLot;
    private MaterialLot rejectedLot;

    @BeforeEach
    void setUp() {
        sampleMaterial = Material.builder()
                .materialId("MAT-PP-01")
                .name("Medical Grade Polypropylene Resin")
                .unit("kg")
                .build();

        activeOrder = ProductionOrder.builder()
                .poId("PO-2026-1001")
                .productName("5ml Disposable Sterile Syringe")
                .targetQty(100000)
                .goodOutput(0)
                .scrapQty(0)
                .status(OrderStatus.PLANNED)
                .createdAt(LocalDateTime.now())
                .build();

        releasedLot = MaterialLot.builder()
                .lotId("LOT-PP-2026-08A")
                .material(sampleMaterial)
                .availableQty(new BigDecimal("1200.000"))
                .status(LotStatus.RELEASED)
                .createdAt(LocalDateTime.now().minusDays(1))
                .build();

        quarantinedLot = MaterialLot.builder()
                .lotId("LOT-PP-2026-09B")
                .material(sampleMaterial)
                .availableQty(new BigDecimal("800.000"))
                .status(LotStatus.QUARANTINED)
                .createdAt(LocalDateTime.now().minusDays(1))
                .build();

        rejectedLot = MaterialLot.builder()
                .lotId("LOT-PP-2026-07X")
                .material(sampleMaterial)
                .availableQty(new BigDecimal("450.000"))
                .status(LotStatus.REJECTED)
                .createdAt(LocalDateTime.now().minusDays(2))
                .build();
    }

    @Test
    @DisplayName("HARD-STOP ENGINE: Must immediately block QUARANTINED lot from being issued")
    void shouldThrowQuarantineBlockException_WhenLotIsQuarantined() {
        MaterialIssueRequest request = MaterialIssueRequest.builder()
                .poId("PO-2026-1001")
                .lotId("LOT-PP-2026-09B")
                .issuedQty(new BigDecimal("200.000"))
                .build();

        when(productionOrderRepository.findById("PO-2026-1001")).thenReturn(Optional.of(activeOrder));
        when(materialLotRepository.findById("LOT-PP-2026-09B")).thenReturn(Optional.of(quarantinedLot));

        assertThatThrownBy(() -> materialIssueService.issueMaterial(request))
                .isInstanceOf(QuarantineBlockException.class)
                .hasMessageContaining("CRITICAL HARD-STOP")
                .hasMessageContaining("QUARANTINED");

        verify(materialLotRepository, never()).save(any());
        verify(materialIssueRepository, never()).save(any());
    }

    @Test
    @DisplayName("HARD-STOP ENGINE: Must immediately block REJECTED lot from being issued")
    void shouldThrowQuarantineBlockException_WhenLotIsRejected() {
        MaterialIssueRequest request = MaterialIssueRequest.builder()
                .poId("PO-2026-1001")
                .lotId("LOT-PP-2026-07X")
                .issuedQty(new BigDecimal("100.000"))
                .build();

        when(productionOrderRepository.findById("PO-2026-1001")).thenReturn(Optional.of(activeOrder));
        when(materialLotRepository.findById("LOT-PP-2026-07X")).thenReturn(Optional.of(rejectedLot));

        assertThatThrownBy(() -> materialIssueService.issueMaterial(request))
                .isInstanceOf(QuarantineBlockException.class)
                .hasMessageContaining("CRITICAL HARD-STOP")
                .hasMessageContaining("REJECTED");

        verify(materialLotRepository, never()).save(any());
        verify(materialIssueRepository, never()).save(any());
    }

    @Test
    @DisplayName("INVENTORY CHECK: Must throw exception when requested weight exceeds available balance")
    void shouldThrowIllegalArgumentException_WhenRequestedQtyExceedsAvailable() {
        MaterialIssueRequest request = MaterialIssueRequest.builder()
                .poId("PO-2026-1001")
                .lotId("LOT-PP-2026-08A")
                .issuedQty(new BigDecimal("1500.000")) // Available is 1200
                .build();

        when(productionOrderRepository.findById("PO-2026-1001")).thenReturn(Optional.of(activeOrder));
        when(materialLotRepository.findById("LOT-PP-2026-08A")).thenReturn(Optional.of(releasedLot));

        assertThatThrownBy(() -> materialIssueService.issueMaterial(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("INSUFFICIENT STOCK");

        verify(materialLotRepository, never()).save(any());
        verify(materialIssueRepository, never()).save(any());
    }

    @Test
    @DisplayName("SUCCESSFUL ISSUE: Deducts inventory, logs audit entry, and transitions order to IN_PROGRESS")
    void shouldSuccessfullyIssueMaterial_WhenLotIsReleased() {
        MaterialIssueRequest request = MaterialIssueRequest.builder()
                .poId("PO-2026-1001")
                .lotId("LOT-PP-2026-08A")
                .issuedQty(new BigDecimal("300.000"))
                .build();

        when(productionOrderRepository.findById("PO-2026-1001")).thenReturn(Optional.of(activeOrder));
        when(materialLotRepository.findById("LOT-PP-2026-08A")).thenReturn(Optional.of(releasedLot));

        MaterialIssue savedIssue = MaterialIssue.builder()
                .issueId(101L)
                .productionOrder(activeOrder)
                .materialLot(releasedLot)
                .issuedQty(new BigDecimal("300.000"))
                .issuedAt(LocalDateTime.now())
                .build();
        when(materialIssueRepository.save(any(MaterialIssue.class))).thenReturn(savedIssue);

        MaterialIssueResponse response = materialIssueService.issueMaterial(request);

        assertThat(response).isNotNull();
        assertThat(response.getIssueId()).isEqualTo(101L);
        assertThat(response.getPoId()).isEqualTo("PO-2026-1001");
        assertThat(response.getLotId()).isEqualTo("LOT-PP-2026-08A");
        assertThat(response.getIssuedQty()).isEqualByComparingTo(new BigDecimal("300.000"));
        assertThat(response.getRemainingQty()).isEqualByComparingTo(new BigDecimal("900.000"));
        assertThat(response.getStatus()).isEqualTo("SUCCESS");

        // Verify remaining quantity updated in lot
        ArgumentCaptor<MaterialLot> lotCaptor = ArgumentCaptor.forClass(MaterialLot.class);
        verify(materialLotRepository).save(lotCaptor.capture());
        assertThat(lotCaptor.getValue().getAvailableQty()).isEqualByComparingTo(new BigDecimal("900.000"));

        // Verify order transitioned to IN_PROGRESS
        ArgumentCaptor<ProductionOrder> orderCaptor = ArgumentCaptor.forClass(ProductionOrder.class);
        verify(productionOrderRepository).save(orderCaptor.capture());
        assertThat(orderCaptor.getValue().getStatus()).isEqualTo(OrderStatus.IN_PROGRESS);
    }

    @Test
    @DisplayName("ORDER NOT FOUND: Should throw ResourceNotFoundException when PO does not exist")
    void shouldThrowNotFound_WhenOrderDoesNotExist() {
        MaterialIssueRequest request = MaterialIssueRequest.builder()
                .poId("PO-NON-EXISTENT")
                .lotId("LOT-PP-2026-08A")
                .issuedQty(new BigDecimal("100.000"))
                .build();

        when(productionOrderRepository.findById("PO-NON-EXISTENT")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> materialIssueService.issueMaterial(request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Production Order not found");
    }
}
