package com.factory.mes.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateProductionOrderRequest {

    @NotBlank(message = "Production Order ID is required (e.g. PO-2026-1002)")
    private String poId;

    @NotBlank(message = "Product Name is required")
    private String productName;

    @NotNull(message = "Target quantity is required")
    @Min(value = 1, message = "Target quantity must be at least 1 unit")
    private Integer targetQty;
}
