#!/usr/bin/env python3

import os
import sys
import psycopg2
from datetime import datetime
from pathlib import Path


def main():
    """Main function to expire old products using direct database connection"""
    print(f"[{datetime.now()}] Starting product expiration process")

    # Database connection parameters
    db_config = {
        "host": "localhost",
        "port": "5432",
        "database": "supply_chain_db",
        "user": "supply_chain_user",
        "password": "supply_chain_password",
    }

    try:
        # Connect to database
        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor()

        # Call the PostgreSQL function to expire old products
        cursor.execute("SELECT expire_old_products();")
        result = cursor.fetchone()
        expired_count = result[0] if result else 0

        # Commit the transaction
        conn.commit()

        print(f"[{datetime.now()}] Successfully expired {expired_count} products")

        # Close connections
        cursor.close()
        conn.close()

    except Exception as e:
        print(f"[{datetime.now()}] ERROR: {str(e)}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
