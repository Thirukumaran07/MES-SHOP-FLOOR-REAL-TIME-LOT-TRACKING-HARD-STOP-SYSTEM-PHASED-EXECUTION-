package com.factory.MesApplication.dto;

import com.factory.MesApplication.entity.LotStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LotStatusUpdateRequest {

    @NotNull(message = "New lot status is required (QUARANTINED, RELEASED, REJECTED)")
    private LotStatus status;

    private String reason;
}
