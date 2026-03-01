#!/bin/bash
# Script to apply schema and optionally seed an empty database
# Usage: ./setup_db.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

SCHEMA_FILE="sql/001_schema.sql"
SEED_FILE="sql/003_seed.sql"
RESET_FILE="sql/sql_run.sql"
PROBE_TABLES=(invoice invoice_line_item customer product country units)

echo "🔧 Setting up database..."
echo "📁 Working directory: $SCRIPT_DIR"

if [ ! -f "$SCHEMA_FILE" ]; then
    echo "❌ SQL file not found: $SCHEMA_FILE"
    exit 1
fi

if [ ! -f "$SEED_FILE" ]; then
    echo "❌ SQL file not found: $SEED_FILE"
    exit 1
fi

docker_run_file() {
    local container_name="$1"
    local sql_file="$2"
    docker exec -i "$container_name" psql -U root -d invoices_db < "$sql_file" 2>&1
}

docker_has_data() {
    local container_name="$1"
    local table
    local out
    for table in "${PROBE_TABLES[@]}"; do
        out="$(docker exec -i "$container_name" psql -U root -d invoices_db -t -A -c "select 1 from $table limit 1;" 2>/dev/null | tr -d '[:space:]')"
        if [ "$out" = "1" ]; then
            return 0
        fi
    done
    return 1
}

compose_run_file() {
    local sql_file="$1"
    docker-compose exec -T pgdatabase psql -U root -d invoices_db < "$sql_file" 2>&1
}

compose_has_data() {
    local table
    local out
    for table in "${PROBE_TABLES[@]}"; do
        out="$(docker-compose exec -T pgdatabase psql -U root -d invoices_db -t -A -c "select 1 from $table limit 1;" 2>/dev/null | tr -d '[:space:]')"
        if [ "$out" = "1" ]; then
            return 0
        fi
    done
    return 1
}

localhost_run_file() {
    local sql_file="$1"
    PGPASSWORD=root psql -h localhost -p 15432 -U root -d invoices_db -f "$sql_file" 2>&1
}

localhost_has_data() {
    local table
    local out
    for table in "${PROBE_TABLES[@]}"; do
        out="$(PGPASSWORD=root psql -h localhost -p 15432 -U root -d invoices_db -t -A -c "select 1 from $table limit 1;" 2>/dev/null | tr -d '[:space:]')"
        if [ "$out" = "1" ]; then
            return 0
        fi
    done
    return 1
}

local_run_file() {
    local sql_file="$1"
    psql -d invoices_db -f "$sql_file" 2>&1
}

local_has_data() {
    local table
    local out
    for table in "${PROBE_TABLES[@]}"; do
        out="$(psql -d invoices_db -t -A -c "select 1 from $table limit 1;" 2>/dev/null | tr -d '[:space:]')"
        if [ "$out" = "1" ]; then
            return 0
        fi
    done
    return 1
}

setup_docker() {
    local container_name="$1"
    echo "✅ Docker container ($container_name) is running"
    echo "🧱 Applying schema..."
    docker_run_file "$container_name" "$SCHEMA_FILE"
    if [ $? -ne 0 ]; then
        return 1
    fi

    if docker_has_data "$container_name"; then
        echo "✅ Existing data found. Skipping seed."
        echo "🔍 Verifying created tables:"
        docker exec -i "$container_name" psql -U root -d invoices_db -c "\dt" 2>&1
        return 0
    fi

    echo "🌱 Database is empty. Running seed data..."
    docker_run_file "$container_name" "$SEED_FILE"
    if [ $? -ne 0 ]; then
        return 1
    fi

    echo "✅ Schema applied and seed data loaded!"
    echo "🔍 Verifying created tables:"
    docker exec -i "$container_name" psql -U root -d invoices_db -c "\dt" 2>&1
    return 0
}

