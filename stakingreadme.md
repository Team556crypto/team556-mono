# Adding Staking for Team556 (Receiving T556R Rewards)

This document outlines the plan to implement staking functionality for the `Team556` token, where users can stake their `Team556` tokens in the app and receive a secondary rewards token, `T556R`.

## High-Level Plan

To make this feature functional, each of the following areas will require detailed implementation work. The steps below provide a more granular breakdown.

1.  **Solana Smart Contract (`apps/token-core` - Rust/Anchor)**
2.  **Backend Development (`apps/solana-api` and `apps/main-api`)**
3.  **Frontend Wallet App (`apps/wallet` - React Native Expo)**

---

### 1. Solana Smart Contract (`apps/token-core` - Rust/Anchor)

**Objective:** Create a secure and efficient on-chain program for staking `Team556` and distributing `T556R` rewards.

*   **Create `T556R` Rewards Token:**
    *   **Action:** Use the SPL Token CLI or a script to create a new mint for `T556R`.
    *   **Consideration:** Define token metadata (name, symbol, decimals, icon URL).
    *   **Action:** Mint an initial supply to a treasury/escrow account controlled by the staking program or an admin.
*   **Develop Staking Program (Anchor):**
    *   **Tooling:** Utilize the Anchor framework for faster development and security.
    *   **State (`#[account]` structs):**
        *   `StakingPoolConfig`:
            *   `admin_key: Pubkey`
            *   `team556_token_mint: Pubkey`
            *   `t556r_reward_token_mint: Pubkey`
            *   `reward_rate_per_slot: u64` (or per epoch, define clearly)
            *   `total_team556_staked: u64`
            *   `t556r_reward_pool_vault: Pubkey` (PDA to hold T556R for distribution)
            *   `last_update_slot: u64` (for calculating rewards)
        *   `UserStakeInfo` (PDA per user, per staked token type if expanding later):
            *   `user_owner: Pubkey`
            *   `team556_staked_amount: u64`
            *   `reward_debt: u64` (to correctly calculate rewards when new stakes/unstakes occur)
            *   `last_claimed_slot: u64`
    *   **Instructions (Functions - `#[program]`):**
        *   `initialize_staking_pool(ctx, reward_rate)`:
            *   **Action:** Sets up `StakingPoolConfig` and creates the `t556r_reward_pool_vault` PDA.
            *   **Security:** Restrict to an admin/authority.
        *   `stake(ctx, amount)`:
            *   **Action:** Transfers `Team556` from user to a program-controlled vault (PDA).
            *   **Action:** Updates `UserStakeInfo` and `StakingPoolConfig.total_team556_staked`.
            *   **Logic:** Calculate and accrue pending rewards before adding new stake.
        *   `unstake(ctx, amount)`:
            *   **Action:** Transfers `Team556` from program vault back to user.
            *   **Action:** Updates `UserStakeInfo` and `StakingPoolConfig.total_team556_staked`.
            *   **Logic:** Calculate and accrue pending rewards before removing stake. Pay out pending rewards if `claim_rewards` is not separate or if desired during unstake.
            *   **Consideration:** Implement lock-up periods or early unstake penalties if designed.
        *   `claim_rewards(ctx)`:
            *   **Action:** Calculates pending `T556R` rewards for the user based on `reward_rate_per_slot`, staked amount, and time staked.
            *   **Action:** Transfers `T556R` from `t556r_reward_pool_vault` to the user.
            *   **Action:** Updates `UserStakeInfo` (e.g., `reward_debt` or `last_claimed_slot`).
        *   `deposit_reward_tokens(ctx, amount)`:
            *   **Action:** Admin transfers `T556R` into the `t556r_reward_pool_vault`.
            *   **Security:** Restrict to an admin/authority.
        *   `update_reward_rate(ctx, new_rate)`:
            *   **Action:** Admin updates `StakingPoolConfig.reward_rate_per_slot`.
            *   **Logic:** Ensure pending rewards are calculated with the old rate up to the point of change.
            *   **Security:** Restrict to an admin/authority.
    *   **Accounts & PDAs:**
        *   **Action:** Clearly define all PDAs for `StakingPoolConfig`, `UserStakeInfo`, token vaults.
        *   **Action:** Use Anchor constraints for security (e.g., `init`, `mut`, `has_one`, `seeds`, `bump`).
    *   **Testing:**
        *   **Action:** Write comprehensive unit tests using Anchor's test framework (`anchor test`).
        *   **Action:** Test edge cases: zero stakes, full unstakes, multiple users, reward depletion.
        *   **Action:** Use Solana Test Validator for local testing.
        *   **Action:** Develop client-side scripts (TypeScript/JavaScript with `@solana/web3.js` and Anchor client) to interact with the program on Devnet/Testnet.

