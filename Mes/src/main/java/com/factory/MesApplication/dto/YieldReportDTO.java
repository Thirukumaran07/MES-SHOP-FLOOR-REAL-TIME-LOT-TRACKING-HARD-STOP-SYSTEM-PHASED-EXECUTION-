package com.factory.MesApplication.dto;

import com.factory.MesApplication.entity.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class YieldReportDTO {

    private String poId;
    private String productName;
    private Integer targetQty;
    private Integer goodOutput;
    private Integer scrapQty;
    private Integer totalProduced;
    private OrderStatus orderStatus;

    /**
     * Total actual raw material issued from verified lots (in kg)
     */
    private BigDecimal totalMaterialIssued;

    /**
     * Standard Allowed Material = Good Output * 0.008 kg (8g per syringe)
     */
    private BigDecimal standardAllowedMaterial;

    /**
     * Material Variance Quantity = Total Material Issued - Standard Allowed Material (in kg)
     */
    private BigDecimal varianceQty;

    /**
     * Material Variance Percentage = (Variance Qty / Standard Allowed Material) * 100%
     */
    private BigDecimal variancePercentage;

    /**
     * Syringe Unit of measurement for raw material
     */
    private String unit;

    /**
     * Yield Efficiency % = Good Output / (Good Output + Scrap Qty) * 100%
     */
    private BigDecimal yieldEfficiency;

    /**
     * Scrap Rate % = Scrap Qty / (Good Output + Scrap Qty) * 100%
     */
    private BigDecimal scrapRatePercentage;

    /**
     * Material variance evaluation status (e.g., NORMAL, EXCESS_CONSUMPTION, UNDER_CONSUMPTION)
     */
    private String statusEvaluation;

    private String summary;
}
