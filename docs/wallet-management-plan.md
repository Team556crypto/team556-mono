# Wallet Management Integration in POS System

## Overview

This document outlines the research findings and implementation plan to integrate wallet management functionality into the Team556 POS system. The research reveals that the backend already has robust wallet functionality implemented, and the focus should be on creating a comprehensive POS frontend interface and potentially extending the backend API as needed.

---

## Current System Analysis

### Backend Wallet Infrastructure (main-api)

The backend already has a **comprehensive wallet management system** implemented:

#### Existing Database Models:
- **User Model** (`internal/models/user.go`):
  - Contains wallet relationship: `Wallets []Wallet`
  - User authentication and verification system

- **Wallet Model** (`internal/models/wallet.go`):
  - Fields: ID, UserID, Address, Name, EncryptedMnemonic, EncryptionMetadata
  - Secure encrypted mnemonic storage using AES encryption
  - Unique wallet addresses with database constraints

#### Existing API Endpoints (`/api/wallet/*`):

**Wallet Creation:**
- `POST /api/wallet/create` - Creates new wallet with encrypted mnemonic storage
- Requires password for encryption
- Returns mnemonic phrase to client (one-time only)

**Wallet Information:**
- `GET /api/wallet/balance` - Get SOL balance for user's primary wallet
- `GET /api/wallet/balance/team` - Get TEAM token balance and price
- `POST /api/wallet/recovery-phrase` - Decrypt and retrieve mnemonic (requires password)

**Transaction Management:**
- `POST /api/wallet/sign-transaction` - Sign transactions using encrypted mnemonic
- `POST /api/wallet/send-transaction` - Send signed transactions to blockchain
- `POST /api/wallet/transactions` - Get transaction history
- `POST /api/wallet/webhook` - Webhook proxy for merchant notifications

**Presale Integration:**
- `POST /api/wallet/presale/check` - Validate presale codes
- `POST /api/wallet/presale/redeem` - Redeem presale codes and associate with wallet

#### Security Features:
- **AES Encryption**: Mnemonics encrypted with user password
- **JWT Authentication**: All wallet endpoints protected
- **Solana API Integration**: Proxied blockchain interactions
- **Transaction Security**: Server-side signing with encrypted keys

### Current Limitations for POS Use Case:

1. **Single Wallet Design**: Current system assumes one wallet per user
2. **No Wallet Management UI**: No add/remove/list multiple wallets functionality  
3. **No Default Wallet Selection**: Cannot set preferred wallet for POS payments
4. **Limited Wallet Metadata**: Only basic name field, no POS-specific settings

---

## Implementation Plan for POS Wallet Management

### Phase 1: Backend API Extensions (main-api)

#### New API Endpoints Needed:

```go
// Wallet Management
GET    /api/wallet/list              // List all user wallets with balances
POST   /api/wallet/add               // Add existing wallet by mnemonic/private key  
DELETE /api/wallet/:id               // Remove wallet from user account
PATCH  /api/wallet/:id/default       // Set wallet as default for POS
PATCH  /api/wallet/:id/name          // Update wallet display name
```

#### Database Schema Updates:

```go
// Add to Wallet model:
type Wallet struct {
    // ... existing fields
    IsDefault     bool   `json:"is_default" gorm:"default:false"`
    WalletType    string `json:"wallet_type" gorm:"default:created"` // "created", "imported"  
    DisplayOrder  int    `json:"display_order" gorm:"default:0"`
}
```

#### Business Logic Updates:
- **Multi-wallet Support**: Allow multiple wallets per user
- **Default Wallet Management**: Ensure only one default per user
- **Wallet Import**: Support importing existing wallets via mnemonic
- **Balance Aggregation**: Show combined balance across all wallets

### Phase 2: POS Frontend Integration

#### Wallet Management UI Components:

1. **Wallet List View**:
   - Display all connected wallets with addresses and balances
   - Show default wallet indicator
   - Real-time balance updates

2. **Add Wallet Modal**:
   - Option 1: Generate new wallet
   - Option 2: Import existing wallet (mnemonic/private key)
   - Secure input handling and validation

3. **Wallet Settings**:
   - Set default wallet for POS payments
   - Rename wallet display names
   - Remove wallets with confirmation

