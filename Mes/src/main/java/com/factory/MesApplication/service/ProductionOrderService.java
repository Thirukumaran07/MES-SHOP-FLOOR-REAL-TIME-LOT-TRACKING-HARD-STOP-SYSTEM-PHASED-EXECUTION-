package com.factory.MesApplication.service;

import com.factory.MesApplication.dto.BatchOutputUpdateRequest;
import com.factory.MesApplication.dto.CreateProductionOrderRequest;
import com.factory.MesApplication.entity.OrderStatus;
import com.factory.MesApplication.entity.ProductionOrder;
import com.factory.MesApplication.exception.ResourceNotFoundException;
import com.factory.MesApplication.repository.ProductionOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductionOrderService {

    private final ProductionOrderRepository productionOrderRepository;

    @Transactional(readOnly = true)
    public List<ProductionOrder> getAllOrders() {
        return productionOrderRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public ProductionOrder getOrderById(String poId) {
        return productionOrderRepository.findById(poId)
                .orElseThrow(() -> new ResourceNotFoundException("Production order not found: " + poId));
    }

    @Transactional
    public ProductionOrder createOrder(CreateProductionOrderRequest request) {
        if (productionOrderRepository.existsById(request.getPoId())) {
            throw new IllegalArgumentException("Production Order with ID [" + request.getPoId() + "] already exists.");
        }

        ProductionOrder order = ProductionOrder.builder()
                .poId(request.getPoId())
                .productName(request.getProductName())
                .targetQty(request.getTargetQty())
                .goodOutput(0)
                .scrapQty(0)
                .status(OrderStatus.PLANNED)
                .createdAt(LocalDateTime.now())
                .build();

        log.info("Created new production order: [{}] for [{}] target units", order.getPoId(), order.getTargetQty());
        return productionOrderRepository.save(order);
    }

    @Transactional
    public ProductionOrder updateOutput(String poId, BatchOutputUpdateRequest request) {
        ProductionOrder order = getOrderById(poId);

        log.info("Updating production order output for [{}]: GoodOutput=[{}], ScrapQty=[{}], Status=[{}]",
                poId, request.getGoodOutput(), request.getScrapQty(), request.getStatus());

        order.setGoodOutput(request.getGoodOutput());
        order.setScrapQty(request.getScrapQty());

        if (request.getStatus() != null) {
            order.setStatus(request.getStatus());
        } else if (order.getGoodOutput() >= order.getTargetQty()) {
            order.setStatus(OrderStatus.COMPLETED);
        } else if (order.getStatus() == OrderStatus.PLANNED && (order.getGoodOutput() > 0 || order.getScrapQty() > 0)) {
            order.setStatus(OrderStatus.IN_PROGRESS);
        }

        return productionOrderRepository.save(order);
    }
}
