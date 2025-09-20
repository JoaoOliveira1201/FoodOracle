from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from datetime import datetime, timedelta
import re
import csv
import os

from src.product_record.product_record_repository import ProductRecordRepository
from src.product_record.product_record_entity import ProductRecordStatus
from src.warehouse.warehouse_repository import WarehouseRepository


class DonationService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.product_record_repo = ProductRecordRepository(session)
        self.warehouse_repo = WarehouseRepository(session)
        self._entidades_data = None

    def _load_entidades_csv(self) -> List[Dict[str, str]]:
        """
        Load the entidades_autorizadas.csv file and return a list of organizations.
        Returns a list of dicts with 'nome' and 'localidade' keys.
        """
        if self._entidades_data is not None:
            return self._entidades_data
        
        # Get the path to the CSV file
        current_dir = os.path.dirname(os.path.abspath(__file__))
        csv_path = os.path.join(current_dir, '..', 'entidades.csv')
        
        entidades = []
        try:
            with open(csv_path, 'r', encoding='utf-8') as file:
                # Skip the first 6 lines (headers and metadata)
                for _ in range(6):
                    next(file)
                
                csv_reader = csv.reader(file)
                for row in csv_reader:
                    if len(row) >= 3 and row[1] and row[2]:  # Ensure we have NOME and LOCALIDADE
                        entidades.append({
                            'nome': row[1].strip(),
                            'localidade': row[2].strip()
                        })
            
            self._entidades_data = entidades
            return entidades
            
        except Exception as e:
            print(f"Error loading entidades CSV: {e}")
            return []

    def _normalize_text(self, text: str) -> str:
        """
        Normalize text for case-insensitive and accent-insensitive matching.
        Converts to lowercase and removes accents.
        """
        import unicodedata
        
        # Convert to lowercase
        text = text.lower()
        
        # Remove accents by decomposing and filtering out combining characters
        text = unicodedata.normalize('NFD', text)
        text = ''.join(char for char in text if unicodedata.category(char) != 'Mn')
        
        return text

    def _find_matching_organizations(self, warehouse_address: str) -> List[Dict[str, str]]:
        """
        Find organizations that match the warehouse location by splitting the address
        and searching for matches in the CSV data.
        """
        if not warehouse_address:
            return []
        
        # Split warehouse address by comma to get location parts
        location_parts = [part.strip() for part in warehouse_address.split(',')]
        
        if not location_parts:
            return []
        
        entidades = self._load_entidades_csv()
        matches = []
        
        # Search for matches with each location part
        for part in location_parts:
            if not part:
                continue
                
            # Normalize the search part
            part_normalized = self._normalize_text(part)
            
            # Search for matches in the localidade column
            for entidade in entidades:
                localidade_normalized = self._normalize_text(entidade['localidade'])
                
                # Check if the location part is contained in the localidade
                if part_normalized in localidade_normalized:
                    matches.append(entidade)
            
            # If we found matches with the first part, don't test the second part
            if matches:
                break
        
        return matches

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
        Get donation location suggestions for a specific warehouse location using CSV matching.
        """
        try:
            if not warehouse_address:
                return [{"name": "Local Food Banks and Charities"}]
            
            # Find matching organizations using string matching
            matches = self._find_matching_organizations(warehouse_address)
            
            if not matches:
                return [{"name": "Local Food Banks and Charities"}]
            
            # Convert matches to the expected format
            donation_locations = []
            for match in matches:
                donation_locations.append({
                    "name": match['nome'],
                    "location": match['localidade']
                })
            
            return donation_locations

        except Exception as e:
            # Return a fallback response if matching fails
            return [{"name": "Local Food Banks and Charities"}]

