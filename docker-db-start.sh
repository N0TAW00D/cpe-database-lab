#!/bin/bash

# Docker Compose startup script for InvoiceDoc2 Database Only (for local development)

set -e

echo "🚀 Starting InvoiceDoc2 Database services..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Check if port 15432 is already in use
if lsof -Pi :15432 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Port 15432 is already in use."
    echo "📋 Checking for existing containers..."
    
    # Check for containers using port 15432
    EXISTING_CONTAINER=$(docker ps --filter "publish=15432" --format "{{.Names}}" | head -1)
    
    if [ ! -z "$EXISTING_CONTAINER" ]; then
        echo "   Found container: $EXISTING_CONTAINER"
        echo "   Stopping existing container..."
        docker stop "$EXISTING_CONTAINER" 2>/dev/null || true
        sleep 2
    else
        echo "   No Docker container found using port 15432."
        echo "   Please stop the process using port 15432 manually."
        echo "   Or use: lsof -i :15432"
        exit 1
    fi
fi

# Start database only (skip adminer for local dev)
echo "📦 Starting database container..."
docker-compose -f docker-compose.db.yml up -d database

echo "⏳ Waiting for database to be ready..."
sleep 5

# Check if database is ready
echo "🔍 Checking database health..."
for i in {1..30}; do
    if docker-compose -f docker-compose.db.yml exec -T database pg_isready -U root > /dev/null 2>&1; then
        echo "✅ Database is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "⚠️  Database is taking longer than expected to start"
    else
        sleep 1
    fi
done

# Check service status
echo ""
echo "📊 Service Status:"
docker-compose -f docker-compose.db.yml ps

# Run database setup if needed
echo ""
echo "🔧 Setting up database schema..."
if [ -f "database/setup_db.sh" ]; then
    cd database
    ./setup_db.sh
    cd ..
else
    echo "⚠️  setup_db.sh not found, skipping database setup"
    echo "   You can run it manually: cd database && ./setup_db.sh"
fi

echo ""
echo "✅ Database service started!"
echo ""
echo "📍 Access URLs:"
echo "   - Database:  localhost:15432"
echo ""
echo "💡 Tip: To start Adminer separately, run:"
echo "   docker-compose -f docker-compose.db.yml up -d adminer"
echo ""
echo "📝 Connection Details:"
echo "   - Host:     localhost"
echo "   - Port:     15432"
echo "   - Database: invoices_db"
echo "   - Username: root"
echo "   - Password: root"
echo ""
echo "📝 Useful commands:"
echo "   - View logs:    docker-compose -f docker-compose.db.yml logs -f"
echo "   - Stop:         docker-compose -f docker-compose.db.yml down"
echo "   - Restart:      docker-compose -f docker-compose.db.yml restart"
echo "   - Status:       docker-compose -f docker-compose.db.yml ps"
