# Referral Code Integration - Wallet App

## Overview
The Team556 wallet app now supports referral codes during user signup. This integration connects with the backend referral system to track referrals and enable users to share their referral codes.

## Changes Made

### 1. Frontend Changes (`apps/wallet/`)

#### Updated Types (`services/api/types.ts`)
- Extended `UserCredentials` interface to include optional `referral_code` field
- Supports referral codes in both login and signup flows (though only used in signup)

#### Updated Authentication Store (`store/authStore.ts`)
- Modified `signup` function to accept the full `UserCredentials` object instead of destructuring
- Passes referral code to the backend API when provided

#### Updated Signup Screen (`app/signup.tsx`)
- Added `referralCode` state variable
- Added URL parameter handling for `ref` parameter (e.g., `myapp://signup?ref=ABC123`)
- Added referral code input field to the signup form
- Auto-formats referral codes to uppercase
- Includes referral code in signup API call when provided

### 2. Backend Integration

The backend already supports:
- `RegisterRequest` struct with optional `referral_code` field
- Referral code validation during signup
- Automatic referral record creation
- Referral tracking and statistics

## Usage Flow

### For Users Signing Up with Referral Code

1. **Via URL Parameter**: Users can visit `myapp://signup?ref=ABC123` and the referral code will be pre-filled
2. **Manual Entry**: Users can manually enter a referral code in the signup form
3. **Validation**: The backend validates the referral code and creates referral records
4. **Tracking**: Successful referrals are tracked for analytics and rewards

### For Referrers

Users with referral codes can share links like:
- Web: `https://yourapp.com/signup?ref=ABC123`
- Deep Link: `myapp://signup?ref=ABC123`

## Technical Details

### API Integration
```typescript
// Signup request now supports referral codes
const signupData = {
  email: "user@example.com",
  password: "securepassword",
  referral_code: "ABC123" // Optional
}
```

### URL Parameter Handling
```typescript
// Auto-fills referral code from URL
if (params.ref && typeof params.ref === 'string') {
  setReferralCode(params.ref.toUpperCase())
}
```

### Form Validation
- Referral codes are automatically converted to uppercase
- Backend validates code format and existence
- Registration proceeds even if referral code is invalid (logged but not blocking)

## Testing

To test the referral integration:

1. **Start the development server**:
   ```bash
   cd apps/wallet
   npm run dev
   ```

2. **Test URL parameter**:
   - Navigate to signup screen with `?ref=TESTCODE`
   - Verify referral code field is pre-filled

3. **Test manual entry**:
   - Enter a valid referral code in the signup form
   - Complete registration and verify backend logs show referral processing

4. **Test backend integration**:
   - Check backend logs for referral validation and creation
   - Verify referral records in database

## Future Enhancements

1. **Referral Code Display**: Show user's own referral code in profile/settings
2. **Sharing Integration**: Add native sharing capabilities for referral links  
3. **Referral Statistics**: Display referral stats and rewards in the app
4. **Deep Link Improvements**: Enhanced deep linking with better error handling
5. **Referral Validation**: Real-time validation of referral codes before submission

## Related Files

- `apps/wallet/app/signup.tsx` - Signup screen with referral code support
- `apps/wallet/store/authStore.ts` - Authentication state management
- `apps/wallet/services/api/types.ts` - API type definitions
- `apps/main-api/internal/handlers/auth_handlers.go` - Backend signup handler
- `apps/main-api/internal/utils/referral.go` - Referral utility functions