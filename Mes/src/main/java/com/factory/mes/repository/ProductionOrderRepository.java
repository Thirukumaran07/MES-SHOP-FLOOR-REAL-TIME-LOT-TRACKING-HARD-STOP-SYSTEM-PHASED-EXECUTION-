package com.factory.mes.repository;

import com.factory.mes.entity.OrderStatus;
import com.factory.mes.entity.ProductionOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductionOrderRepository extends JpaRepository<ProductionOrder, String> {

    List<ProductionOrder> findByStatus(OrderStatus status);

    List<ProductionOrder> findAllByOrderByCreatedAtDesc();
}