setup_compose() {
    echo "✅ Docker container (pgdatabase) is running"
    echo "🧱 Applying schema..."
    compose_run_file "$SCHEMA_FILE"
    if [ $? -ne 0 ]; then
        return 1
    fi

    if compose_has_data; then
        echo "✅ Existing data found. Skipping seed."
        echo "🔍 Verifying created tables:"
        docker-compose exec -T pgdatabase psql -U root -d invoices_db -c "\dt" 2>&1
        return 0
    fi

    echo "🌱 Database is empty. Running seed data..."
    compose_run_file "$SEED_FILE"
    if [ $? -ne 0 ]; then
        return 1
    fi

    echo "✅ Schema applied and seed data loaded!"
    echo "🔍 Verifying created tables:"
    docker-compose exec -T pgdatabase psql -U root -d invoices_db -c "\dt" 2>&1
    return 0
}

setup_localhost() {
    echo "🔌 Trying psql (localhost:15432)..."
    echo "🧱 Applying schema..."
    localhost_run_file "$SCHEMA_FILE"
    if [ $? -ne 0 ]; then
        return 1
    fi

    if localhost_has_data; then
        echo "✅ Existing data found. Skipping seed."
        echo "🔍 Verifying created tables:"
        PGPASSWORD=root psql -h localhost -p 15432 -U root -d invoices_db -c "\dt" 2>&1
        return 0
    fi

    echo "🌱 Database is empty. Running seed data..."
    localhost_run_file "$SEED_FILE"
    if [ $? -ne 0 ]; then
        return 1
    fi

    echo "✅ Schema applied and seed data loaded!"
    echo "🔍 Verifying created tables:"
    PGPASSWORD=root psql -h localhost -p 15432 -U root -d invoices_db -c "\dt" 2>&1
    return 0
}

setup_local() {
    echo "🔌 Trying local PostgreSQL (port 5432)..."
    echo "🧱 Applying schema..."
    local_run_file "$SCHEMA_FILE"
    if [ $? -ne 0 ]; then
        return 1
    fi

    if local_has_data; then
        echo "✅ Existing data found. Skipping seed."
        echo "🔍 Verifying created tables:"
        psql -d invoices_db -c "\dt" 2>&1
        return 0
    fi

    echo "🌱 Database is empty. Running seed data..."
    local_run_file "$SEED_FILE"
    if [ $? -ne 0 ]; then
        return 1
    fi

    echo "✅ Schema applied and seed data loaded!"
    echo "🔍 Verifying created tables:"
    psql -d invoices_db -c "\dt" 2>&1
    return 0
}

if command -v docker-compose >/dev/null 2>&1; then
    if docker ps --format "{{.Names}}" | grep -q "invoicedoc-db-dev"; then
        setup_docker "invoicedoc-db-dev" && exit 0
        echo "⚠️  Docker exec failed, trying alternative method..."
    elif docker-compose ps pgdatabase 2>/dev/null | grep -q "Up"; then
        setup_compose && exit 0
        echo "⚠️  Docker exec failed, trying alternative method..."
    else
        echo "ℹ️  Docker container is not running (trying alternative methods)"
    fi
fi

if command -v psql >/dev/null 2>&1; then
    setup_localhost && exit 0
    echo "⚠️  Connection via localhost:15432 failed, trying alternative method..."
fi

if command -v psql >/dev/null 2>&1; then
    setup_local && exit 0
fi

echo ""
echo "❌ Unable to connect to database"
echo ""
echo "Please check:"
echo "1. Is Docker Desktop running?"
echo "2. Run this command first: cd database && docker-compose up -d"
echo "3. To apply schema manually:"
echo "   PGPASSWORD=root psql -h localhost -p 15432 -U root -d invoices_db -f $SCHEMA_FILE"
echo "4. To seed an empty database manually:"
echo "   PGPASSWORD=root psql -h localhost -p 15432 -U root -d invoices_db -f $SEED_FILE"
echo "5. To reset everything from scratch:"
echo "   PGPASSWORD=root psql -h localhost -p 15432 -U root -d invoices_db -f $RESET_FILE"
echo ""
echo "6. Or use Adminer (Web UI): http://localhost:8080"
echo "   - System: PostgreSQL"
echo "   - Server: pgdatabase"
echo "   - Username: root"
echo "   - Password: root"
echo "   - Database: invoices_db"
exit 1
