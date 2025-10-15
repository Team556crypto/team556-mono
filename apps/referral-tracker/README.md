# Team556 Referral Tracker

Automated referral tracking system using n8n to monitor Team556 token balances and referral conversions.

## Quick Start

1. **Start the system**:
   ```bash
   ./start.sh
   ```

2. **Access n8n**: http://localhost:5678
   - Username: `admin`
   - Password: `team556admin`

3. **Set up credentials** in n8n for "Team556 Database"

4. **Import workflows** from `workflows/` directory

5. **Activate workflows** in the n8n interface

## Features

- ✅ **Every 15 minutes**: Check Team556 balances for referred users
- ✅ **Real-time webhooks**: Process Team556 transactions instantly  
- ✅ **Daily statistics**: Update referral performance metrics at 2 AM
- ✅ **Event logging**: Complete referral progression timeline

## Workflows

1. **`team556-balance-monitor.json`** - Token balance monitoring (15 min intervals)
2. **`daily-referral-stats.json`** - Statistics aggregation (daily at 2 AM)  
3. **`team556-transaction-webhook.json`** - Real-time transaction processing

## Webhook URL

For real-time transaction processing:
```
POST http://localhost:5678/webhook/team556-transaction
```

## Documentation

See `docs/README.md` for comprehensive setup and troubleshooting guide.

## Commands

```bash
# Start n8n
./start.sh

# View logs
docker-compose logs -f

# Stop n8n
docker-compose down
```