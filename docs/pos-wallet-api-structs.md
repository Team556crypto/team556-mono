# POS Wallet API Request/Response Structures

## Overview

This document describes all the request and response structures used by the POS Wallet Address Management API endpoints.

---

## Response Structures

### POSWalletAddressesResponse

**Purpose**: Returns the user's configured wallet addresses with status flags.

```go
type POSWalletAddressesResponse struct {
    PrimaryAddress   string  `json:"primary_address"`
    SecondaryAddress *string `json:"secondary_address"`
    HasPrimary       bool    `json:"has_primary"`
    HasSecondary     bool    `json:"has_secondary"`
}
```

**Fields**:
- `primary_address` (string): The primary wallet address (may be empty string)
- `secondary_address` (string|null): The secondary wallet address (null if not set)
- `has_primary` (boolean): True if primary address is configured and non-empty
- `has_secondary` (boolean): True if secondary address is configured and non-empty

**Used by**: `GET /api/pos-wallet/addresses`

**Example**:
```json
{
  "primary_address": "11111111111111111111111111111112",
  "secondary_address": "So11111111111111111111111111111111111111112",
  "has_primary": true,
  "has_secondary": true
}
```

### UpdateWalletAddressResponse

**Purpose**: Confirms successful wallet address updates.

```go
type UpdateWalletAddressResponse struct {
    Message string  `json:"message"`
    Address string  `json:"address"`
    Updated bool    `json:"updated"`
}
```

**Fields**:
- `message` (string): Human-readable success message
- `address` (string): The address that was set (empty string if cleared)
- `updated` (boolean): Always true for successful updates

**Used by**: 
- `PATCH /api/pos-wallet/primary`
- `PATCH /api/pos-wallet/secondary`

**Example**:
```json
{
  "message": "Primary wallet address updated successfully",
  "address": "11111111111111111111111111111112",
  "updated": true
}
```

### ValidateAddressResponse

**Purpose**: Returns validation results for wallet addresses.

```go
type ValidateAddressResponse struct {
    IsValid bool   `json:"is_valid"`
    Message string `json:"message"`
}
```

**Fields**:
- `is_valid` (boolean): True if address is valid Solana format
- `message` (string): Validation result message or error description

**Used by**: `POST /api/pos-wallet/validate`

**Example Valid**:
```json
{
  "is_valid": true,
  "message": "Valid Solana wallet address"
}
```

**Example Invalid**:
```json
{
  "is_valid": false,
  "message": "Invalid Solana wallet address format"
}
```

### HealthCheckResponse

**Purpose**: Comprehensive status check for wallet address configuration.

```go
type HealthCheckResponse struct {
    HasPrimary         bool   `json:"has_primary"`
    HasSecondary       bool   `json:"has_secondary"`
    PrimaryValid       bool   `json:"primary_valid"`
    SecondaryValid     bool   `json:"secondary_valid"`
    ReadyForPayments   bool   `json:"ready_for_payments"`
    Recommendation     string `json:"recommendation,omitempty"`
}
```

**Fields**:
- `has_primary` (boolean): True if primary address is configured
- `has_secondary` (boolean): True if secondary address is configured  
- `primary_valid` (boolean): True if primary address passes validation
- `secondary_valid` (boolean): True if secondary address is valid (always true if not set)
- `ready_for_payments` (boolean): True if system is ready to receive payments
- `recommendation` (string): Human-readable recommendation for improvements

**Used by**: `GET /api/pos-wallet/health`

**Example Ready**:
```json
{
  "has_primary": true,
  "has_secondary": true,
  "primary_valid": true,
  "secondary_valid": true,
  "ready_for_payments": true,
  "recommendation": "Wallet addresses are properly configured for payments"
}
```

**Example Needs Setup**:
```json
{
  "has_primary": false,
  "has_secondary": false,
  "primary_valid": false,
  "secondary_valid": true,
  "ready_for_payments": false,
  "recommendation": "Please configure a primary wallet address to receive payments"
}
```

