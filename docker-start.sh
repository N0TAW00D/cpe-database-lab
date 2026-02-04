#!/bin/bash

# Docker Compose startup script for InvoiceDoc2

set -e

echo "🚀 Starting InvoiceDoc2 services..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Build and start services
echo "📦 Building and starting containers..."
docker-compose up -d --build

echo "⏳ Waiting for services to be ready..."
sleep 5

# Check service status
echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "✅ Services started!"
echo ""
echo "📍 Access URLs:"
echo "   - Client:    http://localhost:3000"
echo "   - Server:    http://localhost:4000"
echo "   - Adminer:   http://localhost:8080"
echo "   - Database:  localhost:15432"
echo ""
echo "📝 Useful commands:"
echo "   - View logs:    docker-compose logs -f"
echo "   - Stop:         docker-compose down"
echo "   - Restart:      docker-compose restart"
echo "   - Status:       docker-compose ps"
