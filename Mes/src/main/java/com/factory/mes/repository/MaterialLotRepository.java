package com.factory.mes.repository;

import com.factory.mes.entity.LotStatus;
import com.factory.mes.entity.MaterialLot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MaterialLotRepository extends JpaRepository<MaterialLot, String> {

    List<MaterialLot> findByStatus(LotStatus status);

    List<MaterialLot> findAllByOrderByCreatedAtDesc();
}
