#!/usr/bin/env python3
"""
Main database population script for Supply Chain Management System

This script populates the database with sample data including:
- Users (Administrators, Suppliers, Buyers, Truck Drivers)
- Products with pricing and shelf life information
- Warehouses with location and capacity data
- Trucks with driver assignments and locations
- Quotes with PDF documents (ensures Test Supplier has approved quotes for at least 3 products)
- Product records with quality images
- Orders, trips, and warehouse transfers

Configuration:
- Database and MinIO credentials are loaded from root .env file
- Uses existing environment variables from project root
- Population counts are hardcoded for consistency
"""

import asyncio
from src.database import DatabaseManager, FileManager
from src.populate import populate_all_entities


async def main():
    """Main function to run the population script"""
    print("Supply Chain Database Population")
    print("=" * 40)
    print("Starting database population...")
    print("=" * 40)

    # Initialize managers
    db_manager = DatabaseManager()

    try:
        # Connect to services
        await db_manager.connect()

        # Initialize file manager with database connection for custom PDF generation
        file_manager = FileManager(db_manager.conn)
        file_manager.connect()

        # Clear existing data
        await db_manager.clear_database()

        # Populate all entities in correct order
        await populate_all_entities(db_manager, file_manager)

        print("=" * 40)
        print("Database population completed successfully!")

        # Print summary
        await db_manager.print_summary()

    except Exception as e:
        print(f"Error during population: {e}")
        raise
    finally:
        await db_manager.disconnect()


if __name__ == "__main__":
    print("Supply Chain Database Population Script")
    print("======================================")
    print("This script will populate the database with sample data.")
    print("Configuration:")
    print("- Uses database/MinIO settings from root .env file")
    print("- Make sure Docker services are running (docker compose up -d)")
    print()

    asyncio.run(main())
