package com.factory.MesApplication.controller;

import com.factory.MesApplication.dto.MaterialIssueRequest;
import com.factory.MesApplication.dto.MaterialIssueResponse;
import com.factory.MesApplication.entity.MaterialIssue;
import com.factory.MesApplication.service.MaterialIssueService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/issues")
@RequiredArgsConstructor
@Slf4j
public class MaterialIssueController {

    private final MaterialIssueService materialIssueService;

    /**
     * Primary Shop-Floor Operator QR Scan & Issue Endpoint.
     * Hard-stops any attempt to issue Quarantined or Rejected lots.
     */
    @PostMapping("/scan")
    public ResponseEntity<MaterialIssueResponse> scanAndIssueMaterial(
            @Valid @RequestBody MaterialIssueRequest request) {
        log.info("Received QR scan material issue request: {}", request);
        MaterialIssueResponse response = materialIssueService.issueMaterial(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get all material issues for a specific production order.
     */
    @GetMapping("/po/{poId}")
    public ResponseEntity<List<MaterialIssue>> getIssuesForOrder(@PathVariable String poId) {
        return ResponseEntity.ok(materialIssueService.getIssuesForOrder(poId));
    }

    /**
     * Get all material issues across all batches.
     */
    @GetMapping
    public ResponseEntity<List<MaterialIssue>> getAllIssues() {
        return ResponseEntity.ok(materialIssueService.getAllIssues());
    }
}
