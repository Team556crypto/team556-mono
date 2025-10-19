-- Rollback: Remove serial_number column from nfa table
-- This rollback removes the serial_number field from NFA items

ALTER TABLE nfa DROP COLUMN serial_number;