import os

# Database Configuration (use .env)
DB_USER = os.getenv("DB_USER", "supply_chain_user")
DB_PASSWORD = os.getenv("DB_PASSWORD", "supply_chain_password")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "supply_chain_db")

# Default Clustering Parameters - Adjusted for better zone formation
DEFAULT_DBSCAN_EPS_METERS = 50000  # 50km radius for demand zones (increased from 15km)
DEFAULT_DBSCAN_MIN_SAMPLES = 3  # Minimum buyers to form a zone (reduced from 10)

# Default Forecasting Parameters
DEFAULT_FORECAST_DAYS = 30  # Days into the future to predict

# Default Optimization Parameters
DEFAULT_MAX_TRUCKS_TO_USE = (
    10  # Maximum trucks for optimization (can be overridden via API request)
)

# Analysis Configuration
MIN_DATA_POINTS_FOR_PROPHET = 10  # Minimum points to use Prophet

# Force Transfer Generation Configuration
FORCE_MINIMUM_TRANSFERS = True  # Always generate transfers even with no demand data
WAREHOUSE_IMBALANCE_THRESHOLD = 0.2  # 20% imbalance triggers transfers (1.2x and 0.8x average)
MINIMUM_TRANSFER_SUGGESTIONS = 1  # Minimum number of transfer suggestions to generate
FORCE_VRP_ON_ALL_TRANSFERS = True  # Always use VRP for all transfers

# Confidence Threshold Configuration
CONFIDENCE_THRESHOLD = 0.6  # Minimum confidence score for transfer suggestions (0.0 to 1.0)

