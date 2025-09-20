import csv
import os
from typing import List, Dict, Any
from pathlib import Path


class CSVSearchService:
    def __init__(self):
        # Get the path to the CSV file relative to this module
        current_dir = Path(__file__).parent
        self.csv_file_path = current_dir.parent / "entidades_autorizadas.csv"
        self.ngos_data = self._load_csv_data()

    def _load_csv_data(self) -> List[Dict[str, str]]:
        """Load NGO data from CSV file"""
        ngos = []
        try:
            with open(self.csv_file_path, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                for row in reader:
                    ngos.append({
                        'name': row['NOME'].strip(),
                        'location': row['LOCALIDADE'].strip()
                    })
        except FileNotFoundError:
            print(f"CSV file not found at {self.csv_file_path}")
        except Exception as e:
            print(f"Error loading CSV file: {e}")
        
        return ngos

    def search_donation_locations(self, warehouse_address: str) -> List[Dict[str, Any]]:
        """
        Search for donation locations based on warehouse address.
        Splits warehouse address by comma and searches for matches in NGO locations.
        Returns all matches, prioritizing first string matches.
        """
        if not warehouse_address or not self.ngos_data:
            return []

        # Split warehouse address by comma and clean up
        address_parts = [part.strip() for part in warehouse_address.split(',') if part.strip()]
        
        if not address_parts:
            return []

        matches = []
        first_string_matches = []

        # Search for matches with the first string
        first_string = address_parts[0].lower()
        for ngo in self.ngos_data:
            ngo_location = ngo['location'].lower()
            ngo_name = ngo['name']
            
            # Check if first string matches the NGO location
            if first_string in ngo_location or ngo_location in first_string:
                first_string_matches.append({
                    'name': ngo_name,
                    'location': ngo['location'],
                    'match_type': 'first_string'
                })

        # If we found matches with the first string, return them
        if first_string_matches:
            return first_string_matches

        # If no matches with first string, try other strings
        for i, address_part in enumerate(address_parts[1:], 1):
            address_part_lower = address_part.lower()
            for ngo in self.ngos_data:
                ngo_location = ngo['location'].lower()
                ngo_name = ngo['name']
                
                # Check if this address part matches the NGO location
                if address_part_lower in ngo_location or ngo_location in address_part_lower:
                    matches.append({
                        'name': ngo_name,
                        'location': ngo['location'],
                        'match_type': f'string_{i+1}'
                    })

        return matches

    def get_all_ngos(self) -> List[Dict[str, str]]:
        """Get all NGOs from the CSV file"""
        return self.ngos_data

    def search_by_name(self, name_query: str) -> List[Dict[str, str]]:
        """Search NGOs by name"""
        if not name_query or not self.ngos_data:
            return []

        name_query_lower = name_query.lower()
        matches = []
        
        for ngo in self.ngos_data:
            ngo_name = ngo['name'].lower()
            if name_query_lower in ngo_name:
                matches.append(ngo)
        
        return matches

    def search_by_location(self, location_query: str) -> List[Dict[str, str]]:
        """Search NGOs by location"""
        if not location_query or not self.ngos_data:
            return []

        location_query_lower = location_query.lower()
        matches = []
        
        for ngo in self.ngos_data:
            ngo_location = ngo['location'].lower()
            if location_query_lower in ngo_location:
                matches.append(ngo)
        
        return matches
