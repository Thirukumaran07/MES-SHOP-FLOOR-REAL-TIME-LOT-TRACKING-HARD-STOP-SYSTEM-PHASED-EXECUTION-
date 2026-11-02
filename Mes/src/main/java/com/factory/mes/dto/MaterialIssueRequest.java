package com.factory.mes.dto;

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
public class MaterialIssueRequest {

    @NotBlank(message = "Production Order ID (poId) is required")
    private String poId;

    @NotBlank(message = "Material Lot ID (lotId) is required")
    private String lotId;

    @NotNull(message = "Issued quantity (issuedQty) is required")
    @DecimalMin(value = "0.001", message = "Issued quantity must be greater than zero (minimum 0.001 kg)")
    private BigDecimal issuedQty;
}
