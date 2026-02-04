#!/bin/bash

# Docker Compose stop script for InvoiceDoc2

set -e

echo "🛑 Stopping InvoiceDoc2 services..."

docker-compose down

echo "✅ Services stopped!"
