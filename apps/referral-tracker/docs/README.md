# Team556 Referral Tracker (n8n)

## Overview

This n8n-powered referral tracker automates Team556 token balance monitoring and referral event processing for the Digital Armory referral system. It provides real-time and scheduled tracking of when referred users acquire Team556 tokens.

## Features

### 🔄 Automated Token Monitoring
- **Every 15 minutes**: Check Team556 token balances for all referred users
- **Real-time webhooks**: Process Team556 transactions instantly
- **First purchase detection**: Automatically detect when referred users first acquire Team556
- **Balance updates**: Track ongoing balance changes

### 📊 Statistics & Analytics
- **Daily aggregation**: Update referral statistics every night at 2 AM
- **Performance metrics**: Calculate conversion rates at each funnel stage
- **Event logging**: Detailed timeline of all referral events
- **API integration**: Update main API with latest statistics

### 🎯 Intelligent Processing
- **Batch processing**: Handle multiple users efficiently
- **Error handling**: Graceful failure handling with retries
- **Rate limiting**: Respectful API usage patterns
- **Conditional logic**: Only process relevant transactions

## Architecture

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│    Scheduled    │    │     n8n      │    │   External      │
│    Triggers     │───▶│  Workflows   │◄──▶│   Services      │
│                 │    │              │    │                 │
│ • Every 15 min  │    │ • Balance    │    │ • Solana RPC    │
│ • Daily 2 AM    │    │   Monitor    │    │ • Team556 API   │
│ • Webhooks      │    │ • Statistics │    │ • PostgreSQL    │
│                 │    │ • Events     │    │                 │
└─────────────────┘    └──────────────┘    └─────────────────┘
```

## Quick Start

### 1. Start n8n
```bash
cd apps/referral-tracker
./start.sh
```

### 2. Access n8n Interface
- **URL**: http://localhost:5678
- **Username**: admin (from .env)
- **Password**: team556admin (from .env)

### 3. Set Up Database Credentials
1. Go to **Settings** > **Credentials**
2. Create new **PostgreSQL** credential named "Team556 Database"
3. Use connection details from your .env file:
   - **Host**: db.rbmjlidoxefwvskpaioo.supabase.co
   - **Port**: 5432
   - **Database**: postgres
   - **Username**: postgres
   - **Password**: (from .env)

### 4. Import Workflows
1. Go to **Workflows**
2. Click **Import from file**
3. Import each workflow from the `workflows/` directory:
   - `team556-balance-monitor.json`
   - `daily-referral-stats.json`
   - `team556-transaction-webhook.json`

### 5. Activate Workflows
1. Open each imported workflow
2. Click **Active** toggle to enable
3. Verify the workflows show as "Active"

## Workflows

### 1. Team556 Balance Monitor
**File**: `workflows/team556-balance-monitor.json`

**Purpose**: Monitors Team556 token balances for referred users every 15 minutes

**Key Features**:
- Queries users who haven't been checked recently
- Calls Solana RPC to get current balances
- Detects first-time token acquisitions
- Updates referral records and logs events
- Triggers statistics updates

**Schedule**: Every 15 minutes

**Flow**:
1. **Cron Trigger** → Every 15 minutes
2. **Get Users to Check** → Query referred users needing balance checks
3. **Split in Batches** → Process 10 users at a time
4. **Check Team556 Balance** → Query Solana RPC for token accounts
5. **Process Balance Data** → Calculate balances and detect changes
6. **If Balance Changed** → Conditional processing
7. **Update Records** → Update referral and event tables
8. **Trigger Stats Update** → Notify main API of changes

### 2. Daily Referral Statistics
**File**: `workflows/daily-referral-stats.json`

**Purpose**: Calculates and updates referral performance statistics daily

**Key Features**:
- Recalculates statistics for active referrers
- Updates conversion rates and financial metrics
- Generates daily summary reports
- Sends reports to main API

**Schedule**: Daily at 2:00 AM

**Flow**:
1. **Daily Trigger** → 2 AM cron job
2. **Get Active Referrers** → Find users with recent referral activity
3. **Calculate Stats** → Complex SQL to compute all metrics
4. **Upsert Stats** → Update or insert statistics records
5. **Generate Summary** → Create system-wide summary
6. **Send Report** → POST summary to main API

### 3. Team556 Transaction Webhook
**File**: `workflows/team556-transaction-webhook.json`

**Purpose**: Processes real-time Team556 token transactions via webhooks

**Key Features**:
- Receives transaction webhooks from Solana monitoring services
- Filters for Team556 token transfers
- Detects first purchases vs. subsequent transfers
- Real-time referral record updates

**Trigger**: HTTP Webhook at `/webhook/team556-transaction`

**Webhook URL**: `http://localhost:5678/webhook/team556-transaction`

**Expected Payload**:
```json
{
  "signature": "transaction_signature",
  "slot": 12345678,
  "accounts": ["account1", "account2"],
  "timestamp": "2025-10-14T20:52:04Z",
  "token_transfers": [
    {
      "mint": "AMNfeXpjD6kXyyTDB4LMKzNWypqNHwtgJUACHUmuKLD5",
      "from": "sender_address",
      "to": "receiver_address", 
      "amount": 1000500000000,
      "decimals": 9
    }
  ]
}
```

## Environment Configuration

The system uses environment variables from the main `.env` file:

