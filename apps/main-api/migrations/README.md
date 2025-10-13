# Database Migrations

This directory contains SQL migration files for the main-api database schema changes.

## Migration Strategy

This project uses **GORM AutoMigrate** as the primary migration strategy, which automatically creates and updates database schema based on the Go struct definitions in `internal/models/`.

The SQL files in this directory serve as:
1. **Documentation** of schema changes
2. **Manual migration option** if AutoMigrate needs to be bypassed
3. **Rollback scripts** for reverting changes if needed

## Current Migrations

### 001_add_pos_wallet_addresses.sql
- **Purpose**: Add POS wallet address fields to users table
- **Changes**: 
  - Adds `primary_wallet_address` VARCHAR(44) column
  - Adds `secondary_wallet_address` VARCHAR(44) nullable column
  - Creates indexes for both columns
- **Rollback**: Use `001_add_pos_wallet_addresses_rollback.sql`

## How to Use

### Automatic (Recommended)
The migrations will be applied automatically when you start the server due to GORM AutoMigrate in `internal/database/database.go`.

```bash
cd apps/main-api
go run cmd/api/main.go
```

### Manual Migration
If you need to run migrations manually:

```bash
# Connect to your PostgreSQL database
psql $DATABASE_URL

# Run the migration
\i migrations/001_add_pos_wallet_addresses.sql
```

### Rollback
To rollback a migration:

```bash
# Connect to your PostgreSQL database  
psql $DATABASE_URL

# Run the rollback
\i migrations/001_add_pos_wallet_addresses_rollback.sql
```

## Verifying Migrations

After running migrations, verify the changes:

```sql
-- Check if columns were added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('primary_wallet_address', 'secondary_wallet_address');

-- Check if indexes were created
SELECT indexname FROM pg_indexes WHERE tablename = 'users' AND indexname LIKE '%wallet%';
```

## Database Schema

The users table after migration:

```sql
Table "public.users"
            Column            |           Type           | Nullable |        Default
------------------------------+--------------------------+----------+----------------------
 id                          | bigserial               | not null | 
 created_at                  | timestamp with time zone |          | 
 updated_at                  | timestamp with time zone |          | 
 deleted_at                  | timestamp with time zone |          | 
 first_name                  | text                     |          | 
 last_name                   | text                     |          | 
 email                       | text                     | not null | 
 password                    | text                     |          | 
 user_code                   | varchar(8)               |          | 
 email_verified              | boolean                  |          | false
 email_verification_code     | text                     |          | 
 email_verification_expires_at| timestamp with time zone |          | 
 primary_wallet_address      | varchar(44)              |          | ''::character varying
 secondary_wallet_address    | varchar(44)              |          | 
```