package com.factory.MesApplication.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "production_orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductionOrder {

    @Id
    @Column(name = "po_id", length = 50, nullable = false)
    private String poId;

    @Column(name = "product_name", length = 100, nullable = false)
    private String productName;

    @Column(name = "target_qty", nullable = false)
    private Integer targetQty;

    @Column(name = "good_output", nullable = false)
    @Builder.Default
    private Integer goodOutput = 0;

    @Column(name = "scrap_qty", nullable = false)
    @Builder.Default
    private Integer scrapQty = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private OrderStatus status = OrderStatus.PLANNED;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (goodOutput == null) {
            goodOutput = 0;
        }
        if (scrapQty == null) {
            scrapQty = 0;
        }
        if (status == null) {
            status = OrderStatus.PLANNED;
        }
    }
}
