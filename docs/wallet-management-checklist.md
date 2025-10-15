# POS Wallet Address Management Implementation Checklist

## Overview
This checklist implements wallet address management for the POS system, allowing users to configure primary and secondary wallet addresses where payments will be received. Users create wallets elsewhere (apps/wallet or third-party providers) and simply input the addresses in POS.

---

## Phase 1: Backend API Extensions (main-api)

### 1.1 Database Schema Updates
- [ ] **Update User Model** (`apps/main-api/internal/models/user.go`)
  - [ ] Add `PrimaryWalletAddress string` field with validation
  - [ ] Add `SecondaryWalletAddress *string` field (nullable)
  - [ ] Add JSON tags and GORM constraints

  ```go
  type User struct {
    // ... existing fields
    PrimaryWalletAddress   string  `json:"primary_wallet_address" gorm:"size:44"`
    SecondaryWalletAddress *string `json:"secondary_wallet_address,omitempty" gorm:"size:44"`
  }
  ```

- [ ] **Create Database Migration**
  - [ ] Create migration file or SQL commands:
    ```sql
    ALTER TABLE users ADD COLUMN primary_wallet_address VARCHAR(44) DEFAULT '';
    ALTER TABLE users ADD COLUMN secondary_wallet_address VARCHAR(44) DEFAULT NULL;
    CREATE INDEX idx_users_primary_wallet ON users(primary_wallet_address);
    ```
  - [ ] Test migration locally
  - [ ] Apply migration to development database

### 1.2 New Handler Functions
- [ ] **Create POS Wallet Handler** (`apps/main-api/internal/handlers/pos_wallet_handler.go`)
  - [ ] Add `GetPOSWalletAddressesHandler` function
    - [ ] Return user's configured wallet addresses
    - [ ] Include validation status
  
  - [ ] Add `UpdatePrimaryWalletAddressHandler` function
    - [ ] Validate Solana address format
    - [ ] Update user's primary wallet address
    - [ ] Return success response
  
  - [ ] Add `UpdateSecondaryWalletAddressHandler` function
    - [ ] Validate Solana address format (optional)
    - [ ] Update user's secondary wallet address
    - [ ] Allow setting to null/empty
  
  - [ ] Add `ValidateWalletAddressHandler` function
    - [ ] Validate address format
    - [ ] Check address exists on blockchain (optional)
    - [ ] Return validation result

### 1.3 Request/Response Structs
- [ ] **Add structs to pos_wallet_handler.go**
  ```go
  type POSWalletAddressesResponse struct {
    PrimaryAddress   string  `json:"primary_address"`
    SecondaryAddress *string `json:"secondary_address"`
    HasPrimary       bool    `json:"has_primary"`
    HasSecondary     bool    `json:"has_secondary"`
  }

  type UpdateWalletAddressRequest struct {
    Address string `json:"address" validate:"required,len=44"`
  }

  type ValidateAddressRequest struct {
    Address string `json:"address" validate:"required"`
  }

  type ValidateAddressResponse struct {
    IsValid bool   `json:"is_valid"`
    Message string `json:"message"`
  }
  ```

### 1.4 Wallet Address Validation
- [ ] **Create validation utility** (`apps/main-api/internal/utils/wallet_validation.go`)
  ```go
  func IsValidSolanaAddress(address string) bool {
    // Validate base58 format and length (44 characters)
    // Use Solana address validation logic
  }

  func ValidateWalletAddress(address string) error {
    // Comprehensive wallet address validation
  }
  ```

### 1.5 Router Updates
- [ ] **Update Router** (`apps/main-api/internal/router/router.go`)
  - [ ] Add new POS wallet routes:
    ```go
    posWallet := api.Group("/pos-wallet", middleware.AuthMiddleware(cfg.JWTSecret))
    posWallet.Get("/addresses", handlers.GetPOSWalletAddressesHandler(db))
    posWallet.Patch("/primary", handlers.UpdatePrimaryWalletAddressHandler(db))
    posWallet.Patch("/secondary", handlers.UpdateSecondaryWalletAddressHandler(db))
    posWallet.Post("/validate", handlers.ValidateWalletAddressHandler(db))
    ```

---

## Phase 2: POS Frontend Integration

### 2.1 API Client Updates
- [ ] **Create POS Wallet API Client** (`apps/pos/src/lib/api/pos-wallet.ts`)
  ```typescript
  export const posWalletApi = {
    getWalletAddresses: () => api.get('/api/pos-wallet/addresses'),
    updatePrimaryAddress: (address: string) => 
      api.patch('/api/pos-wallet/primary', { address }),
    updateSecondaryAddress: (address: string) => 
      api.patch('/api/pos-wallet/secondary', { address }),
    clearSecondaryAddress: () => 
      api.patch('/api/pos-wallet/secondary', { address: '' }),
    validateAddress: (address: string) => 
      api.post('/api/pos-wallet/validate', { address }),
  }
  ```

