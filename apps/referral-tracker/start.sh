#!/bin/bash

# Team556 Referral Tracker - n8n Startup Script
# This script starts the n8n instance with proper environment variables

set -e

echo "🚀 Starting Team556 Referral Tracker (n8n)..."

# Check if .env file exists in the root directory
if [ ! -f "../../.env" ]; then
    echo "❌ Error: .env file not found in project root"
    echo "Please ensure the .env file exists with n8n configuration"
    exit 1
fi

# Export environment variables from the main .env file
echo "📋 Loading environment variables..."
export $(grep -v '^#' ../../.env | grep '^N8N__' | sed 's/N8N__//' | xargs)

# Export additional required variables
export $(grep -v '^#' ../../.env | grep '^GLOBAL__' | xargs)

# Verify required environment variables
required_vars=(
    "BASIC_AUTH_USER"
    "BASIC_AUTH_PASSWORD" 
    "DB_HOST"
    "DB_NAME"
    "DB_USER"
    "DB_PASSWORD"
    "TEAM556_API_URL"
    "SOLANA_RPC_URL"
    "TEAM556_TOKEN_MINT"
)

echo "🔍 Checking required environment variables..."
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: Required environment variable $var is not set"
        exit 1
    fi
done

echo "✅ All required environment variables are set"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running"
    echo "Please start Docker Desktop and try again"
    exit 1
fi

# Check if the database is reachable (optional but recommended)
echo "🔗 Testing database connection..."
if command -v psql > /dev/null; then
    DB_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:${DB_PORT:-5432}/$DB_NAME"
    if psql "$DB_URL" -c "SELECT 1;" > /dev/null 2>&1; then
        echo "✅ Database connection successful"
    else
        echo "⚠️  Warning: Could not connect to database. n8n will attempt to connect on startup."
    fi
else
    echo "ℹ️  psql not found, skipping database connectivity test"
fi

# Start n8n with docker-compose
echo "🐳 Starting n8n container..."
docker-compose up -d

# Wait a moment for the container to start
sleep 3

# Check if container is running
if docker ps | grep -q "team556-referral-tracker"; then
    echo "✅ n8n container started successfully!"
    echo ""
    echo "🌐 n8n is accessible at: http://localhost:5678"
    echo "👤 Username: $BASIC_AUTH_USER"
    echo "🔑 Password: $BASIC_AUTH_PASSWORD"
    echo ""
    echo "📊 Available workflows:"
    echo "   • Team556 Token Balance Monitor (runs every 15 minutes)"
    echo "   • Daily Referral Statistics Update (runs daily at 2 AM)"
    echo "   • Team556 Transaction Webhook (real-time processing)"
    echo ""
    echo "📝 To view logs: docker-compose logs -f"
    echo "🛑 To stop: docker-compose down"
    echo ""
    echo "🔧 Next steps:"
    echo "   1. Open n8n at http://localhost:5678"
    echo "   2. Set up database credentials in n8n"
    echo "   3. Import and activate the workflows"
    echo "   4. Configure webhook URLs in your Solana monitoring service"
    
    # Display webhook URL
    WEBHOOK_URL="http://localhost:5678/webhook/team556-transaction"
    echo "   5. Webhook URL: $WEBHOOK_URL"
    
else
    echo "❌ Error: n8n container failed to start"
    echo "Check logs with: docker-compose logs"
    exit 1
fi