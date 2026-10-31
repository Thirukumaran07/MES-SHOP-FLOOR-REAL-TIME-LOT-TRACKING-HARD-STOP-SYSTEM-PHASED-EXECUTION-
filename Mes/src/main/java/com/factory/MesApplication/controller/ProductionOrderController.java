package com.factory.MesApplication.controller;

import com.factory.MesApplication.dto.BatchOutputUpdateRequest;
import com.factory.MesApplication.dto.CreateProductionOrderRequest;
import com.factory.MesApplication.dto.YieldReportDTO;
import com.factory.MesApplication.entity.ProductionOrder;
import com.factory.MesApplication.service.ProductionOrderService;
import com.factory.MesApplication.service.YieldAnalyticsService;
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
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
@Slf4j
public class ProductionOrderController {

    private final ProductionOrderService productionOrderService;
    private final YieldAnalyticsService yieldAnalyticsService;

    /**
     * List all production orders.
     */
    @GetMapping
    public ResponseEntity<List<ProductionOrder>> getAllOrders() {
        return ResponseEntity.ok(productionOrderService.getAllOrders());
    }

    /**
     * Get specific production order details.
     */
    @GetMapping("/{poId}")
    public ResponseEntity<ProductionOrder> getOrderById(@PathVariable String poId) {
        return ResponseEntity.ok(productionOrderService.getOrderById(poId));
    }

    /**
     * Create a new production order.
     */
    @PostMapping
    public ResponseEntity<ProductionOrder> createOrder(@Valid @RequestBody CreateProductionOrderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productionOrderService.createOrder(request));
    }

    /**
     * Update good output and scrap counts for an order.
     */
    @PutMapping("/{poId}/output")
    public ResponseEntity<ProductionOrder> updateBatchOutput(
            @PathVariable String poId,
            @Valid @RequestBody BatchOutputUpdateRequest request) {
        return ResponseEntity.ok(productionOrderService.updateOutput(poId, request));
    }

    /**
     * Retrieve real-time yield analytics and variance calculations for an order.
     */
    @GetMapping("/{poId}/yield")
    public ResponseEntity<YieldReportDTO> getOrderYieldReport(@PathVariable String poId) {
        return ResponseEntity.ok(yieldAnalyticsService.getYieldReport(poId));
    }

    /**
     * Retrieve all batch yield reports across the plant.
     */
    @GetMapping("/yield-reports")
    public ResponseEntity<List<YieldReportDTO>> getAllYieldReports() {
        return ResponseEntity.ok(yieldAnalyticsService.getAllYieldReports());
    }
}
