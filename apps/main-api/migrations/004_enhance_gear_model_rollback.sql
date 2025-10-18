-- Migration Rollback: 004_enhance_gear_model
-- Description: Remove comprehensive fields from gear table
-- Author: System
-- Date: 2024-10-18

-- Drop indexes
DROP INDEX IF EXISTS idx_gear_storage_location;
DROP INDEX IF EXISTS idx_gear_status;
DROP INDEX IF EXISTS idx_gear_subcategory;
DROP INDEX IF EXISTS idx_gear_category;

-- Drop columns
ALTER TABLE gear DROP COLUMN IF EXISTS status;
ALTER TABLE gear DROP COLUMN IF EXISTS specifications;
ALTER TABLE gear DROP COLUMN IF EXISTS last_maintenance;
ALTER TABLE gear DROP COLUMN IF EXISTS warranty_expiration;
ALTER TABLE gear DROP COLUMN IF EXISTS storage_location;
ALTER TABLE gear DROP COLUMN IF EXISTS material;
ALTER TABLE gear DROP COLUMN IF EXISTS color;
ALTER TABLE gear DROP COLUMN IF EXISTS dimensions;
ALTER TABLE gear DROP COLUMN IF EXISTS weight_oz;
ALTER TABLE gear DROP COLUMN IF EXISTS serial_number;
ALTER TABLE gear DROP COLUMN IF EXISTS condition;
ALTER TABLE gear DROP COLUMN IF EXISTS subcategory;
ALTER TABLE gear DROP COLUMN IF EXISTS category;
