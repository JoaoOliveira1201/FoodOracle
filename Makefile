
# Default target
.PHONY: help all full-reset down clean clear-cache logs backend frontend database minio db-populate db-reset compile-backend

help:
	@echo "Available commands:"
	@echo "  make all              - Build and start all services"
	@echo "  make full-reset       - Clean, build and start all services with sample data"
	@echo "  make down             - Stop all running services"
	@echo "  make clean            - Stop services and remove volumes"
	@echo "  make clear-cache      - Clear all Docker cache (images, build cache, containers)"
	@echo "  make logs             - Show logs for all services"
	@echo "  make backend          - Start only backend service"
	@echo "  make frontend         - Start only frontend service"
	@echo "  make database         - Start only database service"
	@echo "  make minio            - Start only minio service"
	@echo "  make db-populate      - Populate database with sample data"
	@echo "  make db-reset         - Reset database (drop and recreate)"
	@echo "  make compile-backend  - Compile backend Python code"

# Build and start all services
all:
	@echo "Starting all services..."
	docker compose up --build -d

# Clean, build and start all services with sample data
full-reset:
	@echo "Starting fresh development environment..."
	docker compose down -v --remove-orphans
	docker system prune -a -f --volumes
	docker compose up --build -d
	@echo "Populating database with sample data..."
	@cd db/populate_db && rm -rf venv && python3 -m venv venv && venv/bin/python -m pip install --upgrade pip && venv/bin/python -m pip install -r requirements.txt && printf "y\n" | venv/bin/python main.py && rm -rf venv
	@echo "Development environment ready!"

# Stop all services
down:
	@echo "Stopping all services..."
	docker compose down

# Stop services and remove volumes
clean:
	@echo "Cleaning all services and volumes..."
	docker compose down -v --remove-orphans
	docker system prune -f

# Clear all Docker cache (images, build cache, containers)
clear-cache:
	@echo "Clearing Docker cache..."
	docker system prune -a -f --volumes
	docker builder prune -a -f
	@echo "Docker cache cleared successfully!"

# Show logs for all services
logs:
	docker compose logs -f

# Individual Services
backend:
	@echo "Starting backend service..."
	docker compose up --build -d backend

frontend:
	@echo "Starting frontend service..."
	docker compose up --build -d frontend

database:
	@echo "Starting database service..."
	docker compose up --build -d database

minio:
	@echo "Starting minio service..."
	docker compose up --build -d minio

db-populate:
	@echo "Populating database with sample data..."
	@cd db/populate_db && rm -rf venv && python3 -m venv venv
	@cd db/populate_db && venv/bin/python -m pip install --upgrade pip
	@cd db/populate_db && venv/bin/python -m pip install -r requirements.txt
	@cd db/populate_db && printf "y\n" | venv/bin/python main.py
	@cd db/populate_db && rm -rf venv
	@echo "Database populated with sample data"
	

db-reset:
	@echo "Resetting database..."
	docker compose down database
	docker volume rm cenaDaSupplyChain_postgres_data || true
	docker compose up --build -d database
	@echo "Database reset complete"

# Compile backend
compile-backend:
	@echo "Compiling backend..."
	python3 -m compileall -q -b backend -x ".venv|venv|__pycache__"
	@echo "Finished compile"
