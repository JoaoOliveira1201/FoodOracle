"""
Database and file management utilities for Supply Chain Management System
Combines database operations and MinIO file management in one place
"""

import asyncpg
from pathlib import Path
from datetime import datetime
from minio import Minio
from typing import Dict, Any, List
from .config import DB_CONFIG, MINIO_CONFIG, SAMPLE_FILES
from .generate_quotes import generate_term_quote_pdf_topics
import tempfile
import os


class DatabaseManager:
    """Handles all database operations and entity tracking"""

    def __init__(self):
        self.conn = None
        self.user_ids = {}
        self.product_ids = {}
        self.warehouse_ids = {}
        self.truck_ids = {}

    async def connect(self):
        """Connect to PostgreSQL database"""
        print("Connecting to database...")
        self.conn = await asyncpg.connect(**DB_CONFIG)
        print("Database connected")

    async def disconnect(self):
        """Close database connection"""
        if self.conn:
            await self.conn.close()

    async def clear_database(self):
        """Clear all existing data from tables"""
        print("Clearing existing data...")
        tables = [
            "OrderItem",
            "WarehouseTransfer",
            "Trip",
            "Quote",
            "ProductRecord",
            "Product",
            "Warehouse",
            '"Order"',
            "Truck",
            '"User"',
        ]

        for table in tables:
            await self.conn.execute(f"DELETE FROM {table} CASCADE")
            clean_table = table.lower().replace('"', "")
            await self.conn.execute(
                f"ALTER SEQUENCE IF EXISTS {clean_table}_{clean_table}id_seq RESTART WITH 1"
            )
        print(" Database cleared")

    async def print_summary(self):
        """Print a summary of populated data"""
        print("\nPopulation Summary:")
        tables = [
            '"User"',
            "Product",
            "Warehouse",
            "Truck",
            "Quote",
            "ProductRecord",
            '"Order"',
            "OrderItem",
            "Trip",
            "WarehouseTransfer",
        ]

        for table in tables:
            count = await self.conn.fetchval(f"SELECT COUNT(*) FROM {table}")
            print(f"   {table}: {count} records")

    # Entity ID tracking methods
    def add_user_id(self, role: str, user_id: int):
        """Add user ID to tracking dictionary"""
        self.user_ids[role] = self.user_ids.get(role, [])
        self.user_ids[role].append(user_id)

    def add_product_id(self, name: str, product_id: int):
        """Add product ID to tracking dictionary"""
        self.product_ids[name] = product_id

    def add_warehouse_id(self, index: int, warehouse_id: int):
        """Add warehouse ID to tracking dictionary"""
        self.warehouse_ids[index] = warehouse_id

    def add_truck_id(self, index: int, truck_id: int):
        """Add truck ID to tracking dictionary"""
        self.truck_ids[index] = truck_id

    def get_user_ids(self, role: str) -> List[int]:
        """Get user IDs by role"""
        return self.user_ids.get(role, [])

    def get_product_ids(self) -> List[int]:
        """Get all product IDs"""
        return list(self.product_ids.values())

    def get_warehouse_ids(self) -> List[int]:
        """Get all warehouse IDs"""
        return list(self.warehouse_ids.values())

    def get_truck_ids(self) -> List[int]:
        """Get all truck IDs"""
        return list(self.truck_ids.values())


class FileManager:
    """Handles MinIO file operations for documents and images"""

    def __init__(self, db_connection=None):
        self.minio_client = None
        self.db_connection = db_connection

    def connect(self):
        """Connect to MinIO object storage"""
        print("Connecting to MinIO...")
        self.minio_client = Minio(
            **{
                k: v
                for k, v in MINIO_CONFIG.items()
                if k not in ["quotes_bucket", "product_records_bucket"]
            }
        )

        # Create buckets if they don't exist
        for bucket in [
            MINIO_CONFIG["quotes_bucket"],
            MINIO_CONFIG["product_records_bucket"],
        ]:
            if not self.minio_client.bucket_exists(bucket):
                self.minio_client.make_bucket(bucket)
        print(" MinIO connected and buckets ready")

    def upload_file(self, file_path: Path, bucket_name: str, object_name: str) -> str:
        """Upload file to MinIO and return the object name"""
        if file_path.exists():
            self.minio_client.fput_object(bucket_name, object_name, str(file_path))
            return object_name
        else:
            print(f"Warning: File {file_path} not found, skipping upload")
            return None

    async def upload_quote_pdf(
        self, quote_index: int, supplier_id: int, product_id: int
    ) -> str:
        """Generate and upload a custom PDF for a quote"""
        pdf_object_name = (
            f"quote_{quote_index + 1}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        )

        if self.db_connection:
            # Fetch supplier and product names from database
            supplier_name = await self.db_connection.fetchval(
                'SELECT name FROM "User" WHERE userid = $1', supplier_id
            )
            product_name = await self.db_connection.fetchval(
                "SELECT name FROM product WHERE productid = $1", product_id
            )

            # Use fallback PDF to avoid Windows file permission issues
            return self.upload_file(
                SAMPLE_FILES["random_pdf"],
                MINIO_CONFIG["quotes_bucket"],
                pdf_object_name,
            )
        else:
            # Fallback to default PDF if no database connection
            return self.upload_file(
                SAMPLE_FILES["random_pdf"],
                MINIO_CONFIG["quotes_bucket"],
                pdf_object_name,
            )

    def upload_product_record_image(self, record_index: int, quality: str) -> str:
        """Upload image for a product record based on quality"""
        if quality == "Bad":
            image_file = SAMPLE_FILES["bad_apple_jpg"]
            image_name = f"bad_apple_record_{record_index + 1}.jpg"
        else:
            image_file = SAMPLE_FILES["good_apple_jpg"]
            image_name = f"good_apple_record_{record_index + 1}.jpg"

        return self.upload_file(
            image_file, MINIO_CONFIG["product_records_bucket"], image_name
        )
