from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from datetime import datetime, timedelta
import re

from src.product_record.product_record_repository import ProductRecordRepository
from src.product_record.product_record_entity import ProductRecordStatus
from src.warehouse.warehouse_repository import WarehouseRepository
from .bedrock import find_donation_locations


class DonationService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.product_record_repo = ProductRecordRepository(session)
        self.warehouse_repo = WarehouseRepository(session)

    async def get_products_expiring_soon(self, days: int = 3) -> List[Dict[str, Any]]:
        """
        Get products that will expire in the next specified days.
        Expiration is calculated as registration_date + shelf_life_days.
        """
        try:
            # Calculate the cutoff date
            cutoff_date = datetime.utcnow() + timedelta(days=days)

            # Query to get expiring products with warehouse and product details
            query = text("""
                SELECT 
                    pr.recordid,
                    pr.productid,
                    pr.quantitykg,
                    pr.registrationdate,
                    p.name as product_name,
                    p.shelflifedays,
                    w.warehouseid,
                    w.name as warehouse_name,
                    w.address as warehouse_address,
                    ST_X(w.location::geometry) as warehouse_longitude,
                    ST_Y(w.location::geometry) as warehouse_latitude,
                    (pr.registrationdate + INTERVAL '1 day' * p.shelflifedays) as expiration_date
                FROM productrecord pr
                JOIN product p ON pr.productid = p.productid
                JOIN warehouse w ON pr.warehouseid = w.warehouseid
                WHERE pr.status = :status
                AND p.shelflifedays IS NOT NULL
                AND pr.registrationdate IS NOT NULL
                AND (pr.registrationdate + INTERVAL '1 day' * p.shelflifedays) <= :cutoff_date
                AND (pr.registrationdate + INTERVAL '1 day' * p.shelflifedays) >= :current_date
                ORDER BY pr.quantitykg DESC
            """)

            result = await self.session.execute(
                query,
                {
                    "status": ProductRecordStatus.IN_STOCK.value,
                    "cutoff_date": cutoff_date,
                    "current_date": datetime.utcnow(),
                },
            )

            rows = result.all()

            expiring_products = []
            for row in rows:
                # Calculate days until expiration
                expiration_date = row.expiration_date
                days_until_expiration = (expiration_date - datetime.utcnow()).days

                expiring_products.append(
                    {
                        "record_id": row.recordid,
                        "product_id": row.productid,
                        "product_name": row.product_name,
                        "quantity_kg": row.quantitykg or 0,
                        "registration_date": row.registrationdate.isoformat()
                        if row.registrationdate
                        else None,
                        "shelf_life_days": row.shelflifedays,
                        "warehouse_id": row.warehouseid,
                        "warehouse_name": row.warehouse_name,
                        "warehouse_address": row.warehouse_address,
                        "warehouse_location": {
                            "latitude": float(row.warehouse_latitude),
                            "longitude": float(row.warehouse_longitude),
                        },
                        "expiration_date": expiration_date.isoformat(),
                        "days_until_expiration": max(0, days_until_expiration),
                    }
                )

            return expiring_products

        except Exception as e:
            raise Exception(f"Failed to get expiring products: {str(e)}")

    async def get_donation_suggestions_for_location(
        self, warehouse_location: Dict[str, float], warehouse_address: str = None
    ) -> List[Dict[str, Any]]:
        """
        Get donation location suggestions for a specific warehouse location using AI.
        """
        try:
            # Prepare location data for AI query
            location_data = {
                "latitude": warehouse_location["latitude"],
                "longitude": warehouse_location["longitude"],
                "address": warehouse_address
                or f"Coordinates: {warehouse_location['latitude']}, {warehouse_location['longitude']}",
            }

            # Get AI suggestions
            ai_response = find_donation_locations(location_data)

            # Parse the AI response to extract structured donation locations
            donation_locations = self._parse_donation_locations(ai_response)

            return donation_locations

        except Exception as e:
            # Return a fallback response if AI fails
            return [{"name": "Local Food Bank"}]

    def _parse_donation_locations(self, ai_response: str) -> List[Dict[str, Any]]:
        """
        Parse the AI response to extract organization names.
        Returns only organization names without placeholder text.
        """
        locations = []

        try:
            # Split response by lines and look for organization names
            lines = ai_response.split("\n")

            # Skip common introductory phrases and descriptive text
            skip_phrases = [
                "here are some charitable organizations",
                "here are some organizations",
                "charitable organizations near",
                "organizations near",
                "that might accept food donations",
                "that accept food donations",
                "food donations",
                "donation locations",
                "suggested locations",
                "nearby organizations",
                "local organizations",
                "organizations in the area",
                "in the area",
                "near this warehouse",
                "near this location",
            ]

            for line in lines:
                line = line.strip()
                # Skip empty lines and very short lines
                if len(line) < 3:
                    continue

                # Remove common prefixes like numbers, bullets, dashes
                clean_name = re.sub(r"^[\d\.\-\*\s]+", "", line).strip()

                # Skip if it's still too short
                if len(clean_name) < 3:
                    continue

                # Skip lines that contain introductory phrases
                line_lower = clean_name.lower()
                if any(phrase in line_lower for phrase in skip_phrases):
                    continue

                # Skip if it looks like a header or common words
                if line_lower in [
                    "organization",
                    "name",
                    "list",
                    "donation",
                    "locations",
                    "suggestions",
                    "options",
                ]:
                    continue

                # Skip lines that are too long (likely descriptive text)
                if len(clean_name) > 100:
                    continue

                # Create simple location entry with just the name
                location = {"name": clean_name}

                locations.append(location)

                # Limit to 5 locations to keep response manageable
                if len(locations) >= 5:
                    break

            # If no organizations found, provide a generic response
            if not locations:
                locations = [{"name": "Local Food Banks and Charities"}]

        except Exception as e:
            # Fallback if parsing completely fails
            locations = [{"name": "Local Charitable Organizations"}]

        return locations
