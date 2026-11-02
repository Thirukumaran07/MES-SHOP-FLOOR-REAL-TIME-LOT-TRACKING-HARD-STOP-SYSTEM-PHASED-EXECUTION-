package com.factory.mes.dto;

import com.factory.mes.entity.LotStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaterialIssueResponse {

    private Long issueId;
    private String poId;
    private String lotId;
    private String materialId;
    private String materialName;
    private BigDecimal issuedQty;
    private BigDecimal remainingQty;
    private LotStatus lotStatus;
    private LocalDateTime issuedAt;
    private String status;
    private String message;
}
