# Docker Setup Guide

Docker usage guide for InvoiceDoc2

## Prerequisites

- Docker and Docker Compose installed
- Required ports: 3000 (client), 4000 (server), 15432 (database), 8080 (adminer)

## Quick Start

### Method 1: Using Shell Scripts (Recommended)

```bash
# Start services
./docker-start.sh

# Stop services
./docker-stop.sh

# View logs
./docker-logs.sh          # All services
./docker-logs.sh server    # Server only
./docker-logs.sh client    # Client only
./docker-logs.sh database  # Database only
```

### Method 2: Using npm scripts

```bash
# Start services
npm run docker:start

# Stop services
npm run docker:stop

# View logs
npm run docker:logs

# Check status
npm run docker:ps

# Restart services
npm run docker:restart
```

### Method 3: Using docker-compose directly

```bash
# Build and run all services
docker-compose up -d --build

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Services

### Client (Frontend)
- **URL**: http://localhost:3000
- **Port**: 3000
- **Container**: invoicedoc-client
- **Build**: Multi-stage build (Node.js build → serve)

### Server (Backend API)
- **URL**: http://localhost:4000
- **Port**: 4000
- **Container**: invoicedoc-server
- **Health Check**: http://localhost:4000/health

### Database (PostgreSQL)
- **Port**: 15432 (host) → 5432 (container)
- **Container**: invoicedoc-db
- **Credentials**:
  - User: root
  - Password: root
  - Database: invoices_db
- **Connection String**: `postgresql://root:root@localhost:15432/invoices_db`

### Adminer (Database Admin UI)
- **URL**: http://localhost:8080
- **Port**: 8080
- **Container**: invoicedoc-adminer
- **Login**:
  - System: PostgreSQL
  - Server: database
  - Username: root
  - Password: root
  - Database: invoices_db

## Development

### Build Specific Service

```bash
# Build client
docker-compose build client

# Build server
docker-compose build server
```

### Run Specific Service

```bash
# Run database only
docker-compose up -d database

# Run server only (requires database to be running)
docker-compose up -d server
```

### Rebuild After Code Changes

```bash
# Rebuild and restart
docker-compose up -d --build

# Or rebuild specific service
docker-compose up -d --build client
```

## Environment Variables

### Server (.env)
```env
PORT=4000
DATABASE_URL=postgresql://root:root@database:5432/invoices_db
```

### Client (.env)
```env
VITE_API_BASE=http://localhost:4000
```
(Configured at build time via docker-compose.yml)

## Troubleshooting

### Database Not Starting
```bash
# Check logs
docker-compose logs database

# Restart database
docker-compose restart database
```

### Server Cannot Connect to Database
- Verify that database service is running and healthy
- Check DATABASE_URL in server environment
- Check network connection: `docker network inspect invoicedoc2_invoicedoc-network`

### Client Not Displaying Data
- Verify that server is running: `curl http://localhost:4000/health`
- Check browser console for errors
- Check client logs: `docker-compose logs client`

### Port Already in Use
```bash
# Check which process is using the port
lsof -i :3000
lsof -i :4000
lsof -i :15432

# Modify port in docker-compose.yml
```

### Port Conflict with Existing Database Container
If you see "port is already allocated" error for port 15432:

```bash
# Stop existing database container
cd database && docker-compose down

# Or stop any container using port 15432
docker ps | grep 15432
docker stop <container_id>

# Then run the main docker-compose
cd /Users/jedsadapornpannok/github/InvoiceDoc2
docker-compose up -d
```

## Production Deployment

For production, you should:
1. Change passwords and credentials
2. Use environment variables from secrets management
3. Configure SSL/TLS certificates
4. Use reverse proxy (e.g., Traefik, Nginx) for production
5. Set up backups for database volumes