### 2.2 TypeScript Types
- [ ] **Create POS Wallet Types** (`apps/pos/src/types/pos-wallet.ts`)
  ```typescript
  export interface POSWalletAddresses {
    primary_address: string
    secondary_address?: string
    has_primary: boolean
    has_secondary: boolean
  }

  export interface WalletAddressValidation {
    is_valid: boolean
    message: string
  }
  ```

### 2.3 Zustand Store Updates
- [ ] **Create POS Wallet Store** (`apps/pos/src/stores/posWalletStore.ts`)
  ```typescript
  interface POSWalletState {
    addresses: POSWalletAddresses | null
    isLoading: boolean
    error: string | null
  }

  interface POSWalletActions {
    fetchWalletAddresses: () => Promise<void>
    updatePrimaryAddress: (address: string) => Promise<void>
    updateSecondaryAddress: (address: string) => Promise<void>
    clearSecondaryAddress: () => Promise<void>
    validateAddress: (address: string) => Promise<WalletAddressValidation>
    reset: () => void
  }
  ```

### 2.4 Wallet Address Management UI Components

- [ ] **Create Wallet Address Form** (`apps/pos/src/components/wallet/WalletAddressForm.tsx`)
  - [ ] Input field for primary wallet address
  - [ ] Input field for secondary wallet address (optional)
  - [ ] Real-time address validation
  - [ ] Clear/save buttons
  - [ ] Address format hints and examples

- [ ] **Create Address Validator Component** (`apps/pos/src/components/wallet/AddressValidator.tsx`)
  - [ ] Real-time validation feedback
  - [ ] Visual indicators (checkmark/X)
  - [ ] Format validation messages
  - [ ] Copy/paste functionality

- [ ] **Create Wallet Address Display** (`apps/pos/src/components/wallet/WalletAddressDisplay.tsx`)
  - [ ] Show current configured addresses
  - [ ] Truncated address display with copy button
  - [ ] Edit mode toggle
  - [ ] Status indicators (configured/not configured)

### 2.5 Integration with Settings Page
- [ ] **Update Settings Page** (`apps/pos/src/app/settings/page.tsx`)
  - [ ] Add "Payment Wallet Addresses" section
  - [ ] Include WalletAddressForm component
  - [ ] Add descriptive text about address purpose
  - [ ] Save/cancel functionality

- [ ] **Create Settings Section Component** (`apps/pos/src/components/settings/WalletAddressSettings.tsx`)
  - [ ] Dedicated section for wallet address management
  - [ ] Help text explaining primary vs secondary addresses
  - [ ] Links to wallet creation resources

---

## Phase 3: POS Payment Flow Integration (Card, Cash, Team556)

Important: The POS does not create or manage wallets and does not check on-chain balances. Wallet addresses are only used as receiving destinations for Team556 payments. Card and cash flows are standard tenders unaffected by wallet logic.

### 3.1 Tender Types and Store State
- [ ] **Extend Transaction Store** (`apps/pos/src/stores/transactionStore.ts`)
  - [ ] Add tenderType: 'card' | 'cash' | 'team556'
  - [ ] Add receivingAddress: string (resolved from primary/secondary at time of payment for team556)
  - [ ] Add team556 fields: { reference: string, amountToken: number, exchangeRate: number, status: 'awaiting' | 'confirmed' | 'expired' | 'cancelled', signature?: string }
  - [ ] Reset team556-specific fields when tenderType changes

### 3.2 Team556 Pay Flow (modeled after apps/wp-plugin)
- [ ] **Price and Amount**
  - [ ] Fetch Team556 price (prefer main-api `/api/price/team556-usdc`; fallback public API if needed)
  - [ ] Convert fiat total to TEAM556 amount (9 decimals) and store exchangeRate and amountToken
- [ ] **Reference & URL**
  - [ ] Generate unique reference (e.g., UUID)
  - [ ] Build Solana Pay URL: `solana:?recipient=...&amount=...&spl-token=TEAM556_MINT&reference=...&label=...&message|memo=...`
  - [ ] Use primary receiving address by default; allow optional secondary selection
- [ ] **Present to Customer**
  - [ ] Show QR code and deep link button (mobile wallet)
  - [ ] Include payment summary (fiat total, TEAM556 amount)
- [ ] **Polling / Verification**
  - [ ] Poll backend to find transaction by reference (use main-api proxy endpoint if available, consistent with apps/wp-plugin)
  - [ ] On match, verify: token mint, recipient equals receivingAddress, amount matches amountToken
  - [ ] On success: set status='confirmed', capture signature and timestamp
  - [ ] On timeout/cancel: set status accordingly and surface retry/cancel options
- [ ] **Finalize POS Sale**
  - [ ] Mark transaction paid via Team556 in POS
  - [ ] Persist: signature, reference, receivingAddress, amountToken, exchangeRate, timestamp

