# Digital Armory Referral System API Documentation

## Overview

The Digital Armory referral system allows users to refer new users and track their conversion through various milestones:
1. **Signup**: New user registers with referral code
2. **Email Verification**: Referred user verifies their email
3. **Wallet Creation**: Referred user creates a Solana wallet
4. **Team556 Token Acquisition**: Referred user purchases or holds Team556 tokens

## Database Schema

### Tables Created
- `users` - Extended with referral fields
- `referrals` - Individual referral relationships and progression
- `referral_stats` - Cached performance statistics
- `referral_events` - Detailed event log for analytics

### User Model Extensions
```go
// Added to existing User model
ReferralCode            *string    `json:"referral_code,omitempty"`
ReferredByUserID        *uint      `json:"referred_by_user_id,omitempty"`
ReferralCodeGeneratedAt *time.Time `json:"referral_code_generated_at,omitempty"`
ReferredAt              *time.Time `json:"referred_at,omitempty"`
```

## API Endpoints

### Public Endpoints

#### Validate Referral Code
**POST** `/api/referrals/validate`

Validates a referral code during the signup process.

```json
// Request
{
  "referral_code": "ABC12345"
}

// Response (Valid)
{
  "valid": true,
  "referrer_name": "John Smith",
  "message": "Valid referral code"
}

// Response (Invalid)
{
  "valid": false,
  "message": "Invalid referral code"
}
```

### Protected Endpoints (Require Authentication)

#### Generate or Get Referral Code
**GET** `/api/referrals/code`

Generates a new referral code for the user or returns existing one.

```json
// Response
{
  "referral_code": "ABC12345",
  "generated_at": "2025-10-14T20:27:01Z",
  "share_url": "https://app.team556.com/signup?ref=ABC12345",
  "message": "Referral code generated successfully"
}
```

#### Regenerate Referral Code
**POST** `/api/referrals/code/regenerate`

Generates a new referral code, invalidating the previous one.

```json
// Response
{
  "referral_code": "XYZ98765",
  "generated_at": "2025-10-14T20:30:01Z",
  "share_url": "https://app.team556.com/signup?ref=XYZ98765",
  "message": "Referral code regenerated successfully"
}
```

#### Get Referral Statistics
**GET** `/api/referrals/stats`

Returns comprehensive referral performance statistics.

```json
// Response
{
  "user_id": 123,
  "referral_code": "ABC12345",
  "total_referrals": 15,
  "verified_referrals": 12,
  "wallet_created_referrals": 8,
  "team556_holding_referrals": 3,
  "conversion_rate_to_verified": 0.8000,
  "conversion_rate_to_wallet": 0.5333,
  "conversion_rate_to_team556": 0.2000,
  "total_team556_volume": 1250.5,
  "average_balance": 416.83,
  "first_referral_at": "2025-10-01T10:00:00Z",
  "most_recent_referral_at": "2025-10-14T15:30:00Z",
  "last_calculated_at": "2025-10-14T20:15:00Z"
}
```

#### Get Referral History
**GET** `/api/referrals/history?page=1&page_size=20`

Returns paginated history of referred users with their progression status.

```json
// Response
{
  "referrals": [
    {
      "id": 45,
      "referred_user_code": "USER789",
      "signup_date": "2025-10-14T15:30:00Z",
      "email_verified": true,
      "email_verified_at": "2025-10-14T15:45:00Z",
      "wallet_created": true,
      "wallet_created_at": "2025-10-14T16:00:00Z",
      "has_team556": true,
      "team556_balance": 500.25,
      "first_team556_detected_at": "2025-10-14T18:00:00Z",
      "conversion_source": "mobile_app"
    }
  ],
  "total": 15,
  "page": 1,
  "page_size": 20
}
```

## Modified Registration Endpoint

### User Registration with Referral Support
**POST** `/api/auth/register`

The existing registration endpoint now accepts an optional referral code.

```json
// Request
{
  "email": "newuser@example.com",
  "password": "securePassword123",
  "referral_code": "ABC12345"  // Optional
}

// Response (same as before)
{
  "token": "jwt_token_here",
  "user": {
    "id": 456,
    "email": "newuser@example.com",
    "email_verified": false,
    // ... other user fields
  }
}
```

## Automatic Event Tracking

The system automatically tracks referral progression events:

### 1. Signup Event
- Triggered when a user registers with a referral code
- Creates referral relationship
- Logs initial signup event

### 2. Email Verification Event
- Triggered when referred user verifies their email
- Updates referral record with verification timestamp
- Logs email verification event

### 3. Wallet Creation Event
- Triggered when referred user creates their first wallet
- Updates referral record with wallet creation timestamp
- Logs wallet creation event

### 4. Team556 Token Events (via n8n)
- **First Detection**: When referred user first acquires Team556 tokens
- **Balance Updates**: Regular balance checks and updates
- **Transaction Events**: Specific Team556 token transactions

## Performance Features

### Cached Statistics
- Referral statistics are cached for fast API responses
- Auto-updated when stats are older than 1 hour
- Async updates to avoid blocking API requests

### Async Event Processing
- All referral event logging is asynchronous
- Doesn't block user registration or other core operations
- Graceful error handling with logging

### Database Optimization
- Comprehensive indexing for fast referral lookups
- Efficient pagination for referral history
- Optimized queries for statistics calculation

## Integration Points

### Frontend Integration
```javascript
// Check referral code during signup flow
const validateReferral = async (code) => {
  const response = await fetch('/api/referrals/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ referral_code: code })
  });
  return response.json();
};

// Get user's referral stats for dashboard
const getReferralStats = async (token) => {
  const response = await fetch('/api/referrals/stats', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};
```

### n8n Integration (Phase 3)
- n8n workflows will monitor Team556 token balances
- Update referral records when tokens are detected
- Process transaction webhooks for real-time updates
- Generate daily/weekly referral performance reports

## Error Handling

All endpoints return standardized error responses:

```json
// Validation Error
{
  "error": "Validation failed",
  "details": {
    "referral_code": "Minimum length is 4"
  }
}

// Not Found Error
{
  "error": "User not found"
}

// Server Error
{
  "error": "Failed to generate referral code"
}
```

## Security Considerations

1. **Rate Limiting**: Public validation endpoint should be rate-limited
2. **Privacy**: User emails are not exposed in referral responses
3. **Code Generation**: Uses cryptographically secure random generation
4. **Input Validation**: All inputs are validated and sanitized
5. **SQL Injection**: GORM provides protection against SQL injection

## Migration Instructions

### 1. Apply Database Migration
```bash
psql $DATABASE_URL -f migrations/003_referral_system.sql
```

### 2. Update Go Dependencies
```bash
go mod tidy
```

### 3. Build and Deploy
```bash
go build -o main cmd/api/main.go
```

### 4. Test Endpoints
```bash
# Test referral code validation
curl -X POST http://localhost:8080/api/referrals/validate \
  -H "Content-Type: application/json" \
  -d '{"referral_code":"TEST123"}'
```

## Monitoring and Analytics

### Key Metrics to Track
- Total referrals generated
- Conversion rates at each funnel stage
- Team556 token adoption through referrals
- Top performing referrers
- Referral source attribution

### Performance Monitoring
- Database query performance for referral lookups
- API response times for statistics endpoints
- Success/failure rates of referral event logging

## Future Enhancements

1. **Referral Rewards**: Implement Team556 token rewards for successful referrals
2. **Leaderboards**: Public leaderboards for top referrers
3. **Social Sharing**: Enhanced social media integration
4. **A/B Testing**: Different referral incentive structures
5. **Advanced Analytics**: Cohort analysis and retention metrics