### ErrorResponse

**Purpose**: Standardized error response format.

```go
type ErrorResponse struct {
    Error   string                 `json:"error"`
    Code    int                    `json:"code,omitempty"`
    Details map[string]interface{} `json:"details,omitempty"`
}
```

**Fields**:
- `error` (string): Error message
- `code` (integer): Optional error code
- `details` (object): Optional additional error details

**Used by**: All endpoints for error cases

**Example**:
```json
{
  "error": "Invalid Solana wallet address format",
  "code": 400
}
```

---

## Request Structures

### UpdateWalletAddressRequest

**Purpose**: Request body for updating wallet addresses.

```go
type UpdateWalletAddressRequest struct {
    Address string `json:"address" validate:"required,min=32,max=44"`
}
```

**Fields**:
- `address` (string): The wallet address to set

**Validation**:
- Required field
- Length between 32-44 characters (Solana address range)
- Additional validation performed by handler (Base58 format, etc.)

**Used by**:
- `PATCH /api/pos-wallet/primary`
- `PATCH /api/pos-wallet/secondary`

**Example**:
```json
{
  "address": "11111111111111111111111111111112"
}
```

**Clear Secondary Address**:
```json
{
  "address": ""
}
```

### ValidateAddressRequest

**Purpose**: Request body for validating wallet addresses.

```go
type ValidateAddressRequest struct {
    Address string `json:"address" validate:"required,min=1,max=50"`
}
```

**Fields**:
- `address` (string): The wallet address to validate

**Validation**:
- Required field
- Length between 1-50 characters (allows testing invalid lengths)

**Used by**: `POST /api/pos-wallet/validate`

**Example**:
```json
{
  "address": "11111111111111111111111111111112"
}
```

### ClearSecondaryAddressRequest

**Purpose**: Request body for explicitly clearing secondary address (alternative approach).

```go
type ClearSecondaryAddressRequest struct {
    Clear bool `json:"clear"`
}
```

**Fields**:
- `clear` (boolean): Set to true to clear secondary address

**Note**: Currently not used. The preferred method is to send empty string in UpdateWalletAddressRequest.

---

## API Endpoints Summary

| Endpoint | Method | Request | Response | Purpose |
|----------|--------|---------|----------|---------|
| `/api/pos-wallet/addresses` | GET | None | POSWalletAddressesResponse | Get configured addresses |
| `/api/pos-wallet/primary` | PATCH | UpdateWalletAddressRequest | UpdateWalletAddressResponse | Update primary address |
| `/api/pos-wallet/secondary` | PATCH | UpdateWalletAddressRequest | UpdateWalletAddressResponse | Update/clear secondary address |
| `/api/pos-wallet/validate` | POST | ValidateAddressRequest | ValidateAddressResponse | Validate address format |
| `/api/pos-wallet/health` | GET | None | HealthCheckResponse | Check configuration status |

---

## Validation Rules

### Address Format Validation
- **Length**: 32-44 characters
- **Encoding**: Valid Base58 format
- **Character Set**: Only valid Base58 characters (no 0, O, l, I)
- **Decoded Length**: Must decode to exactly 32 bytes

### Request Validation
- All requests require JWT authentication
- Content-Type must be application/json for POST/PATCH requests
- Request bodies must be valid JSON matching the expected structure

### Business Rules
- Primary address is required for payment processing
- Secondary address is optional
- Empty string clears secondary address (sets to NULL)
- Addresses are normalized (whitespace trimmed) before processing
- All addresses are validated before storing

---

## Error Handling

### Common HTTP Status Codes
- **200 OK**: Successful GET requests
- **400 Bad Request**: Invalid request body or address format
- **401 Unauthorized**: Missing or invalid JWT token
- **404 Not Found**: User not found
- **500 Internal Server Error**: Database or server errors

### Error Response Format
All errors return ErrorResponse structure with appropriate HTTP status codes and descriptive error messages.