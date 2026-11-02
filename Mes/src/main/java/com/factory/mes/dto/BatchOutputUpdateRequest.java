package com.factory.mes.dto;

import com.factory.mes.entity.OrderStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchOutputUpdateRequest {

    @NotNull(message = "Good output count is required")
    @Min(value = 0, message = "Good output count must be zero or positive")
    private Integer goodOutput;

    @NotNull(message = "Scrap quantity count is required")
    @Min(value = 0, message = "Scrap quantity count must be zero or positive")
    private Integer scrapQty;

    private OrderStatus status;
}