### 3.3 UI Components
- [ ] **Team556PayModal** (`apps/pos/src/components/payment/Team556PayModal.tsx`)
  - [ ] Shows QR, deep link, summary (fiat + token), countdown/timeout
  - [ ] Displays real-time verification status (awaiting → confirmed/expired)
- [ ] **AddressSelector** (`apps/pos/src/components/payment/AddressSelector.tsx`)
  - [ ] Radio/dropdown for primary/secondary (only if secondary configured)
  - [ ] Default to primary; reflects current receivingAddress in store
- [ ] **TenderSelector** (`apps/pos/src/components/payment/TenderSelector.tsx`)
  - [ ] Card, Cash, Team556 buttons; switches UI flow accordingly

### 3.4 Payment Screen Updates (`apps/pos/src/app/checkout/page.tsx` or similar)
- [ ] Show selected tender and context UI (card/cash forms, or Team556 QR modal)
- [ ] For Team556: display receivingAddress and validation indicator (from settings validation)
- [ ] Handle missing configuration (no primary address): block Team556 tender and show setup prompt

### 3.5 Data and Logging
- [ ] Store and display: signature, reference, receivingAddress, amountToken, exchangeRate, timestamp
- [ ] Audit log which address was used for each Team556 payment

Note: This flow mirrors apps/wp-plugin behavior (QR creation, price conversion, reference-based verification) adapted for POS. No balance checks, wallet key management, or on-chain sending occurs in POS.

---

## Phase 4: Enhanced Features

### 4.1 Address Management Features
- [ ] **Address Book Integration**
  - [ ] Save frequently used addresses
  - [ ] Address nicknames/labels
  - [ ] Recent addresses list

- [ ] **QR Code Integration**
  - [ ] QR code scanner for address input
  - [ ] Generate QR codes for configured addresses
  - [ ] Mobile-friendly address entry

### 4.2 Validation and Security
- [ ] **Enhanced Validation**
  - [ ] Check if address exists on Solana blockchain
  - [ ] Validate address ownership (optional)
  - [ ] Warning for potentially invalid addresses

- [ ] **Security Features**
  - [ ] Address change confirmation
  - [ ] Activity logging for address changes
  - [ ] Email notifications for address updates

---

## Phase 5: Testing & Documentation

### 5.1 Backend Testing
- [ ] **Unit Tests**
  - [ ] Test address validation functions
  - [ ] Test CRUD operations for wallet addresses
  - [ ] Test database constraints and migrations

- [ ] **Integration Tests**
  - [ ] Test complete address management flow
  - [ ] Test address validation API
  - [ ] Test error handling

### 5.2 Frontend Testing
- [ ] **Component Tests**
  - [ ] Test address form validation
  - [ ] Test address display components
  - [ ] Test settings page integration

- [ ] **E2E Tests**
  - [ ] Complete address configuration workflow
  - [ ] POS payment with configured addresses
  - [ ] Address validation and error handling

### 5.3 User Testing
- [ ] **Usability Testing**
  - [ ] Test address input methods
  - [ ] Test mobile address entry
  - [ ] Validate user understanding of primary vs secondary

---

## Phase 6: Deployment

### 6.1 Database Migration
- [ ] **Staging Deployment**
  - [ ] Apply database migrations
  - [ ] Test with sample data
  - [ ] Verify data integrity

### 6.2 Production Rollout
- [ ] **Deploy backend changes**
  - [ ] Update API endpoints
  - [ ] Deploy address validation
  - [ ] Monitor for issues

- [ ] **Deploy frontend changes**
  - [ ] Update settings page
  - [ ] Deploy payment flow updates
  - [ ] Test end-to-end functionality

---

## Quick Start Commands

```bash
# Backend development
cd apps/main-api
go mod tidy
go run cmd/api/main.go

# Frontend development  
cd apps/pos
npm install
npm run dev

# Test address validation
curl -X POST http://localhost:3000/api/pos-wallet/validate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"address":"WALLET_ADDRESS_HERE"}'
```

---

## User Flow Example

1. **Initial Setup**:
   - User goes to POS Settings
   - Enters primary wallet address (from their external wallet)
   - Optionally enters secondary wallet address
   - Addresses are validated and saved

2. **During POS Operation**:
   - Customer makes purchase
   - POS shows payment request with configured wallet address
   - Payment is sent to the configured address
   - Transaction is recorded with receiving address info

3. **Address Management**:
   - User can update addresses anytime in settings
   - Changes take effect immediately for new transactions
   - Previous transaction records remain unchanged

---

## Success Criteria

- [ ] Users can easily configure primary and secondary wallet addresses
- [ ] Address validation prevents invalid addresses
- [ ] POS system correctly uses configured addresses for payments
- [ ] Settings interface is intuitive and user-friendly
- [ ] Address changes are properly validated and saved
- [ ] System handles missing/invalid address configurations gracefully

---

**Estimated Timeline: 2-3 weeks**
- **Week 1**: Backend API and database updates
- **Week 2**: Frontend components and settings integration  
- **Week 3**: Payment flow integration and testing