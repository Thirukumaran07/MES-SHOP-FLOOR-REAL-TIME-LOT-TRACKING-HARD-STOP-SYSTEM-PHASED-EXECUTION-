package com.factory.MesApplication.repository;

import com.factory.MesApplication.entity.OrderStatus;
import com.factory.MesApplication.entity.ProductionOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductionOrderRepository extends JpaRepository<ProductionOrder, String> {

    List<ProductionOrder> findByStatus(OrderStatus status);

    List<ProductionOrder> findAllByOrderByCreatedAtDesc();
}
