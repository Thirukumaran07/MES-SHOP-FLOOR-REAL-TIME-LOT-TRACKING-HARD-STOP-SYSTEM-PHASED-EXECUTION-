-- ==============================================================================
-- Seed Data for Medical Device Factory Shop-Floor System
-- ==============================================================================

-- 1. Raw Materials
INSERT INTO materials (material_id, name, unit)
VALUES ('MAT-PP-01', 'Medical Grade Polypropylene Resin (EP 3.1.3)', 'kg')
ON CONFLICT (material_id) DO NOTHING;

-- 2. Material Lots
-- Released Lot: Ready for injection molding line
INSERT INTO material_lots (lot_id, material_id, available_qty, status, created_at)
VALUES ('LOT-PP-2026-08A', 'MAT-PP-01', 1200.000, 'RELEASED', CURRENT_TIMESTAMP)
ON CONFLICT (lot_id) DO NOTHING;

-- Quarantined Lot: Awaiting quality lab particulate test results
INSERT INTO material_lots (lot_id, material_id, available_qty, status, created_at)
VALUES ('LOT-PP-2026-09B', 'MAT-PP-01', 800.000, 'QUARANTINED', CURRENT_TIMESTAMP)
ON CONFLICT (lot_id) DO NOTHING;

-- 3. Production Order (Target: 100,000 units)
INSERT INTO production_orders (po_id, product_name, target_qty, good_output, scrap_qty, status, created_at)
VALUES ('PO-2026-1001', '5ml Disposable Sterile Syringe (Luer-Lock)', 100000, 0, 0, 'PLANNED', CURRENT_TIMESTAMP)
ON CONFLICT (po_id) DO NOTHING;
