package com.factory.mes.service;

import com.factory.mes.dto.CreateMaterialLotRequest;
import com.factory.mes.entity.LotStatus;
import com.factory.mes.entity.Material;
import com.factory.mes.entity.MaterialLot;
import com.factory.mes.exception.ResourceNotFoundException;
import com.factory.mes.repository.MaterialLotRepository;
import com.factory.mes.repository.MaterialRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class QualityControlService {

    private final MaterialLotRepository materialLotRepository;
    private final MaterialRepository materialRepository;

    @Transactional(readOnly = true)
    public List<MaterialLot> getAllLots() {
        return materialLotRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public MaterialLot getLotById(String lotId) {
        return materialLotRepository.findById(lotId)
                .orElseThrow(() -> new ResourceNotFoundException("Material Lot not found: " + lotId));
    }

    @Transactional
    public MaterialLot updateLotStatus(String lotId, LotStatus newStatus, String reason) {
        MaterialLot lot = getLotById(lotId);
        LotStatus previousStatus = lot.getStatus();

        log.info("QC Status Change for Lot [{}]: [{}] -> [{}]. Reason: {}",
                lotId, previousStatus, newStatus, reason != null ? reason : "Standard QC inspection");

        lot.setStatus(newStatus);
        return materialLotRepository.save(lot);
    }

    @Transactional
    public MaterialLot createLot(CreateMaterialLotRequest request) {
        Material material = materialRepository.findById(request.getMaterialId())
                .orElseThrow(() -> new ResourceNotFoundException("Material not found: " + request.getMaterialId()));

        if (materialLotRepository.existsById(request.getLotId())) {
            throw new IllegalArgumentException("Material lot already exists: " + request.getLotId());
        }

        MaterialLot lot = MaterialLot.builder()
                .lotId(request.getLotId())
                .material(material)
                .availableQty(request.getAvailableQty())
                .status(request.getStatus())
                .createdAt(LocalDateTime.now())
                .build();

        return materialLotRepository.save(lot);
    }

    @Transactional(readOnly = true)
    public List<Material> getAllMaterials() {
        return materialRepository.findAll();
    }
}
