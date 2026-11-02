package com.factory.mes.dto;

import com.factory.mes.entity.LotStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateMaterialLotRequest {

    @NotBlank(message = "Lot ID is required (e.g. LOT-PP-2026-10A)")
    private String lotId;

    @NotBlank(message = "Material ID is required")
    private String materialId;

    @NotNull(message = "Available quantity is required")
    @DecimalMin(value = "0.001", message = "Available quantity must be positive")
    private BigDecimal availableQty;

    @NotNull(message = "Initial lot status is required (QUARANTINED, RELEASED, REJECTED)")
    private LotStatus status;
}