---

### 2. Backend Development

**Objective:** Provide reliable and secure API endpoints for the frontend to interact with the staking smart contract.

*   **`apps/solana-api` (Node.js/Express):**
    *   **Action:** Install Anchor client library and `@solana/web3.js`.
    *   **Action:** Initialize Anchor Provider with connection to Solana cluster (Devnet, Testnet, Mainnet-beta) and a wallet for paying transaction fees and potentially signing as program admin for certain operations.
    *   **New Routes/Handlers:**
        *   **Stake (`POST /v1/stake`):**
            *   **Input:** `userWalletAddress: string`, `amount: number`
            *   **Action:** Construct the `stake` instruction using the Anchor client.
            *   **Action:** Create and partially sign the transaction (fee payer). The transaction will need to be serialized and sent to the frontend for the user to fully sign.
            *   **Alternatively (if `solana-api` manages user keys, NOT RECOMMENDED for user funds):** Fully sign and send. This is less secure for user-owned staking operations.
            *   **Action:** Return serialized transaction or transaction signature.
        *   **Unstake (`POST /v1/unstake`):** Similar to stake.
        *   **Claim Rewards (`POST /v1/claim-rewards`):** Similar to stake.
        *   **Get Staking Info (`GET /v1/staking-info/:userWalletAddress`):**
            *   **Action:** Fetch `UserStakeInfo` PDA data for the user.
            *   **Action:** Fetch `StakingPoolConfig` data.
            *   **Action:** Calculate current APY, pending rewards based on chain data.
            *   **Output:** `stakedAmount`, `pendingRewards`, `totalStakedInPool`, `apy`, etc.
        *   **Admin - Deposit Rewards (`POST /v1/admin/deposit-rewards`):**
            *   **Input:** `amount: number`
            *   **Action:** Requires secure admin authentication. Construct, sign, and send `deposit_reward_tokens` transaction.
    *   **Error Handling:** Implement robust error handling for Solana transaction failures (e.g., insufficient funds, program errors, network issues).
    *   **Transaction Polling:** For operations returning a transaction signature, implement a mechanism to poll for transaction confirmation status.
*   **`apps/main-api` (Go Fiber):**
    *   **New Endpoints:** Mirror the `solana-api` functionality but add business logic, user authentication (from `authStore`), and caching if appropriate.
        *   `POST /staking/stake`
        *   `POST /staking/unstake`
        *   `POST /staking/claim-rewards`
        *   `GET /staking/info`
    *   **Action:** Validate requests from the frontend.
    *   **Action:** Securely call the `solana-api` endpoints. Consider using a service-to-service authentication mechanism (e.g., API key, mTLS) if `solana-api` is exposed.
    *   **Action:** Format responses for the wallet app.
    *   **Database (Supabase/PostgreSQL with GORM):**
        *   **Consideration:** Decide if any staking-related data needs to be cached or logged in your main DB (e.g., transaction history for faster queries, user preferences related to staking). On-chain data is the source of truth for balances and state.

---

### 3. Frontend Wallet App (`apps/wallet` - React Native Expo)

**Objective:** Provide an intuitive and clear user interface for users to manage their staked tokens and rewards.

*   **UI/UX Design:**
    *   **New "Staking" Tab/Section:**
        *   **Action:** Add navigation to this new section.
    *   **Display Components (`@repo/ui` or new):**
        *   `StakingDashboardCard`: Shows `Team556` available, total staked `Team556`, total `T556R` earned, current APY.
        *   `StakingInputForm`: Input for amount, selector for Stake/Unstake action.
        *   `RewardsPanel`: Shows claimable `T556R`, button to "Claim Rewards".
        *   `StakingActivityList`: Displays history of stake, unstake, claim transactions (can be fetched from backend or parsed from on-chain history if available).
    *   **Action:** Ensure all UI elements use colors from `constants/Colors.ts`.
