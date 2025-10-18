# Gear System Enhancement - Phase 1: Database & Model Updates

## Overview
Phase 1 extends the gear management system with comprehensive fields to support diverse gear types including tactical equipment, camping gear, communication devices, survival tools, optics, armor, medical supplies, and more.

## Completed Tasks

### 1. Database Migration
**Files Created:**
- `apps/main-api/migrations/004_enhance_gear_model.sql`
- `apps/main-api/migrations/004_enhance_gear_model_rollback.sql`

**New Columns Added:**
- `category` (VARCHAR 100) - Main gear category
- `subcategory` (VARCHAR 100) - Specific type within category
- `condition` (VARCHAR 50) - Physical condition
- `serial_number` (VARCHAR 255) - Serial/model number
- `weight_oz` (DECIMAL 10,2) - Weight in ounces
- `dimensions` (VARCHAR 100) - Physical dimensions
- `color` (VARCHAR 50) - Color/finish
- `material` (VARCHAR 100) - Primary material
- `storage_location` (VARCHAR 255) - Where item is stored
- `warranty_expiration` (TIMESTAMP) - Warranty end date
- `last_maintenance` (TIMESTAMP) - Last service/cleaning date
- `specifications` (TEXT) - JSON for category-specific specs
- `status` (VARCHAR 50, default: 'active') - Operational status

**Indexes Created:**
- `idx_gear_category` - For filtering by category
- `idx_gear_subcategory` - For filtering by subcategory
- `idx_gear_status` - For filtering by status
- `idx_gear_storage_location` - For location-based queries

### 2. Go Backend Model
**File Modified:** `apps/main-api/internal/models/gear.go`

**Updates:**
- Added all new fields to Gear struct
- Maintained backward compatibility with `Type` field (marked as legacy)
- Used proper types: `*decimal.Decimal` for prices/weights, `*time.Time` for dates
- Added JSON tags matching frontend expectations
- Specifications field stores JSON text for category-specific data

**Status:** ✅ Compiles successfully

### 3. TypeScript Type Definitions
**File Modified:** `packages/ui/src/types.ts`

**Updates:**
- Extended `Gear` interface with all new fields
- Created `GearSpecifications` interface for category-specific specs
- Maintained backward compatibility with existing code
- `CreateGearPayload` and `UpdateGearPayload` automatically include new fields

**GearSpecifications Structure:**
Supports specialized fields for different gear categories:
- **Optics:** magnification, objectiveLens, reticle, illuminated, turretType, mountType
- **Radios:** frequency, channels, range, batteryType, waterproof, encryption
- **Armor:** protectionLevel, coverage, expirationDate
- **Camping:** capacity, temperature, waterResistant, setupTime
- **Medical:** contents[], certifications[]
- **Lighting:** lumens, runtime, beamDistance
- **Knives/Tools:** bladeLength, bladeMaterial, handleMaterial, lockType
- Extensible with `[key: string]: any` for custom fields

## Database Schema

```sql
-- gear table now includes:
id (primary key)
created_at
updated_at
deleted_at
user_id (foreign key to users)
name (required)
type (legacy)
category (new - main category)
subcategory (new - specific type)
manufacturer
model_name
quantity
condition (new)
serial_number (new)
weight_oz (new)
dimensions (new)
color (new)
material (new)
storage_location (new)
warranty_expiration (new)
last_maintenance (new)
purchase_date
purchase_price
specifications (new - JSON)
status (new)
notes
pictures (JSON array)
```

## Categories Planned for Phase 2

The following categories will be implemented in the constants file:

1. **Tactical** - Plate carriers, chest rigs, holsters, pouches, slings
2. **Camping** - Tents, sleeping bags, stoves, water filters
3. **Communication** - Radios, antennas, headsets, PTTs
4. **Survival** - Fire starters, emergency shelters, signal devices
5. **Optics** - Scopes, red dots, night vision, thermal
6. **Protection** - Body armor, helmets, eye/ear protection
7. **Bags & Packs** - Backpacks, range bags, gun cases
8. **Medical** - IFAKs, tourniquets, trauma supplies
9. **Tools & Knives** - Multi-tools, fixed blades, axes
10. **Lighting** - Flashlights, headlamps, weapon lights
11. **Clothing** - Combat shirts/pants, boots, jackets
12. **Maintenance** - Cleaning kits, lubricants, solvents
13. **Storage** - Safes, cabinets, ammo boxes
14. **Electronics** - Batteries, chargers, power banks
15. **Other** - Miscellaneous items

## Migration Instructions

### Apply Migration
```bash
# Using your migration tool
psql -U username -d database_name -f apps/main-api/migrations/004_enhance_gear_model.sql
```

### Rollback (if needed)
```bash
psql -U username -d database_name -f apps/main-api/migrations/004_enhance_gear_model_rollback.sql
```

### Rebuild Backend
```bash
cd apps/main-api
go build -o bin/server ./cmd/api
```

## Backward Compatibility

- ✅ Existing gear items remain functional
- ✅ `type` field preserved for legacy support
- ✅ New fields are optional (NULL allowed)
- ✅ API responses include all fields
- ✅ Frontend can gradually adopt new fields

## Next Steps - Phase 2

1. Create comprehensive gear constants file with all categories and subcategories
2. Build the AddGearDrawerContent component with 4-step wizard
3. Implement category-specific specification forms
4. Create GearDetailsDrawerContent component
5. Update GearView to enable drawer integration

## Testing Recommendations

1. Test migration on development database
2. Verify existing gear items still display correctly
3. Create test gear items with new fields
4. Validate JSON specifications field
5. Test backward compatibility with old API calls

## Notes

- All new fields are optional to maintain backward compatibility
- The `specifications` field uses JSON for flexibility
- Weight is stored in ounces for consistency in calculations
- Status defaults to 'active' for new items
- Indexes added for common query patterns

---

**Status:** Phase 1 Complete ✅  
**Verified:** Backend compiles, TypeScript types valid  
**Ready for:** Phase 2 implementation
