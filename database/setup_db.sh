#!/bin/bash
# Script to run SQL schema and test data setup
# Usage: ./setup_db.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

echo "🔧 Setting up database..."
echo "📁 Working directory: $SCRIPT_DIR"

if [ ! -f "sql/sql_run.sql" ]; then
    echo "❌ SQL file not found: sql/sql_run.sql"
    exit 1
fi

# Try docker-compose.db.yml first (for database-only setup)
if command -v docker-compose >/dev/null 2>&1; then
    # Check for invoicedoc-db-dev container (from docker-compose.db.yml)
    if docker ps --format "{{.Names}}" | grep -q "invoicedoc-db-dev"; then
        echo "✅ Docker container (invoicedoc-db-dev) is running"
        echo "📝 Running SQL script via Docker..."
        cat sql/sql_run.sql | docker exec -i invoicedoc-db-dev psql -U root -d invoices_db 2>&1
        if [ $? -eq 0 ]; then
            echo "✅ Tables created successfully!"
            echo "🔍 Verifying created tables:"
            docker exec -i invoicedoc-db-dev psql -U root -d invoices_db -c "\dt" 2>&1
            exit 0
        else
            echo "⚠️  Docker exec failed, trying alternative method..."
        fi
    # Check for pgdatabase container (from database/compose.yaml)
    elif docker-compose ps pgdatabase 2>/dev/null | grep -q "Up"; then
        echo "✅ Docker container (pgdatabase) is running"
        echo "📝 Running SQL script via Docker..."
        cat sql/sql_run.sql | docker-compose exec -T pgdatabase psql -U root -d invoices_db 2>&1
        if [ $? -eq 0 ]; then
            echo "✅ Tables created successfully!"
            echo "🔍 Verifying created tables:"
            docker-compose exec -T pgdatabase psql -U root -d invoices_db -c "\dt" 2>&1
            exit 0
        else
            echo "⚠️  Docker exec failed, trying alternative method..."
        fi
    else
        echo "ℹ️  Docker container is not running (trying alternative methods)"
    fi
fi

if command -v psql >/dev/null 2>&1; then
    echo "🔌 Trying to connect via psql (localhost:15432)..."
    PGPASSWORD=root psql -h localhost -p 15432 -U root -d invoices_db -f sql/sql_run.sql 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ Tables created successfully!"
        echo "🔍 Verifying created tables:"
        PGPASSWORD=root psql -h localhost -p 15432 -U root -d invoices_db -c "\dt" 2>&1
        exit 0
    else
        echo "⚠️  Connection via localhost:15432 failed, trying alternative method..."
    fi
fi

if command -v psql >/dev/null 2>&1; then
    echo "🔌 Trying local PostgreSQL (port 5432)..."
    psql -d invoices_db -f sql/sql_run.sql 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ Tables created successfully!"
        echo "🔍 Verifying created tables:"
        psql -d invoices_db -c "\dt" 2>&1
        exit 0
    fi
fi

echo ""
echo "❌ Unable to connect to database"
echo ""
echo "Please check:"
echo "1. Is Docker Desktop running?"
echo "2. Run this command first: cd database && docker-compose up -d"
echo "3. Or run SQL directly:"
echo "   PGPASSWORD=root psql -h localhost -p 15432 -U root -d invoices_db -f sql/sql_run.sql"
echo ""
echo "4. Or use Adminer (Web UI): http://localhost:8080"
echo "   - System: PostgreSQL"
echo "   - Server: pgdatabase"
echo "   - Username: root"
echo "   - Password: root"
echo "   - Database: invoices_db"
exit 1