*   **State Management (Zustand - `stakingStore`):**
    *   **State:**
        *   `availableToStake: number`
        *   `stakedAmount: number`
        *   `claimedRewards: number`
        *   `pendingRewards: number`
        *   `apy: number | string`
        *   `isLoadingStake: boolean`, `isLoadingUnstake: boolean`, `isLoadingClaim: boolean`
        *   `stakingHistory: StakingActivity[]`
    *   **Actions:**
        *   `fetchStakingInfo()`: Calls `GET /staking/info` on `main-api`.
        *   `handleStake(amount)`: Calls `POST /staking/stake`.
        *   `handleUnstake(amount)`: Calls `POST /staking/unstake`.
        *   `handleClaimRewards()`: Calls `POST /staking/claim-rewards`.
*   **API Integration:**
    *   **Action:** Create a new service/API client for staking endpoints in `main-api`.
    *   **Transaction Signing:**
        *   **Action:** When backend returns a serialized, partially-signed transaction, use the connected wallet (e.g., via Wallet Adapter or equivalent in React Native/Expo if available, or custom solution for key management) to get user's signature.
        *   **Action:** Send the fully signed transaction back to an endpoint on `main-api` or `solana-api` for broadcasting, or broadcast directly from the client if preferred.
    *   **User Feedback:**
        *   **Action:** Implement loading indicators for all async operations.
        *   **Action:** Use toasts/notifications for success and error messages (e.g., "Stake successful!", "Failed to claim rewards: Insufficient funds").
*   **Component Development (`@repo/ui`):**
    *   **Action:** Develop new generic components if needed (e.g., `MetricDisplayCard`, `ActionInputForm`) and use them in the wallet app.

---

### Development Workflow

1.  **Pre-requisites & Setup:**
    *   **Action:** Ensure Rust, Solana Tool Suite, and Anchor CLI are installed and up to date for smart contract development.
    *   **Action:** Set up separate wallets for admin/testing on Devnet/Testnet.
    *   **Action:** Fund test wallets with Devnet SOL.
2.  **Define Tokenomics & Rules (Revisit & Finalize):**
    *   **Action:** Document precise reward calculation logic (e.g., rewards per slot vs. per second/minute/hour).
    *   **Action:** Finalize decisions on lock-up periods, penalties, and `T556R` funding/replenishment strategy.
3.  **Smart Contract First (Iterative Development):**
    *   **Action:** Start with basic `stake` and `unstake` functionality.
    *   **Action:** Implement reward calculation and `claim_rewards`.
    *   **Action:** Add admin functions and configurations.
    *   **Action:** Write tests concurrently with development for each piece of functionality.
    *   **Action:** Deploy to Devnet early and often. Test with client-side scripts.
    *   **CRITICAL:** **Security Audit:** Once the contract is feature-complete and thoroughly tested, engage a reputable third-party auditor for a full security audit before deploying to Mainnet-beta.
4.  **Backend APIs (Parallel or Post-Contract-Interface-Stability):**
    *   **Action:** Develop `solana-api` endpoints to interact with the deployed Devnet smart contract.
    *   **Action:** Build `main-api` endpoints, focusing on auth, validation, and orchestration.
    *   **Action:** Test API endpoints thoroughly using tools like Postman or automated API tests.
5.  **Frontend App (Parallel with Backend):**
    *   **Action:** Design and implement UI components.
    *   **Action:** Set up `stakingStore` with mock data initially.
    *   **Action:** Integrate with backend APIs once they are available and stable on a dev environment.
6.  **End-to-End Testing:**
    *   **Action:** Conduct thorough testing of the entire flow: Frontend -> Main API -> Solana API -> Solana Smart Contract -> Blockchain -> (Data retrieval back to frontend).
    *   **Action:** Test on Devnet and then Testnet with a wider group if possible.
    *   **Action:** Test various user scenarios and edge cases.
7.  **Deployment to Mainnet-beta:**
    *   **Action:** Create a detailed deployment plan.
    *   **Action:** Deploy the audited smart contract to Mainnet-beta. This is irreversible for the program ID unless upgradable (consider BPF Upgradeable Loader).
    *   **Action:** Configure admin parameters on the mainnet contract.
    *   **Action:** Deploy backend and frontend updates pointing to mainnet contract and APIs.
    *   **Action:** Monitor closely post-launch.

---

This plan provides a roadmap for adding staking functionality. It emphasizes a systematic approach, starting with the foundational smart contract and progressively building out the backend and frontend components. **Security, especially for the smart contract, is paramount.**
