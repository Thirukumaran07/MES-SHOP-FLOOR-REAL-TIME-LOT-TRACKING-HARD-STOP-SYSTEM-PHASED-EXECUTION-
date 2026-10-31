package com.factory.MesApplication.repository;

import com.factory.MesApplication.entity.MaterialIssue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface MaterialIssueRepository extends JpaRepository<MaterialIssue, Long> {

    List<MaterialIssue> findByProductionOrderPoIdOrderByIssuedAtDesc(String poId);

    List<MaterialIssue> findByMaterialLotLotIdOrderByIssuedAtDesc(String lotId);

    List<MaterialIssue> findAllByOrderByIssuedAtDesc();

    @Query("SELECT COALESCE(SUM(i.issuedQty), 0) FROM MaterialIssue i WHERE i.productionOrder.poId = :poId")
    BigDecimal sumIssuedQtyByPoId(@Param("poId") String poId);
}
