package com.factory.mes.controller;

import com.factory.mes.dto.CreateMaterialLotRequest;
import com.factory.mes.dto.LotStatusUpdateRequest;
import com.factory.mes.entity.Material;
import com.factory.mes.entity.MaterialLot;
import com.factory.mes.service.QualityControlService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/quality")
@RequiredArgsConstructor
@Slf4j
public class QualityControlController {

    private final QualityControlService qualityControlService;

    /**
     * Get all material lots with their current quality status and inventory balance.
     */
    @GetMapping("/lots")
    public ResponseEntity<List<MaterialLot>> getAllLots() {
        return ResponseEntity.ok(qualityControlService.getAllLots());
    }

    /**
     * Get single material lot details by ID.
     */
    @GetMapping("/lots/{lotId}")
    public ResponseEntity<MaterialLot> getLotById(@PathVariable String lotId) {
        return ResponseEntity.ok(qualityControlService.getLotById(lotId));
    }

    /**
     * QC Status Modification Endpoint.
     * Allows Quality Control to toggle lot status (QUARANTINED, RELEASED, REJECTED).
     */
    @PutMapping("/lots/{lotId}/status")
    public ResponseEntity<MaterialLot> updateLotStatus(
            @PathVariable String lotId,
            @Valid @RequestBody LotStatusUpdateRequest request) {
        log.info("Updating QC status for lot [{}] to [{}]", lotId, request.getStatus());
        MaterialLot updatedLot = qualityControlService.updateLotStatus(lotId, request.getStatus(), request.getReason());
        return ResponseEntity.ok(updatedLot);
    }

    /**
     * Register a new raw material lot.
     */
    @PostMapping("/lots")
    public ResponseEntity<MaterialLot> createLot(@Valid @RequestBody CreateMaterialLotRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(qualityControlService.createLot(request));
    }

    /**
     * Get all materials registered in system.
     */
    @GetMapping("/materials")
    public ResponseEntity<List<Material>> getAllMaterials() {
        return ResponseEntity.ok(qualityControlService.getAllMaterials());
    }
}
