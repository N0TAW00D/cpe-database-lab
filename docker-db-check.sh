#!/bin/bash

# Script to check database status and data

set -e

echo "🔍 Checking InvoiceDoc2 Database Status..."
echo ""

# Check if container is running
CONTAINER_NAME="invoicedoc-db-dev"
if ! docker ps --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
    echo "❌ Container ${CONTAINER_NAME} is not running"
    echo "   Please start it first: npm run docker:db:start"
    exit 1
fi

echo "✅ Container ${CONTAINER_NAME} is running"
echo ""

# Check tables
echo "📊 Checking tables..."
docker exec ${CONTAINER_NAME} psql -U root -d invoices_db -c "\dt" 2>&1 || echo "⚠️  Could not list tables"

echo ""
echo "📈 Checking data counts..."

# Check customer count
CUSTOMER_COUNT=$(docker exec ${CONTAINER_NAME} psql -U root -d invoices_db -t -c "SELECT COUNT(*) FROM customer;" 2>/dev/null | tr -d ' ' || echo "0")
echo "   Customers: ${CUSTOMER_COUNT}"

# Check product count
PRODUCT_COUNT=$(docker exec ${CONTAINER_NAME} psql -U root -d invoices_db -t -c "SELECT COUNT(*) FROM product;" 2>/dev/null | tr -d ' ' || echo "0")
echo "   Products: ${PRODUCT_COUNT}"

# Check invoice count
INVOICE_COUNT=$(docker exec ${CONTAINER_NAME} psql -U root -d invoices_db -t -c "SELECT COUNT(*) FROM invoice;" 2>/dev/null | tr -d ' ' || echo "0")
echo "   Invoices: ${INVOICE_COUNT}"

# Check invoice_line_item count
LINE_ITEM_COUNT=$(docker exec ${CONTAINER_NAME} psql -U root -d invoices_db -t -c "SELECT COUNT(*) FROM invoice_line_item;" 2>/dev/null | tr -d ' ' || echo "0")
echo "   Invoice Line Items: ${LINE_ITEM_COUNT}"

echo ""
if [ "$CUSTOMER_COUNT" = "0" ] && [ "$PRODUCT_COUNT" = "0" ] && [ "$INVOICE_COUNT" = "0" ]; then
    echo "⚠️  Database appears to be empty"
    echo ""
    echo "💡 To populate the database, run:"
    echo "   cd database && ./setup_db.sh"
    echo ""
    echo "   Or manually:"
    echo "   docker exec -i ${CONTAINER_NAME} psql -U root -d invoices_db < database/sql/sql_run.sql"
else
    echo "✅ Database contains data"
fi

echo ""
echo "📝 Connection Details:"
echo "   Host:     localhost"
echo "   Port:     15432"
echo "   Database: invoices_db"
echo "   Username: root"
echo "   Password: root"
