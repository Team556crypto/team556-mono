# Phase 3 Complete: n8n Team556 Token Tracking System

## ✅ What We Built

### Complete n8n Automation System
- **Docker-based deployment** with environment integration
- **3 production-ready workflows** for comprehensive tracking
- **Automated startup script** with validation and health checks
- **Comprehensive documentation** for setup and troubleshooting

### 🔄 Core Workflows Implemented

#### 1. Team556 Balance Monitor (`team556-balance-monitor.json`)
- **Runs every 15 minutes** to check token balances
- **Batch processes 10 users at a time** for efficiency
- **Calls Solana RPC** to get real token account data
- **Detects first-time token acquisitions** automatically
- **Updates referral records and logs events** in real-time
- **Triggers statistics updates** via API calls

#### 2. Daily Statistics Aggregation (`daily-referral-stats.json`)
- **Runs daily at 2 AM** for comprehensive recalculation
- **Processes active referrers in batches of 25**
- **Calculates all conversion rate metrics**
- **Generates system-wide summary reports**
- **Updates cached statistics for fast API responses**

#### 3. Real-time Transaction Webhook (`team556-transaction-webhook.json`)
- **Receives webhooks** at `/webhook/team556-transaction`
- **Filters Team556 token transfers** from transaction data
- **Instantly detects first purchases** vs ongoing balance changes
- **Logs detailed event timeline** with transaction signatures
- **Real-time referral record updates**

### 🎯 Key Features

**Smart Processing**:
- Only processes users who haven't been checked recently
- Batches operations to respect API rate limits
- Conditional logic to avoid unnecessary database updates
- Graceful error handling with detailed logging

**Real-time + Scheduled**:
- 15-minute scheduled balance monitoring
- Instant webhook processing for immediate detection
- Daily comprehensive statistics recalculation
- Event-driven architecture for optimal performance

**Production-Ready**:
- Environment variable integration with existing `.env`
- Docker containerization for easy deployment
- Health checks and validation in startup script
- Comprehensive error handling and retry logic

### 📊 Data Flow Architecture

```
Referral User Signs Up
         ↓
User Creates Wallet (logged by existing API)
         ↓
n8n Monitors Balance Every 15 Minutes
         ↓
User Acquires Team556 Tokens
         ↓
n8n Detects First Purchase & Updates Records
         ↓
Statistics Updated & Cached
         ↓
Dashboard Shows Real-time Metrics
```

### 🔧 Integration Points

**With Existing API**:
- Uses existing database schema and models
- Calls API endpoints for statistics updates
- Respects existing authentication patterns
- Integrates with current environment variables

**With Solana Network**:
- Direct RPC calls to mainnet via Helius
- Token account monitoring for Team556 mint
- Transaction signature tracking
- Real-time balance calculation

**With External Services**:
- Webhook endpoints for transaction monitoring services
- API callbacks for statistics synchronization
- Database direct access for high-performance queries

### 📁 File Structure Created

```
apps/referral-tracker/
├── docker-compose.yml          # n8n container configuration
├── start.sh                    # Automated startup script
├── README.md                   # Quick start guide
├── workflows/                  # n8n workflow definitions
│   ├── team556-balance-monitor.json
│   ├── daily-referral-stats.json
│   └── team556-transaction-webhook.json
├── docs/
│   └── README.md              # Comprehensive documentation
├── credentials/               # n8n credentials storage
├── custom-nodes/              # Custom n8n nodes (if needed)
└── PHASE_3_SUMMARY.md        # This summary
```

### 🎛️ Environment Configuration Added

Added to main `.env` file:
```bash
# n8n Referral Tracker
N8N__BASIC_AUTH_USER=admin
N8N__BASIC_AUTH_PASSWORD=team556admin
N8N__HOST=localhost
N8N__PROTOCOL=http
N8N__LOG_LEVEL=info
N8N__ENCRYPTION_KEY=team556encryptionkey_n8n_secure_2024
N8N__DB_HOST=db.rbmjlidoxefwvskpaioo.supabase.co
N8N__DB_PORT=5432
N8N__DB_NAME=team556_n8n
N8N__DB_USER=postgres
N8N__DB_PASSWORD=Sn0wd@miz120356@Fovgh6
N8N__WEBHOOK_URL=http://localhost:5678

# n8n Team556 Integration
N8N__TEAM556_API_URL=https://team556-main-api.fly.dev/api
N8N__TEAM556_DB_URL=postgresql://postgres:Sn0wd@miz120356@Fovgh6@db.rbmjlidoxefwvskpaioo.supabase.co:5432/postgres
N8N__SOLANA_RPC_URL=${GLOBAL__MAINNET_RPC_URL}
N8N__TEAM556_TOKEN_MINT=${GLOBAL__TEAM_MINT}
```

## 🚀 How to Deploy

### 1. Start the System
```bash
cd apps/referral-tracker
./start.sh
```

### 2. Access n8n Interface
- **URL**: http://localhost:5678
- **Username**: `admin`
- **Password**: `team556admin`

### 3. Set Up Database Credentials
1. Go to **Settings** → **Credentials**
2. Create PostgreSQL credential named "Team556 Database"
3. Use connection details from `.env` file

### 4. Import & Activate Workflows
1. Import all 3 workflow JSON files
2. Activate each workflow
3. Verify they show as "Active" in the interface

### 5. Configure Webhooks (Optional)
Set up your Solana monitoring service to send webhooks to:
```
POST http://localhost:5678/webhook/team556-transaction
```

## 📈 Expected Results

Once deployed, the system will:

1. **Every 15 minutes**: Check balances for all referred users with wallets
2. **Immediately**: Process any Team556 token transactions via webhooks  
3. **Daily at 2 AM**: Recalculate all referral statistics and conversion rates
4. **Real-time**: Update referral records when users first acquire Team556 tokens

### Metrics Tracked

**Referral Funnel**:
- Total referrals (signup)
- Email verified referrals  
- Wallet created referrals
- Team556 token holding referrals

**Financial Metrics**:
- Total Team556 volume referred
- Average balance per referred user
- First purchase amounts and dates

**Performance Metrics**:
- Conversion rate: signup → email verification
- Conversion rate: email → wallet creation  
- Conversion rate: wallet → Team556 acquisition

## 🔧 Production Considerations

**Security**:
- Change default n8n credentials
- Use HTTPS in production
- Restrict database access by IP
- Implement webhook signature validation

**Scaling**:
- Monitor RPC rate limits (currently ~1000 req/hour)
- Adjust batch sizes based on load
- Consider multiple RPC endpoints for redundancy
- Monitor database connection pool usage

**Monitoring**:
- Set up n8n execution monitoring
- Track workflow success/failure rates
- Monitor database query performance
- Set up alerts for failed executions

## 🎯 Success Metrics

The system is working correctly when:

- ✅ Balance monitoring workflow runs every 15 minutes without errors
- ✅ First Team556 purchases are detected within 15 minutes  
- ✅ Referral statistics are updated daily
- ✅ Webhook processing handles real-time transactions
- ✅ Database contains detailed event logs
- ✅ API statistics endpoints return current data

## 🔄 Next Steps

**Phase 4: Frontend Dashboard** - The n8n system provides all the data needed for comprehensive referral dashboards showing:
- Real-time referral statistics
- Team556 token adoption rates
- Referral performance leaderboards
- Detailed conversion funnels

The foundation is now complete for a fully automated referral tracking system that monitors Team556 token adoption with both scheduled checks and real-time processing.