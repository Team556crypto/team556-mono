-- Migration: 004_enhance_gear_model
-- Description: Add comprehensive fields to gear table for tactical, camping, communication, survival, and other gear types
-- Author: System
-- Date: 2024-10-18

-- Add new columns to gear table
ALTER TABLE gear ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE gear ADD COLUMN IF NOT EXISTS subcategory VARCHAR(100);
ALTER TABLE gear ADD COLUMN IF NOT EXISTS condition VARCHAR(50);
ALTER TABLE gear ADD COLUMN IF NOT EXISTS serial_number VARCHAR(255);
ALTER TABLE gear ADD COLUMN IF NOT EXISTS weight_oz DECIMAL(10,2);
ALTER TABLE gear ADD COLUMN IF NOT EXISTS dimensions VARCHAR(100);
ALTER TABLE gear ADD COLUMN IF NOT EXISTS color VARCHAR(50);
ALTER TABLE gear ADD COLUMN IF NOT EXISTS material VARCHAR(100);
ALTER TABLE gear ADD COLUMN IF NOT EXISTS storage_location VARCHAR(255);
ALTER TABLE gear ADD COLUMN IF NOT EXISTS warranty_expiration TIMESTAMP;
ALTER TABLE gear ADD COLUMN IF NOT EXISTS last_maintenance TIMESTAMP;
ALTER TABLE gear ADD COLUMN IF NOT EXISTS specifications TEXT;
ALTER TABLE gear ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';

-- Create indexes for frequently queried fields
CREATE INDEX IF NOT EXISTS idx_gear_category ON gear(category);
CREATE INDEX IF NOT EXISTS idx_gear_subcategory ON gear(subcategory);
CREATE INDEX IF NOT EXISTS idx_gear_status ON gear(status);
CREATE INDEX IF NOT EXISTS idx_gear_storage_location ON gear(storage_location);

-- Add comments for documentation
COMMENT ON COLUMN gear.category IS 'Main gear category: tactical, camping, communication, survival, optics, protection, bags, medical, tools, lighting, clothing, maintenance, storage, electronics, other';
COMMENT ON COLUMN gear.subcategory IS 'Specific type within category (e.g., plate_carrier, tent, handheld_radio)';
COMMENT ON COLUMN gear.condition IS 'Physical condition: new, excellent, good, fair, poor';
COMMENT ON COLUMN gear.weight_oz IS 'Weight in ounces for packing/load calculations';
COMMENT ON COLUMN gear.specifications IS 'JSON object containing category-specific specifications (magnification, frequency, protection level, etc.)';
COMMENT ON COLUMN gear.status IS 'Operational status: active, retired, loaned, repair, for_sale';
