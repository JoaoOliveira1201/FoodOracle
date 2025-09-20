"""
Sample data and constants for Supply Chain Management System database population
All sample data, constants, and data generation utilities in one place
"""

import json
import random
import os
from typing import List, Dict, Tuple, Optional

# ===============================
# GEOGRAPHICAL DATA
# ===============================

# Portuguese geographical boundaries for random user locations
PORTUGAL_BOUNDS = {
    "min_longitude": -9.5,  # Westernmost point
    "max_longitude": -6.0,  # Easternmost point
    "min_latitude": 36.9,  # Southernmost point
    "max_latitude": 42.2,  # Northernmost point
}

# Portuguese cities for warehouse/truck locations
PORTUGUESE_CITIES = [
    ("Aveiro", (-8.6538, 40.6443)),
    ("Beja", (-7.8650, 38.0151)),
    ("Braga", (-8.4272, 41.5454)),
    ("Braganca", (-6.7547, 41.8058)),
    ("Castelo Branco", (-7.4909, 39.8222)),
    ("Coimbra", (-8.4195, 40.2033)),
    ("Evora", (-7.9079, 38.5714)),
    ("Faro", (-7.9304, 37.0194)),
    ("Guarda", (-7.2681, 40.5373)),
    ("Leiria", (-8.8071, 39.7436)),
    ("Lisboa", (-9.1393, 38.7223)),
    ("Portalegre", (-7.4309, 39.2938)),
    ("Porto", (-8.6291, 41.1579)),
    ("Santarem", (-8.6833, 39.2333)),
    ("Setubal", (-8.8927, 38.5244)),
    ("Viana do Castelo", (-8.8329, 41.6932)),
    ("Vila Real", (-7.7441, 41.3006)),
    ("Viseu", (-7.9138, 40.6575)),
]


# ===============================
# PRE-GENERATED LOCATIONS MANAGEMENT
# ===============================

# Global variables to store loaded locations
_loaded_locations: Optional[Dict] = None
_user_locations: List[Dict] = []
_city_locations: List[Dict] = []


def load_locations_from_json(json_file_path: str = "generated_locations.json") -> bool:
    """
    Load pre-generated locations from JSON file

    Args:
        json_file_path: Path to the generated locations JSON file

    Returns:
        True if locations loaded successfully, False otherwise
    """
    global _loaded_locations, _user_locations, _city_locations

    try:
        # Check if file exists
        if not os.path.exists(json_file_path):
            print(f" Locations file not found: {json_file_path}")
            return False

        # Load JSON data
        with open(json_file_path, "r", encoding="utf-8") as f:
            _loaded_locations = json.load(f)

        # Extract location arrays
        _user_locations = _loaded_locations.get("user_locations", [])
        _city_locations = _loaded_locations.get("city_locations", [])

        # Validate data
        if not _user_locations or not _city_locations:
            print(f" Invalid locations data in {json_file_path}")
            return False

        metadata = _loaded_locations.get("metadata", {})
        print(
            f" Loaded {len(_user_locations)} user locations and {len(_city_locations)} city locations"
        )
        print(f" Success rate: {metadata.get('success_rate', 'unknown')}")

        return True

    except Exception as e:
        print(f" Error loading locations from {json_file_path}: {e}")
        return False


def get_random_user_location() -> Tuple[float, float, str]:
    """
    Get random user location from pre-generated data

    Returns:
        Tuple of (longitude, latitude, address)
        Falls back to random generation if no data loaded
    """
    global _user_locations

    if _user_locations:
        location = random.choice(_user_locations)
        return (location["longitude"], location["latitude"], location["address"])
    else:
        # Fallback to original random generation
        print(" No pre-generated user locations available, using fallback generation")
        return random_portugal_location_fallback()


def get_random_city_location() -> Tuple[float, float, str]:
    """
    Get random city location from pre-generated data

    Returns:
        Tuple of (longitude, latitude, address)
        Falls back to random generation if no data loaded
    """
    global _city_locations

    if _city_locations:
        location = random.choice(_city_locations)
        return (location["longitude"], location["latitude"], location["address"])
    else:
        # Fallback to original random generation
        print(" No pre-generated city locations available, using fallback generation")
        return random_city_location_fallback()


def get_locations_metadata() -> Dict:
    """Get metadata about loaded locations"""
    global _loaded_locations
    return _loaded_locations.get("metadata", {}) if _loaded_locations else {}


