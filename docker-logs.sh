#!/bin/bash

# Docker Compose logs script for InvoiceDoc2

SERVICE=${1:-""}

if [ -z "$SERVICE" ]; then
    echo "📋 Showing logs for all services..."
    docker-compose logs -f
else
    echo "📋 Showing logs for service: $SERVICE"
    docker-compose logs -f "$SERVICE"
fi
