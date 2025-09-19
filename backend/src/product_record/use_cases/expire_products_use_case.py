"""
Use case for expiring old products based on shelf life.
This can be called periodically to check for and expire old products.
"""

from typing import Optional
import psycopg2
from src.database.settings import database_settings
from logger import logger


class ExpireProductsUseCase:
    """Use case for automatically expiring products that have exceeded their shelf life."""

    def __init__(self):
        self.db_config = {
            "host": database_settings.DB_HOST,
            "port": database_settings.DB_PORT,
            "database": database_settings.DB_NAME,
            "user": database_settings.DB_USER,
            "password": database_settings.DB_PASSWORD,
        }

    def execute(self) -> dict:
        """
        Execute the product expiration process.

        Returns:
            dict: Result containing number of products expired and success status
        """
        try:
            # Connect to database using psycopg2
            conn = psycopg2.connect(**self.db_config)
            cursor = conn.cursor()

            # Call the PostgreSQL function that expires old products
            cursor.execute("SELECT expire_old_products();")
            result = cursor.fetchone()
            expired_count = result[0] if result else 0

            # Commit the transaction
            conn.commit()

            # Close connections
            cursor.close()
            conn.close()

            logger.info(f"Successfully expired {expired_count} products")

            return {
                "success": True,
                "expired_count": expired_count,
                "message": f"Successfully expired {expired_count} products",
            }

        except Exception as e:
            logger.error(f"Error expiring products: {str(e)}")
            return {
                "success": False,
                "expired_count": 0,
                "message": f"Error expiring products: {str(e)}",
            }

    def get_products_near_expiration(self, days_threshold: int = 3) -> list:
        """
        Get products that are near expiration within the specified threshold.

        Args:
            days_threshold: Number of days before expiration to consider "near expiration"

        Returns:
            list: List of product records near expiration
        """
        try:
            conn = psycopg2.connect(**self.db_config)
            cursor = conn.cursor()

            query = """
            SELECT 
                pr.RecordID,
                pr.ProductID,
                p.Name as ProductName,
                pr.QuantityKg,
                pr.WarehouseID,
                pr.RegistrationDate,
                p.ShelfLifeDays,
                (pr.RegistrationDate + (p.ShelfLifeDays || ' days')::INTERVAL) as ExpirationDate,
                EXTRACT(DAYS FROM (pr.RegistrationDate + (p.ShelfLifeDays || ' days')::INTERVAL) - CURRENT_TIMESTAMP) as DaysUntilExpiration
            FROM ProductRecord pr
            JOIN Product p ON pr.ProductID = p.ProductID
            WHERE pr.Status != 'Discarded'
              AND pr.RegistrationDate IS NOT NULL
              AND p.ShelfLifeDays IS NOT NULL
              AND (pr.RegistrationDate + (p.ShelfLifeDays || ' days')::INTERVAL) > CURRENT_TIMESTAMP
              AND (pr.RegistrationDate + (p.ShelfLifeDays || ' days')::INTERVAL) <= CURRENT_TIMESTAMP + INTERVAL '%s days'
            ORDER BY ExpirationDate ASC;
            """

            cursor.execute(query, (days_threshold,))
            results = cursor.fetchall()

            # Convert results to list of dictionaries
            columns = [desc[0] for desc in cursor.description]
            products_near_expiration = []

            for row in results:
                product_dict = dict(zip(columns, row))
                products_near_expiration.append(product_dict)

            # Close connections
            cursor.close()
            conn.close()

            logger.info(
                f"Found {len(products_near_expiration)} products near expiration"
            )
            return products_near_expiration

        except Exception as e:
            logger.error(f"Error getting products near expiration: {str(e)}")
            return []
