-- Add serial_number column to nfa table
-- This migration adds an optional serial number field to the NFA items

ALTER TABLE nfa ADD COLUMN serial_number VARCHAR(100);