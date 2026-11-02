package com.factory.mes.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "materials")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Material {

    @Id
    @Column(name = "material_id", length = 50, nullable = false)
    private String materialId;

    @Column(name = "name", length = 100, nullable = false)
    private String name;

    @Column(name = "unit", length = 20, nullable = false)
    private String unit;
}