4. **Wallet Selection in POS**:
   - Quick wallet switcher during checkout
   - Default wallet auto-selection
   - Balance verification before transactions

#### Integration with POS Store:
```typescript
// POS Store Extensions
interface WalletState {
  wallets: Wallet[]
  defaultWallet: Wallet | null
  isLoading: boolean
  selectedWallet: Wallet | null
}

// Actions needed:
- fetchWallets()
- addWallet(type: 'create' | 'import', data: any)
- setDefaultWallet(walletId: string)
- removeWallet(walletId: string)
- selectWalletForTransaction(walletId: string)
```

### Phase 3: Enhanced POS Features

#### Payment Flow Integration:
1. **Pre-transaction Validation**:
   - Check selected wallet balance
   - Verify network connectivity
   - Validate transaction amounts

2. **Multi-wallet Payment Options**:
   - Allow customers to specify receiving wallet
   - Support different wallets for different payment types
   - Automatic wallet switching based on token type

3. **Transaction History**:
   - Per-wallet transaction filtering
   - Combined transaction history view
   - Export functionality for accounting

#### Security Enhancements:
- **Session-based Wallet Selection**: Don't store sensitive data
- **Transaction Confirmation**: Double-confirmation for large amounts  
- **Audit Logging**: Track wallet management actions
- **Backup Reminders**: Prompt users to backup new wallets

---

## Technical Implementation Details

### Frontend API Client Updates:

```typescript
// New wallet management endpoints
export const walletApi = {
  listWallets: () => api.get('/api/wallet/list'),
  addWallet: (data: CreateWalletRequest | ImportWalletRequest) => 
    api.post('/api/wallet/add', data),
  removeWallet: (walletId: string) => 
    api.delete(`/api/wallet/${walletId}`),
  setDefaultWallet: (walletId: string) => 
    api.patch(`/api/wallet/${walletId}/default`),
  updateWalletName: (walletId: string, name: string) => 
    api.patch(`/api/wallet/${walletId}/name`, { name }),
}
```

### Database Migrations:

```sql
-- Add new columns to wallets table
ALTER TABLE wallets ADD COLUMN is_default BOOLEAN DEFAULT FALSE;
ALTER TABLE wallets ADD COLUMN wallet_type VARCHAR(20) DEFAULT 'created';
ALTER TABLE wallets ADD COLUMN display_order INTEGER DEFAULT 0;

-- Create index for faster default wallet lookup  
CREATE INDEX idx_wallets_user_default ON wallets(user_id, is_default);

-- Ensure only one default wallet per user (constraint)
CREATE UNIQUE INDEX idx_wallets_unique_default 
ON wallets(user_id) WHERE is_default = TRUE;
```

### Security Considerations:

1. **Mnemonic Import Security**:
   - Client-side validation before sending
   - Immediate encryption upon receipt
   - No server-side storage of plaintext mnemonics

2. **Wallet Removal**:
   - Confirmation dialogs with warnings
   - Backup verification requirements
   - Audit trail of removals

3. **Default Wallet Management**:
   - Atomic operations for default wallet changes
   - Validation of wallet ownership
   - Transaction rollback on conflicts

---

## Next Steps

### Immediate Actions:
1. ✅ **Research Complete**: Backend wallet infrastructure documented
2. **Backend API Extensions**: Implement multi-wallet endpoints in main-api
3. **Database Migration**: Add new wallet fields and constraints
4. **Frontend API Integration**: Update POS app to use new endpoints

### Development Phases:
1. **Week 1-2**: Backend API extensions and database updates
2. **Week 3-4**: Frontend wallet management UI components  
3. **Week 5**: POS payment flow integration and testing
4. **Week 6**: Security hardening and production deployment

### Testing Strategy:
- **Unit Tests**: New backend endpoints and business logic
- **Integration Tests**: End-to-end wallet management flows
- **Security Tests**: Encryption, authentication, and authorization
- **User Acceptance Tests**: POS operator workflows and edge cases

---

## References

- `main-api/internal/handlers/wallet_handler.go` - Existing wallet API implementation
- `main-api/internal/models/wallet.go` - Current wallet database model
- `main-api/internal/router/router.go` - API route definitions
- POS app authentication and store management patterns

---

**This plan leverages the existing robust wallet infrastructure while adding the multi-wallet management features needed for a comprehensive POS system experience.**