# ===============================
# FALLBACK LOCATION FUNCTIONS (Original Logic)
# ===============================


def random_portugal_location_fallback() -> Tuple[float, float, str]:
    """Generate random coordinates within Portugal's boundaries for users (fallback)"""
    # Use a hybrid approach: 70% of the time use bounded random coordinates,
    # 30% of the time use coordinates near existing Portuguese cities
    if random.random() < 0.7:
        longitude = random.uniform(
            PORTUGAL_BOUNDS["min_longitude"], PORTUGAL_BOUNDS["max_longitude"]
        )
        latitude = random.uniform(
            PORTUGAL_BOUNDS["min_latitude"], PORTUGAL_BOUNDS["max_latitude"]
        )
        return (longitude, latitude, "Fallback Location, Portugal")
    else:
        # Pick a random city and add small random offset to ensure variety
        base_city_coords = random.choice(PORTUGUESE_CITIES)[1]
        # Add small random offset (max ~20km in any direction)
        longitude_offset = random.uniform(-0.2, 0.2)
        latitude_offset = random.uniform(-0.15, 0.15)

        return (
            base_city_coords[0] + longitude_offset,
            base_city_coords[1] + latitude_offset,
            "Fallback Location, Portugal",
        )


def random_city_location_fallback() -> Tuple[float, float, str]:
    """Get random coordinates from Portuguese cities for warehouses/trucks (fallback)"""
    city_name, coords = random.choice(PORTUGUESE_CITIES)
    return (coords[0], coords[1], f"Fallback Location, {city_name}, Portugal")


# Legacy functions for backward compatibility
def random_portugal_location():
    """Legacy function - returns only coordinates for backward compatibility"""
    longitude, latitude, _ = get_random_user_location()
    return (longitude, latitude)


def random_city_location():
    """Legacy function - returns only coordinates for backward compatibility"""
    longitude, latitude, _ = get_random_city_location()
    return (longitude, latitude)


# ===============================
# SAMPLE USERS
# ===============================


def get_sample_users():
    """
    Generate sample users with pre-generated locations
    This function is called after locations are loaded to ensure we have addresses
    """
    return [
        # Test Users
        {
            "name": "Test Admin",
            "contact": "admin@test.com",
            "location": get_random_user_location(),
            "password": "1234",
            "role": "Administrator",
        },
        {
            "name": "Test Supplier",
            "contact": "supplier@test.com",
            "location": get_random_user_location(),
            "password": "1234",
            "role": "Supplier",
        },
        {
            "name": "Test Buyer",
            "contact": "buyer@test.com",
            "location": get_random_user_location(),
            "password": "1234",
            "role": "Buyer",
        },
        {
            "name": "Test Driver",
            "contact": "driver@test.com",
            "location": get_random_user_location(),
            "password": "1234",
            "role": "TruckDriver",
        },
        # Administrators
        {
            "name": "Admin Smith",
            "contact": "admin@supply.com",
            "location": get_random_user_location(),
            "password": "admin123",
            "role": "Administrator",
        },
        # Suppliers
        {
            "name": "Green Valley Farms",
            "contact": "info@greenvalley.com",
            "location": get_random_user_location(),
            "password": "supplier123",
            "role": "Supplier",
        },
        {
            "name": "Organic Harvest Co",
            "contact": "contact@organicharv.com",
            "location": get_random_user_location(),
            "password": "supplier456",
            "role": "Supplier",
        },
        {
            "name": "Fresh Fields Ltd",
            "contact": "hello@freshfields.com",
            "location": get_random_user_location(),
            "password": "supplier789",
            "role": "Supplier",
        },
        # Buyers
        {
            "name": "City Market Chain",
            "contact": "procurement@citymarket.com",
            "location": get_random_user_location(),
            "password": "buyer123",
            "role": "Buyer",
        },
        {
            "name": "Healthy Foods Inc",
            "contact": "orders@healthyfoods.com",
            "location": get_random_user_location(),
            "password": "buyer456",
            "role": "Buyer",
        },
        {
            "name": "Metro Grocery",
            "contact": "supply@metrogrocery.com",
            "location": get_random_user_location(),
            "password": "buyer789",
            "role": "Buyer",
        },
        # Truck Drivers
        {
            "name": "Mike Johnson",
            "contact": "mike.j@transport.com",
            "location": get_random_user_location(),
            "password": "driver123",
            "role": "TruckDriver",
        },
        {
            "name": "Sarah Wilson",
            "contact": "sarah.w@transport.com",
            "location": get_random_user_location(),
            "password": "driver456",
            "role": "TruckDriver",
        },
        {
            "name": "Robert Davis",
            "contact": "rob.d@transport.com",
            "location": get_random_user_location(),
            "password": "driver789",
            "role": "TruckDriver",
        },
    ]


