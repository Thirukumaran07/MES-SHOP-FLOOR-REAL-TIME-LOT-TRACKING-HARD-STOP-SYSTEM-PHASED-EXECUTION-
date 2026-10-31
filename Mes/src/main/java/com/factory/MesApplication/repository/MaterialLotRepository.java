package com.factory.MesApplication.repository;

import com.factory.MesApplication.entity.LotStatus;
import com.factory.MesApplication.entity.MaterialLot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MaterialLotRepository extends JpaRepository<MaterialLot, String> {

    List<MaterialLot> findByStatus(LotStatus status);

    List<MaterialLot> findAllByOrderByCreatedAtDesc();
}
