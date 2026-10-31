-- ==============================================================================
-- Flyway Migration V1: Initial Schema for Medical Device Shop-Floor MES
-- Strict PostgreSQL ENUMs, Foreign Keys, Check Constraints, and Indexes
-- ==============================================================================

-- 1. Create PostgreSQL ENUM Types
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lot_status_enum') THEN
        CREATE TYPE lot_status_enum AS ENUM ('QUARANTINED', 'RELEASED', 'REJECTED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status_enum') THEN
        CREATE TYPE order_status_enum AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED');
    END IF;
END $$;

-- 2. Materials Definition Table
CREATE TABLE IF NOT EXISTS materials (
    material_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    unit VARCHAR(20) NOT NULL
);

-- 3. Raw Material Lots Table (with strict lot_status_enum)
CREATE TABLE IF NOT EXISTS material_lots (
    lot_id VARCHAR(50) PRIMARY KEY,
    material_id VARCHAR(50) NOT NULL,
    available_qty NUMERIC(12, 3) NOT NULL CHECK (available_qty >= 0),
    status lot_status_enum NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_material_lots_material FOREIGN KEY (material_id) REFERENCES materials (material_id) ON DELETE RESTRICT
);

-- 4. Production Orders Table (with strict order_status_enum)
CREATE TABLE IF NOT EXISTS production_orders (
    po_id VARCHAR(50) PRIMARY KEY,
    product_name VARCHAR(100) NOT NULL,
    target_qty INT NOT NULL CHECK (target_qty > 0),
    good_output INT NOT NULL DEFAULT 0 CHECK (good_output >= 0),
    scrap_qty INT NOT NULL DEFAULT 0 CHECK (scrap_qty >= 0),
    status order_status_enum NOT NULL DEFAULT 'PLANNED',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Material Issues Audit Trail Table
CREATE TABLE IF NOT EXISTS material_issues (
    issue_id BIGSERIAL PRIMARY KEY,
    po_id VARCHAR(50) NOT NULL,
    lot_id VARCHAR(50) NOT NULL,
    issued_qty NUMERIC(12, 3) NOT NULL CHECK (issued_qty > 0),
    issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_material_issues_po FOREIGN KEY (po_id) REFERENCES production_orders (po_id) ON DELETE RESTRICT,
    CONSTRAINT fk_material_issues_lot FOREIGN KEY (lot_id) REFERENCES material_lots (lot_id) ON DELETE RESTRICT
);

-- 6. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_material_lots_material ON material_lots(material_id);
CREATE INDEX IF NOT EXISTS idx_material_lots_status ON material_lots(status);
CREATE INDEX IF NOT EXISTS idx_production_orders_status ON production_orders(status);
CREATE INDEX IF NOT EXISTS idx_material_issues_po ON material_issues(po_id);
CREATE INDEX IF NOT EXISTS idx_material_issues_lot ON material_issues(lot_id);