# For backward compatibility - will be populated by populate script
SAMPLE_USERS = []

# ===============================
# SAMPLE TRUCKS
# ===============================

SAMPLE_TRUCKS = [
    {"type": "Refrigerated", "load_capacity": 12000, "status": "Available"},
    {"type": "Refrigerated", "load_capacity": 18000, "status": "InService"},
    {"type": "Normal", "load_capacity": 26000, "status": "Available"},
    {"type": "Normal", "load_capacity": 40000, "status": "Available"},
    {"type": "Refrigerated", "load_capacity": 7500, "status": "InService"},
    {"type": "Normal", "load_capacity": 12000, "status": "Available"},
]

# ===============================
# PRODUCT DATA
# ===============================
PRODUCE_ITEMS = [
    "Bananas", "Strawberries", "Blueberries", "Broccoli", "Cucumbers",
    "Spinach", "Kale", "Avocados", "Mangoes", "Oranges",
    "Pears", "Grapes", "Onions", "Garlic", "Zucchini",
    "Eggplants", "Asparagus", "Cauliflower", "Lemons", "Limes",
    "Apples", "Cherries", "Pineapples", "Watermelons", "Cantaloupes",
    "Honeydew", "Papayas", "Passionfruit", "Raspberries", "Blackberries",
    "Cranberries", "Peaches", "Nectarines", "Plums", "Apricots",
    "Pomegranates", "Kiwi", "Dragonfruit", "Lychee", "Coconuts",
    "Guavas", "Tangerines", "Mandarins", "Clementines", "Starfruit",
    "Figs", "Dates", "Persimmons", "Gooseberries", "Mulberries",
    "Jackfruit", "Durian", "Cherimoya", "Breadfruit", "Carrots",
    "Potatoes", "Yams", "Beets", "Turnips", "Radishes",
    "Rutabagas", "Parsnips", "Celery", "Lettuce", "Arugula",
    "Collards", "Mustard", "Chard", "Cabbage", "Brussels",
    "Artichokes", "Okra", "Beans", "Peas", "Peppers",
    "Jalapenos", "Habaneros", "Serranos", "Poblanos", "Corn",
    "Mushrooms", "Portobello", "Shiitake", "Oyster", "Pumpkins",
    "Butternut", "Acorn", "Spaghetti", "Delicata", "Ginger",
    "Turmeric", "Basil", "Cilantro", "Parsley", "Dill",
    "Mint", "Rosemary", "Thyme", "Sage", "Chives",
    "Leeks", "Shallots", "Kohlrabi", "Endive", "Radicchio",
    "Cress", "Fennel", "Tatsoi", "Mizuna", "Sorrel"
]



WAREHOUSE_TYPES = [
    "Distribution Center",
    "Central Warehouse",
    "Regional DC",
    "Cold Storage",
    "Logistics Hub",
]

# ===============================
# STATUS AND CLASSIFICATION OPTIONS
# ===============================

QUALITY_OPTIONS = ["Good", "Sub-optimal", "Bad"]

STATUS_OPTIONS = {
    "product_record": ["InStock", "Sold", "Discarded", "Donated"],
    "order": ["Pending", "Confirmed", "InTransit", "Completed", "Cancelled"],
    "quote": ["Pending", "Approved", "Rejected"],
    "trip": ["Waiting", "Collecting", "Loaded", "Paused", "Delivering", "Delivered"],
    "warehouse_transfer": ["Pending", "InTransit", "Completed", "Cancelled"],
}

TRANSFER_REASONS = ["Restock", "Redistribution", "Emergency", "Optimization"]

SAMPLE_TRANSFER_NOTES = [
    "Urgent restocking needed for high-demand items",
    "Balancing inventory across locations",
    "Emergency transfer due to equipment failure",
    "Optimizing storage efficiency",
    "Seasonal demand adjustment",
    "Quality control relocation",
    "Customer proximity optimization",
    "Capacity management transfer",
    None,  # Some transfers might not have notes
    None,
]