```bash
# n8n Configuration
N8N__BASIC_AUTH_USER=admin
N8N__BASIC_AUTH_PASSWORD=team556admin
N8N__DB_HOST=db.rbmjlidoxefwvskpaioo.supabase.co
N8N__TEAM556_API_URL=https://team556-main-api.fly.dev/api
N8N__SOLANA_RPC_URL=https://mainnet.helius-rpc.com/...
N8N__TEAM556_TOKEN_MINT=AMNfeXpjD6kXyyTDB4LMKzNWypqNHwtgJUACHUmuKLD5
```

## Database Integration

### Tables Used

1. **`referrals`**: Core referral relationships and progression tracking
2. **`referral_stats`**: Cached performance statistics  
3. **`referral_events`**: Detailed event timeline
4. **`users`**: User information including wallet addresses

### Key Queries

**Balance Monitoring**:
```sql
SELECT DISTINCT r.referred_user_id, r.id as referral_id, 
       u.primary_wallet_address, r.current_team556_balance
FROM referrals r 
JOIN users u ON r.referred_user_id = u.id 
WHERE u.primary_wallet_address IS NOT NULL 
  AND (r.last_balance_check_at IS NULL 
       OR r.last_balance_check_at < NOW() - INTERVAL '15 minutes')
LIMIT 50
```

**Statistics Calculation**:
```sql
SELECT 
  COUNT(*) as total_referrals,
  COUNT(CASE WHEN email_verified_at IS NOT NULL THEN 1 END) as verified,
  COUNT(CASE WHEN current_team556_balance > 0 THEN 1 END) as with_team556,
  SUM(current_team556_balance) as total_volume
FROM referrals 
WHERE referrer_user_id = ?
```

## Monitoring & Debugging

### Viewing Logs
```bash
# All n8n logs
docker-compose logs -f

# Just n8n container logs
docker logs team556-referral-tracker -f
```

### Common Issues

**1. Database Connection Failed**
- Check database credentials in n8n settings
- Verify network connectivity to Supabase
- Ensure IP whitelist includes your server

**2. Solana RPC Errors**  
- Check RPC endpoint is responding
- Verify rate limits aren't exceeded
- Consider using backup RPC endpoints

**3. Webhook Not Receiving Data**
- Verify webhook URL is accessible externally
- Check firewall settings
- Ensure webhook payload matches expected format

**4. Statistics Not Updating**
- Check if workflows are active
- Verify database permissions
- Look for errors in workflow execution history

### Performance Optimization

**Batch Sizing**:
- Balance monitor: 10 users per batch
- Statistics update: 25 referrers per batch
- Adjust based on RPC rate limits

**Timing**:
- Balance checks: Every 15 minutes (adjustable)
- Statistics: Daily at 2 AM (low usage time)
- Consider timezone for optimal scheduling

## API Integration

### Main API Endpoints

The workflows integrate with these main API endpoints:

**Statistics Update**:
```
POST /api/internal/referrals/stats/update/:referralId
```

**Daily Report**:
```
POST /api/internal/referrals/daily-report
```

### Webhook Integration

To receive real-time transaction data, configure your Solana monitoring service to send webhooks to:

```
POST http://localhost:5678/webhook/team556-transaction
```

For production, use your public domain:
```
POST https://n8n.yourdomain.com/webhook/team556-transaction
```

## Production Deployment

### Docker Compose Production

Update environment variables for production:

```yaml
environment:
  - N8N_HOST=n8n.yourdomain.com
  - N8N_PROTOCOL=https
  - WEBHOOK_URL=https://n8n.yourdomain.com
```

### Scaling Considerations

1. **Database Connections**: Monitor connection pool usage
2. **RPC Rate Limits**: Implement backoff strategies  
3. **Memory Usage**: Monitor n8n container resources
4. **Webhook Queue**: Consider webhook queuing for high volume

### Security

1. **Basic Auth**: Change default credentials
2. **Network Security**: Use VPC or private networks
3. **Database Access**: Restrict IP access
4. **Webhook Validation**: Verify webhook signatures
5. **Environment Variables**: Use secrets management

## Troubleshooting Guide

### Workflow Fails to Execute

1. Check workflow is active
2. Verify all credentials are configured
3. Check execution history for error details
4. Validate environment variables

### Balance Updates Not Working

1. Verify Solana RPC endpoint is accessible
2. Check token mint address is correct
3. Ensure wallet addresses in database are valid
4. Check for API rate limiting

### Statistics Not Calculating

1. Verify database queries are executing successfully
2. Check for data type mismatches
3. Ensure referral records exist
4. Validate date/time calculations

### Webhook Not Triggering

1. Test webhook URL manually with curl
2. Check webhook path matches n8n configuration
3. Verify payload format matches expected structure
4. Check n8n logs for incoming requests

## Future Enhancements

1. **Multi-chain Support**: Extend to other blockchain networks
2. **Advanced Analytics**: Cohort analysis and retention metrics
3. **Real-time Dashboards**: Live statistics visualization
4. **Alert System**: Notifications for significant events
5. **A/B Testing**: Support different referral incentive structures

## Support

For issues with the referral tracking system:

1. Check the execution history in n8n interface
2. Review container logs: `docker-compose logs -f`
3. Verify environment configuration
4. Test database connectivity
5. Check Solana RPC endpoint status