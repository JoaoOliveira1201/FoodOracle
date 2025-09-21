## Tá gg pra nós

## Quick Start

To get the application running quickly:

```bash
make all    # Start core services (database, storage, backend, frontend)
```

## Available Commands

| Command | Description |
|---------|-------------|
| `make all` | Build and start all services |
| `make down` | Stop all running services |
| `make clean` | Stop services and remove volumes (WARNING: deletes data) |
| `make clear-cache` | Clear all Docker cache (images, build cache, containers) |
| `make logs` | Show logs for all services |
| `make backend` | Start only backend service |
| `make frontend` | Start only frontend service |
| `make database` | Start only database service |
| `make minio` | Start only minio service |
| `make db-populate` | Populate database with sample data |
| `make db-reset` | Reset database (drop and recreate) |
| `make compile-backend` | Compile backend Python code |

## Services & Access Points

### MinIO (Object Storage)
- **URL**: http://localhost:9001/
- **Username**: `minioadmin`
- **Password**: `minioadmin`

### PostgreSQL Database
- **Host**: `localhost` (or `127.0.0.1`)
- **Port**: `5432`
- **Database**: `supply_chain_db`
- **Username**: `supply_chain_user`
- **Password**: `supply_chain_password`

### API Backend
- **Documentation**: http://34.235.125.104:8000/docs
- **Base URL**: http://34.235.125.104:8000

### Frontend Application
- **Website**: http://localhost:3000

## Login credentials

| E-mail | Password |
|---------|-------------|
| `admin@test.com` | `1234` |
| `supplier@test.com` | `1234` |
| `buyer@test.com` | `1234` |
| `driver@test.com` | `1234` |
