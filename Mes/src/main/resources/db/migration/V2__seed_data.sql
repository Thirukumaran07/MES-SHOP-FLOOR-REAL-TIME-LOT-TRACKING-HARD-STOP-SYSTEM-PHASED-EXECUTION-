-- ==============================================================================
-- Flyway Migration V2: Initial Seed Data for Syringe Batch Production
-- ==============================================================================

-- 1. Insert Core Medical-Grade Raw Material
INSERT INTO materials (material_id, name, unit)
VALUES ('MAT-PP-01', 'Medical Grade Polypropylene Resin (EP 3.1.3)', 'kg')
ON CONFLICT (material_id) DO NOTHING;

-- 2. Insert Test Material Lots
-- LOT 1: Released for production (1,200 kg available)
INSERT INTO material_lots (lot_id, material_id, available_qty, status, created_at)
VALUES ('LOT-PP-2026-08A', 'MAT-PP-01', 1200.000, 'RELEASED', CURRENT_TIMESTAMP - INTERVAL '2 days')
ON CONFLICT (lot_id) DO NOTHING;

-- LOT 2: Quarantined pending bioburden / particulate lab clearance (800 kg available)
INSERT INTO material_lots (lot_id, material_id, available_qty, status, created_at)
VALUES ('LOT-PP-2026-09B', 'MAT-PP-01', 800.000, 'QUARANTINED', CURRENT_TIMESTAMP - INTERVAL '1 day')
ON CONFLICT (lot_id) DO NOTHING;

-- LOT 3: Optional rejected lot for hard-stop demonstration
INSERT INTO material_lots (lot_id, material_id, available_qty, status, created_at)
VALUES ('LOT-PP-2026-07X', 'MAT-PP-01', 450.000, 'REJECTED', CURRENT_TIMESTAMP - INTERVAL '3 days')
ON CONFLICT (lot_id) DO NOTHING;

-- 3. Insert Production Order for 100,000 syringe batch
INSERT INTO production_orders (po_id, product_name, target_qty, good_output, scrap_qty, status, created_at)
VALUES ('PO-2026-1001', '5ml Disposable Sterile Syringe (Luer-Lock)', 100000, 0, 0, 'PLANNED', CURRENT_TIMESTAMP)
ON CONFLICT (po_id) DO NOTHING;
