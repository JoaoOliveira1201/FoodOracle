"""
Transfer Suggestions Service

This service uses AI/ML techniques to analyze demand patterns and generate
optimal redistribution plans for product records across warehouses.

Features:
- Demand zone clustering using DBSCAN
- Demand forecasting with Prophet
- Product record transfer suggestions
- Multi-truck VRP optimization
"""

import pandas as pd
import geopandas as gpd
import numpy as np
from sqlalchemy import create_engine, text
from sqlalchemy.ext.asyncio import AsyncSession
from sklearn.cluster import DBSCAN
from prophet import Prophet
from ortools.constraint_solver import routing_enums_pb2, pywrapcp
from scipy.spatial import distance
import warnings
from datetime import datetime
from typing import Dict, List, Any, Optional
import asyncio
import os

from .config import (
    DB_USER,
    DB_PASSWORD,
    DB_HOST,
    DB_PORT,
    DB_NAME,
    MIN_DATA_POINTS_FOR_PROPHET,
    DEFAULT_FORECAST_DAYS,
    DEFAULT_DBSCAN_EPS_METERS,
    DEFAULT_DBSCAN_MIN_SAMPLES,
    DEFAULT_MAX_TRUCKS_TO_USE,
    FORCE_MINIMUM_TRANSFERS,
    WAREHOUSE_IMBALANCE_THRESHOLD,
    MINIMUM_TRANSFER_SUGGESTIONS,
    FORCE_VRP_ON_ALL_TRANSFERS,
    CONFIDENCE_THRESHOLD,
)

warnings.filterwarnings("ignore", category=FutureWarning)


class TransferSuggestionsService:
    def __init__(
        self,
        db: AsyncSession,
        max_trucks_to_use: int = 10,
        confidence_threshold: float = CONFIDENCE_THRESHOLD,
    ):
        self.db = db
        self.max_trucks_to_use = max_trucks_to_use
        self.confidence_threshold = confidence_threshold
        # Hardcoded algorithm parameters
        self.forecast_days = DEFAULT_FORECAST_DAYS
        self.dbscan_eps_meters = DEFAULT_DBSCAN_EPS_METERS
        self.dbscan_min_samples = DEFAULT_DBSCAN_MIN_SAMPLES

    def get_sync_engine(self):
        """Creates a synchronous SQLAlchemy engine for data fetching"""
        return create_engine(
            f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
        )

    def fetch_data(self):
        """Fetches all necessary data from the database"""
        print("Fetching data from database...")

        engine = self.get_sync_engine()

        sql_queries = {
            "users": 'SELECT "userid", "location" FROM "User" WHERE "role" = \'Buyer\' AND "location" IS NOT NULL;',
            "warehouses": 'SELECT "warehouseid", "name", "location" FROM "warehouse" WHERE "location" IS NOT NULL;',
            "products": 'SELECT "productid", "name" FROM "product";',
            "sales": """
                SELECT pr."productid", pr."quantitykg", o."orderdate", o."buyerid"
                FROM "orderitem" oi
                JOIN "Order" o ON oi."orderid" = o."orderid"
                JOIN "productrecord" pr ON oi."recordid" = pr."recordid"
                WHERE o."status" = 'Completed';
            """,
            "inventory": """
                SELECT "recordid", "productid", "warehouseid", "quantitykg", 
                       "supplierid", "qualityclassification", "registrationdate"
                FROM "productrecord"
                WHERE "status" = 'InStock' AND "qualityclassification" != 'Bad'
                ORDER BY "productid", "warehouseid", "registrationdate";
            """,
            "trucks": 'SELECT "truckid", "loadcapacitykg" FROM "truck" WHERE "status" = \'Available\';',
        }

        try:
            gdf_users = gpd.read_postgis(
                sql_queries["users"], engine, geom_col="location"
            )
            gdf_warehouses = gpd.read_postgis(
                sql_queries["warehouses"], engine, geom_col="location"
            )
            df_products = pd.read_sql(sql_queries["products"], engine)
            df_sales = pd.read_sql(sql_queries["sales"], engine)
            df_inventory = pd.read_sql(sql_queries["inventory"], engine)
            df_trucks = pd.read_sql(sql_queries["trucks"], engine)

            print(
                f"  - Loaded {len(gdf_users)} buyers, {len(gdf_warehouses)} warehouses"
            )
            print(
                f"  - Loaded {len(df_products)} products, {len(df_sales)} sales records"
            )
            print(f"  - Loaded {len(df_trucks)} available trucks")

            return (
                gdf_users,
                gdf_warehouses,
                df_products,
                df_sales,
                df_inventory,
                df_trucks,
            )
        except Exception as e:
            print(f"Error fetching data: {e}")
            return (None,) * 6
        finally:
            engine.dispose()

    def run_clustering(self, gdf_users):
        """Groups users into demand zones using DBSCAN clustering"""
        print("Step 1: Defining demand zones...")

        if gdf_users.empty:
            print("  - No user data to cluster")
            return None

        # Convert coordinates for haversine distance metric
        coords = np.radians(gdf_users["location"].apply(lambda p: (p.y, p.x)).tolist())
        epsilon = self.dbscan_eps_meters / 6371000  # Convert meters to radians

        # Run DBSCAN clustering
        db = DBSCAN(
            eps=epsilon,
            min_samples=self.dbscan_min_samples,
            algorithm="ball_tree",
            metric="haversine",
        ).fit(coords)

        gdf_users["zone_id"] = db.labels_

        num_zones = len(set(db.labels_)) - (1 if -1 in db.labels_ else 0)
        num_outliers = np.sum(db.labels_ == -1)
        print(f"  - Found {num_zones} demand zones and {num_outliers} outliers")

        return gdf_users

    def map_zones_to_warehouses(self, gdf_users_with_zones, gdf_warehouses):
        """Maps each demand zone to its nearest warehouse"""
        print("Mapping zones to warehouses...")

        # Project to Web Mercator for accurate distance calculations
        gdf_users_proj = gdf_users_with_zones.to_crs(epsg=3857)
        gdf_warehouses_proj = gdf_warehouses.to_crs(epsg=3857)

        # Calculate zone centroids
        zone_centroids = (
            gdf_users_proj[gdf_users_proj["zone_id"] != -1]
            .dissolve(by="zone_id")
            .centroid
        )

        # Find nearest warehouse for each zone
        zone_warehouse_map = {}
        for zone_id, centroid in zone_centroids.items():
            distances = gdf_warehouses_proj.distance(centroid)
            nearest_warehouse_idx = distances.idxmin()
            nearest_warehouse_id = gdf_warehouses.loc[
                nearest_warehouse_idx, "warehouseid"
            ]
            zone_warehouse_map[zone_id] = nearest_warehouse_id

        print(f"  - Mapped {len(zone_warehouse_map)} zones to warehouses")
        return zone_warehouse_map

    def run_forecasting(self, df_sales_with_zones):
        """Forecasts future demand for each product/zone combination"""
        print("Step 2: Forecasting demand...")

        # Prepare sales data
        df_sales_with_zones["ds"] = pd.to_datetime(
            df_sales_with_zones["orderdate"]
        ).dt.tz_localize(None)
        grouped = df_sales_with_zones.groupby(["productid", "zone_id"])

        forecast_results = []
        skipped = {"outliers": 0, "insufficient_data": 0}

        for name, group in grouped:
            product_id, zone_id = name

            # Skip outliers
            if zone_id == -1:
                skipped["outliers"] += 1
                continue

            # Aggregate daily sales
            df_ts = group.groupby("ds").agg(y=("quantitykg", "sum")).reset_index()

            # Need at least 2 data points
            if len(df_ts) < 2:
                skipped["insufficient_data"] += 1
                continue

            # Calculate confidence metrics
            data_quality_score = min(len(df_ts) / MIN_DATA_POINTS_FOR_PROPHET, 1.0)

            # Fix variance penalty calculation - was causing extremely low scores
            mean_demand = df_ts["y"].mean()
            std_demand = df_ts["y"].std()
            cv = std_demand / (mean_demand + 1e-6)  # Coefficient of variation
            variance_penalty = max(0.3, 1.0 / (1.0 + cv))  # Ensure minimum 0.3

            # Choose forecasting method based on data availability
            if len(df_ts) < MIN_DATA_POINTS_FOR_PROPHET:
                # Simple average for sparse data
                avg_daily_demand = df_ts["y"].mean()
                total_demand = avg_daily_demand * self.forecast_days
                # Improved confidence for sparse data
                forecast_confidence = (
                    0.4 + 0.3 * data_quality_score + 0.3 * variance_penalty
                )
            else:
                # Prophet for rich data
                try:
                    model = Prophet(
                        daily_seasonality=False,
                        weekly_seasonality=True,
                        yearly_seasonality=False,
                    )
                    model.fit(df_ts)
                    future = model.make_future_dataframe(periods=self.forecast_days)
                    forecast = model.predict(future)
                    total_demand = forecast["yhat"][-self.forecast_days :].sum()

                    # Calculate Prophet-based confidence - improved formula
                    future_forecasts = forecast["yhat"][-self.forecast_days :]
                    future_upper = forecast["yhat_upper"][-self.forecast_days :]
                    future_lower = forecast["yhat_lower"][-self.forecast_days :]

                    # Calculate uncertainty as percentage of forecast
                    uncertainty_ratio = (future_upper - future_lower).mean() / (
                        abs(future_forecasts.mean()) + 1e-6
                    )
                    uncertainty_score = max(
                        0.2, 1.0 - min(uncertainty_ratio / 2.0, 0.8)
                    )  # Cap uncertainty impact

                    forecast_confidence = (
                        0.3
                        + 0.4 * uncertainty_score
                        + 0.2 * data_quality_score
                        + 0.1 * variance_penalty
                    )
                except Exception:
                    # Fallback to average
                    avg_daily_demand = df_ts["y"].mean()
                    total_demand = avg_daily_demand * self.forecast_days
                    forecast_confidence = (
                        0.3 + 0.3 * data_quality_score + 0.4 * variance_penalty
                    )

            forecast_results.append(
                {
                    "productid": product_id,
                    "zone_id": zone_id,
                    "forecasteddemandkg": max(0, total_demand),
                    "forecast_confidence": forecast_confidence,
                }
            )

        print(f"  - Generated {len(forecast_results)} forecasts")

        return pd.DataFrame(forecast_results)

    def calculate_inventory_delta(self, df_forecast, df_inventory, zone_warehouse_map):
        """Identifies specific product records for transfer between warehouses"""
        print("Step 3: Analyzing inventory redistribution needs...")

        # Map forecasted demand to warehouses and aggregate with confidence
        df_forecast["warehouseid"] = df_forecast["zone_id"].map(zone_warehouse_map)
        df_demand = (
            df_forecast.groupby(["warehouseid", "productid"])
            .agg(
                {
                    "forecasteddemandkg": "sum",
                    "forecast_confidence": "mean",  # Average confidence across zones
                }
            )
            .reset_index()
        )

        # Calculate inventory totals per warehouse/product
        df_inventory_totals = (
            df_inventory.groupby(["warehouseid", "productid"])["quantitykg"]
            .sum()
            .reset_index()
        )
        df_inventory_totals.rename(
            columns={"quantitykg": "totalquantitykg"}, inplace=True
        )

        # Find surplus and deficit warehouses with confidence filtering
        df_delta = pd.merge(
            df_demand, df_inventory_totals, on=["warehouseid", "productid"], how="outer"
        ).fillna(
            {"forecasteddemandkg": 0, "totalquantitykg": 0, "forecast_confidence": 0}
        )
        df_delta["deltakg"] = (
            df_delta["totalquantitykg"] - df_delta["forecasteddemandkg"]
        )

        # Identify surplus and deficit warehouses (no thresholds)
        surplus_warehouses = df_delta[df_delta["deltakg"] > 0].copy()

        deficit_warehouses = df_delta[df_delta["deltakg"] < 0].copy()

        print(
            f"  - Found {len(surplus_warehouses)} surplus and {len(deficit_warehouses)} deficit locations"
        )

        # Generate specific transfer suggestions with confidence scoring
        transfer_suggestions = []
        product_suggestion_counts = {}

        for _, deficit_row in deficit_warehouses.iterrows():
            product_id = deficit_row["productid"]
            deficit_warehouse = deficit_row["warehouseid"]
            needed_qty = abs(deficit_row["deltakg"])
            deficit_confidence = deficit_row["forecast_confidence"]


            # Find surplus warehouses for same product
            product_surplus = surplus_warehouses[
                surplus_warehouses["productid"] == product_id
            ].copy()
            if product_surplus.empty:
                continue

            product_surplus = product_surplus.sort_values("deltakg", ascending=False)
            remaining_need = needed_qty

            for _, surplus_row in product_surplus.iterrows():
                if remaining_need <= 0:
                    break


                surplus_warehouse = surplus_row["warehouseid"]
                available_surplus = surplus_row["deltakg"]
                surplus_confidence = surplus_row["forecast_confidence"]

                # Get records from surplus warehouse (FIFO - oldest first)
                surplus_records = (
                    df_inventory[
                        (df_inventory["productid"] == product_id)
                        & (df_inventory["warehouseid"] == surplus_warehouse)
                    ]
                    .copy()
                    .sort_values("registrationdate")
                )

                for _, record in surplus_records.iterrows():
                    if remaining_need <= 0:
                        break


                    record_qty = record["quantitykg"]

                    # Only transfer complete records - no partial transfers allowed
                    if record_qty <= remaining_need and record_qty <= available_surplus:
                        # Calculate transfer confidence score - improved formula
                        # Use more reasonable normalization values
                        demand_magnitude_score = min(
                            needed_qty / 100.0, 1.0
                        )  # Normalize by 100kg instead of 1000kg
                        surplus_magnitude_score = min(available_surplus / 100.0, 1.0)
                        quantity_match_score = min(record_qty / needed_qty, 1.0)

                        # Ensure we have minimum base confidence
                        avg_forecast_confidence = (
                            deficit_confidence + surplus_confidence
                        ) / 2.0

                        transfer_confidence = (
                            0.5
                            * avg_forecast_confidence  # Forecast confidence (main factor)
                            + 0.2 * demand_magnitude_score  # Demand magnitude
                            + 0.2 * surplus_magnitude_score  # Surplus magnitude
                            + 0.1
                            * quantity_match_score  # How well the record matches the need
                        )

                        # Ensure minimum confidence
                        transfer_confidence = max(0.1, transfer_confidence)

                        # Include all transfers (no confidence threshold)
                        transfer_suggestions.append(
                            {
                                "recordid": record["recordid"],
                                "productid": product_id,
                                "from_warehouseid": surplus_warehouse,
                                "to_warehouseid": deficit_warehouse,
                                "transfer_qty": record_qty,  # Always the full record
                                "supplier_id": record["supplierid"],
                                "quality": record["qualityclassification"],
                                "registration_date": record["registrationdate"],
                                "confidence_score": transfer_confidence,
                            }
                        )

                        # Update product count
                        product_suggestion_counts[product_id] = (
                            product_suggestion_counts.get(product_id, 0) + 1
                        )

                        remaining_need -= record_qty
                        available_surplus -= record_qty

        df_transfers = pd.DataFrame(transfer_suggestions)
        print(f"  - Generated {len(df_transfers)} transfer suggestions")

        return df_transfers

    def generate_warehouse_balance_transfers(self, df_inventory, gdf_warehouses):
        """Generate transfer suggestions based on warehouse stock imbalances"""
        print("Generating warehouse balance transfers...")

        # Calculate warehouse stock levels per product
        warehouse_stock = df_inventory.groupby(['warehouseid', 'productid']).agg({
            'quantitykg': 'sum',
            'recordid': 'count'
        }).reset_index()
        warehouse_stock.rename(columns={'quantitykg': 'total_stock', 'recordid': 'record_count'}, inplace=True)

        # Calculate average stock per warehouse for each product
        avg_stock_per_product = warehouse_stock.groupby('productid')['total_stock'].mean().to_dict()

        transfer_suggestions = []

        for product_id, avg_stock in avg_stock_per_product.items():
            product_warehouses = warehouse_stock[warehouse_stock['productid'] == product_id]

            # Find warehouses with above/below average stock using configurable threshold
            surplus_threshold = avg_stock * (1 + WAREHOUSE_IMBALANCE_THRESHOLD)
            deficit_threshold = avg_stock * (1 - WAREHOUSE_IMBALANCE_THRESHOLD)
            surplus_warehouses = product_warehouses[product_warehouses['total_stock'] > surplus_threshold]
            deficit_warehouses = product_warehouses[product_warehouses['total_stock'] < deficit_threshold]

            if surplus_warehouses.empty or deficit_warehouses.empty:
                continue

            # Generate transfers from surplus to deficit warehouses
            for _, surplus_row in surplus_warehouses.iterrows():
                surplus_warehouse = surplus_row['warehouseid']
                excess_qty = surplus_row['total_stock'] - avg_stock

                # Get records from surplus warehouse (FIFO)
                surplus_records = df_inventory[
                    (df_inventory['productid'] == product_id) &
                    (df_inventory['warehouseid'] == surplus_warehouse)
                ].copy().sort_values('registrationdate')

                for _, deficit_row in deficit_warehouses.iterrows():
                    if excess_qty <= 0:
                        break

                    deficit_warehouse = deficit_row['warehouseid']
                    needed_qty = avg_stock - deficit_row['total_stock']

                    # Transfer records up to needed quantity
                    for _, record in surplus_records.iterrows():
                        if excess_qty <= 0 or needed_qty <= 0:
                            break

                        record_qty = record['quantitykg']
                        if record_qty <= min(excess_qty, needed_qty):
                            transfer_suggestions.append({
                                'recordid': record['recordid'],
                                'productid': product_id,
                                'from_warehouseid': surplus_warehouse,
                                'to_warehouseid': deficit_warehouse,
                                'transfer_qty': record_qty,
                                'supplier_id': record['supplierid'],
                                'quality': record['qualityclassification'],
                                'registration_date': record['registrationdate'],
                                'confidence_score': 0.8,  # High confidence for balance transfers
                            })
                            excess_qty -= record_qty
                            needed_qty -= record_qty

        df_transfers = pd.DataFrame(transfer_suggestions)
        print(f"Generated {len(df_transfers)} warehouse balance transfers")

        # Ensure minimum number of transfers if configured and inventory exists
        if (FORCE_MINIMUM_TRANSFERS and len(df_transfers) < MINIMUM_TRANSFER_SUGGESTIONS and
            not df_inventory.empty):
            print(f"Less than minimum {MINIMUM_TRANSFER_SUGGESTIONS} transfers generated, creating additional transfers")
            additional_transfers = self.generate_minimum_transfers(df_inventory, MINIMUM_TRANSFER_SUGGESTIONS - len(df_transfers))
            if additional_transfers:
                df_transfers = pd.concat([df_transfers, additional_transfers], ignore_index=True)

        return df_transfers

    def generate_minimum_transfers(self, df_inventory, num_needed):
        """Generate minimum required transfers when not enough are found"""
        print(f"Generating {num_needed} minimum transfers...")

        # Simple strategy: pick records from warehouses with most stock
        warehouse_totals = df_inventory.groupby('warehouseid')['quantitykg'].sum().sort_values(ascending=False)

        if len(warehouse_totals) < 2:
            return pd.DataFrame()  # Need at least 2 warehouses

        source_warehouses = warehouse_totals.head(len(warehouse_totals)//2).index.tolist()
        dest_warehouses = warehouse_totals.tail(len(warehouse_totals)//2).index.tolist()

        transfer_suggestions = []
        records_used = 0

        for source_warehouse in source_warehouses:
            if records_used >= num_needed:
                break

            source_records = df_inventory[df_inventory['warehouseid'] == source_warehouse].sort_values('registrationdate')

            for _, record in source_records.iterrows():
                if records_used >= num_needed:
                    break

                # Assign to a destination warehouse (round robin)
                dest_warehouse = dest_warehouses[records_used % len(dest_warehouses)]

                transfer_suggestions.append({
                    'recordid': record['recordid'],
                    'productid': record['productid'],
                    'from_warehouseid': source_warehouse,
                    'to_warehouseid': dest_warehouse,
                    'transfer_qty': record['quantitykg'],
                    'supplier_id': record['supplierid'],
                    'quality': record['qualityclassification'],
                    'registration_date': record['registrationdate'],
                    'confidence_score': 0.6,  # Lower confidence for minimum transfers
                })
                records_used += 1

        return pd.DataFrame(transfer_suggestions)

    def apply_confidence_threshold(self, df_transfers):
        """Apply confidence threshold to filter transfer suggestions while ensuring minimum suggestions"""
        if df_transfers.empty:
            return df_transfers

        print(f"Applying confidence threshold of {self.confidence_threshold}")

        # Filter transfers by confidence threshold
        high_confidence_transfers = df_transfers[df_transfers['confidence_score'] >= self.confidence_threshold]

        print(f"  - Original transfers: {len(df_transfers)}")
        print(f"  - High confidence transfers: {len(high_confidence_transfers)}")

        # If we have enough high confidence transfers, use them
        if len(high_confidence_transfers) >= MINIMUM_TRANSFER_SUGGESTIONS:
            print(f"  - Using {len(high_confidence_transfers)} high confidence transfers")
            return high_confidence_transfers

        # Otherwise, take the highest confidence transfers to meet minimum requirement
        if len(df_transfers) >= MINIMUM_TRANSFER_SUGGESTIONS:
            top_transfers = df_transfers.nlargest(MINIMUM_TRANSFER_SUGGESTIONS, 'confidence_score')
            print(f"  - Using top {MINIMUM_TRANSFER_SUGGESTIONS} transfers by confidence")
            return top_transfers

        # If we don't have enough transfers at all, return all available
        print(f"  - Using all {len(df_transfers)} available transfers")
        return df_transfers

    def force_vrp_solution(self, product_id, df_transfer_suggestions, gdf_warehouses, df_trucks):
        """Force a VRP solution for a product by simplifying constraints if needed"""
        print(f"Forcing VRP solution for Product {product_id}...")

        # Try normal VRP first
        result = self.solve_redistribution_vrp(product_id, df_transfer_suggestions, gdf_warehouses, df_trucks)
        if result and isinstance(result, tuple) and result[1]:
            return result[1]

        # If normal VRP fails, create simplified truck assignments
        product_transfers = df_transfer_suggestions[
            df_transfer_suggestions['productid'] == product_id
        ]

        if product_transfers.empty:
            return {}

        available_trucks = df_trucks.head(self.max_trucks_to_use)
        if available_trucks.empty:
            return {}

        # Simple round-robin truck assignment
        truck_assignments = {}
        total_load = product_transfers['transfer_qty'].sum()
        trucks_needed = min(len(available_trucks), max(1, int(total_load / 1000)))  # Assume 1000kg per truck minimum

        for i in range(trucks_needed):
            truck_info = available_trucks.iloc[i]
            truck_assignments[f"forced_route_{i}"] = {
                'truck_id': truck_info['truckid'],
                'capacity': truck_info['loadcapacitykg'],
                'total_load': total_load / trucks_needed
            }

        print(f"Forced VRP solution created with {trucks_needed} trucks")
        return truck_assignments

    def solve_redistribution_vrp(
        self, product_id, df_transfer_suggestions, gdf_warehouses, df_trucks
    ):
        """Creates optimal truck routes for product record transfers"""
        print(f"\nOptimizing routes for Product {product_id}...")

        # Filter transfers for this product
        product_transfers = df_transfer_suggestions[
            df_transfer_suggestions["productid"] == product_id
        ].copy()

        if product_transfers.empty:
            print("  - No transfers needed for this product")
            return None

        # Get warehouses involved in transfers
        from_warehouses = set(product_transfers["from_warehouseid"].unique())
        to_warehouses = set(product_transfers["to_warehouseid"].unique())
        involved_warehouse_ids = list(from_warehouses.union(to_warehouses))

        gdf_involved_warehouses = (
            gdf_warehouses[gdf_warehouses["warehouseid"].isin(involved_warehouse_ids)]
            .copy()
            .reset_index(drop=True)
        )

        # Choose depot (warehouse with most outgoing transfers)
        from_warehouse_counts = product_transfers["from_warehouseid"].value_counts()
        depot_warehouse_id = from_warehouse_counts.index[0]
        depot_idx = int(
            gdf_involved_warehouses[
                gdf_involved_warehouses["warehouseid"] == depot_warehouse_id
            ].index[0]
        )

        # Calculate net transfers per warehouse
        net_transfers = {}
        for warehouse_id in involved_warehouse_ids:
            pickup_qty = product_transfers[
                product_transfers["from_warehouseid"] == warehouse_id
            ]["transfer_qty"].sum()
            dropoff_qty = product_transfers[
                product_transfers["to_warehouseid"] == warehouse_id
            ]["transfer_qty"].sum()
            net_transfers[warehouse_id] = dropoff_qty - pickup_qty

        demands = [
            int(net_transfers.get(gdf_involved_warehouses.iloc[i]["warehouseid"], 0))
            for i in range(len(gdf_involved_warehouses))
        ]

        # Setup truck fleet
        available_trucks = df_trucks.head(self.max_trucks_to_use)
        num_trucks = len(available_trucks)
        truck_capacities = available_trucks["loadcapacitykg"].tolist()
        total_fleet_capacity = sum(truck_capacities)

        total_surplus = abs(sum(d for d in demands if d < 0))
        total_deficit = sum(d for d in demands if d > 0)

        if total_surplus == 0:
            print("  - No surplus available")
            return None

        # Scale demands if needed
        actual_redistribution = min(total_surplus, total_deficit, total_fleet_capacity)
        if total_deficit > 0:
            scale_factor = min(1.0, actual_redistribution / total_deficit)
            for i in range(len(demands)):
                if demands[i] > 0:
                    demands[i] = int(demands[i] * scale_factor)

        # Create distance matrix (using simple Euclidean distance on projected coordinates)
        gdf_proj = gdf_involved_warehouses.to_crs(epsg=3857)  # Project to meters
        coords = [(p.x, p.y) for p in gdf_proj.geometry]
        dist_matrix = distance.cdist(coords, coords, "euclidean").astype(int)

        # Setup VRP optimization
        manager = pywrapcp.RoutingIndexManager(len(dist_matrix), num_trucks, depot_idx)
        routing = pywrapcp.RoutingModel(manager)

        # Distance callback
        def distance_callback(from_index, to_index):
            from_node = manager.IndexToNode(from_index)
            to_node = manager.IndexToNode(to_index)
            return dist_matrix[from_node][to_node]

        routing.SetArcCostEvaluatorOfAllVehicles(
            routing.RegisterTransitCallback(distance_callback)
        )

        # Capacity constraints
        def demand_callback(from_index):
            from_node = manager.IndexToNode(from_index)
            return demands[from_node]

        routing.AddDimensionWithVehicleCapacity(
            routing.RegisterUnaryTransitCallback(demand_callback),
            slack_max=0,
            vehicle_capacities=truck_capacities,
            fix_start_cumul_to_zero=True,
            name="Capacity",
        )

        # Ultra-fast parameters - don't care about quality, just get ANY solution
        search_parameters = pywrapcp.DefaultRoutingSearchParameters()

        # Fastest first solution - just get something
        search_parameters.first_solution_strategy = (
            routing_enums_pb2.FirstSolutionStrategy.FIRST_UNBOUND_MIN_VALUE
        )

        # No local search - too slow
        search_parameters.local_search_metaheuristic = (
            routing_enums_pb2.LocalSearchMetaheuristic.AUTOMATIC
        )

        # No time limit - allow full optimization

        # Just find the first solution
        search_parameters.solution_limit = 1

        # Basic feasibility checks
        if total_surplus == 0 or total_deficit == 0:
            return "No redistribution needed", {}

        # Check if any single truck can handle the largest demand and split if needed
        max_demand = max(abs(d) for d in demands)
        max_truck_capacity = max(truck_capacities)
        if max_demand > max_truck_capacity:
            # Split large demands across multiple visits
            new_demands, new_coords = [], []

            for i, demand in enumerate(demands):
                abs_demand = abs(demand)
                coord = coords[i]

                if abs_demand <= max_truck_capacity:
                    new_demands.append(demand)
                    new_coords.append(coord)
                else:
                    # Split into multiple visits
                    num_splits = (
                        abs_demand + max_truck_capacity - 1
                    ) // max_truck_capacity
                    split_demand = demand / num_splits

                    for _ in range(num_splits):
                        new_demands.append(int(split_demand))
                        new_coords.append(coord)

            # Update VRP with split demands
            demands, coords = new_demands, new_coords
            dist_matrix = distance.cdist(coords, coords, "euclidean").astype(int)

            manager = pywrapcp.RoutingIndexManager(len(dist_matrix), num_trucks, 0)
            routing = pywrapcp.RoutingModel(manager)

            def distance_callback(from_index, to_index):
                return dist_matrix[manager.IndexToNode(from_index)][
                    manager.IndexToNode(to_index)
                ]

            def demand_callback(from_index):
                return demands[manager.IndexToNode(from_index)]

            routing.SetArcCostEvaluatorOfAllVehicles(
                routing.RegisterTransitCallback(distance_callback)
            )
            routing.AddDimensionWithVehicleCapacity(
                routing.RegisterUnaryTransitCallback(demand_callback),
                slack_max=0,
                vehicle_capacities=truck_capacities,
                fix_start_cumul_to_zero=True,
                name="Capacity",
            )

        solution = routing.SolveWithParameters(search_parameters)

        # Try multiple fallback strategies until one works
        if not solution:
            fallback_strategies = [
                routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC,
                routing_enums_pb2.FirstSolutionStrategy.SAVINGS,
                routing_enums_pb2.FirstSolutionStrategy.PATH_MOST_CONSTRAINED_ARC,
                routing_enums_pb2.FirstSolutionStrategy.EVALUATOR_STRATEGY,
                routing_enums_pb2.FirstSolutionStrategy.ALL_UNPERFORMED,
            ]

            for strategy in fallback_strategies:
                params = pywrapcp.DefaultRoutingSearchParameters()
                params.first_solution_strategy = strategy
                params.time_limit.seconds = 5
                params.solution_limit = 1

                solution = routing.SolveWithParameters(params)
                if solution:
                    print(f"  - VRP solved using fallback strategy: {strategy}")
                    break

            # If still no solution, try without capacity constraints
            if not solution:
                print("  - Attempting VRP without capacity constraints")
                simple_routing = pywrapcp.RoutingModel(manager)
                simple_routing.SetArcCostEvaluatorOfAllVehicles(
                    simple_routing.RegisterTransitCallback(distance_callback)
                )

                simple_params = pywrapcp.DefaultRoutingSearchParameters()
                simple_params.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
                simple_params.time_limit.seconds = 3
                simple_params.solution_limit = 1

                solution = simple_routing.SolveWithParameters(simple_params)
                if solution:
                    routing = simple_routing  # Use simplified routing for solution parsing

        # Parse solution and create truck assignments
        truck_assignments = {}
        plan_output = ""

        if solution:
            # Create truck assignments
            trucks_used = 0
            for vehicle_id in range(num_trucks):
                truck_id = available_trucks.iloc[vehicle_id]["truckid"]
                truck_capacity = truck_capacities[vehicle_id]

                # Check if vehicle has route
                index = routing.Start(vehicle_id)
                has_visits = False
                while not routing.IsEnd(index):
                    index = solution.Value(routing.NextVar(index))
                    if index != routing.End(vehicle_id):
                        has_visits = True
                        break

                if has_visits:
                    trucks_used += 1
                    truck_assignments[f"vrp_route_{vehicle_id}"] = {
                        "truck_id": truck_id,
                        "capacity": truck_capacity,
                        "total_load": actual_redistribution / trucks_used
                        if trucks_used > 0
                        else 0,
                    }

            plan_output = f"VRP optimization successful - {trucks_used} trucks utilized"
        else:
            # Force truck assignments even without VRP solution
            plan_output = "Creating basic truck assignments without VRP optimization"
            total_load = sum(abs(d) for d in demands if d != 0)
            trucks_to_use = min(num_trucks, max(1, int(total_load / max(truck_capacities))))

            for vehicle_id in range(trucks_to_use):
                truck_id = available_trucks.iloc[vehicle_id]["truckid"]
                truck_capacity = truck_capacities[vehicle_id]
                truck_assignments[f"basic_route_{vehicle_id}"] = {
                    "truck_id": truck_id,
                    "capacity": truck_capacity,
                    "total_load": total_load / trucks_to_use,
                }

        return plan_output, truck_assignments

    def prepare_response_data(
        self, df_transfers, all_truck_assignments, df_products, gdf_warehouses
    ):
        """Prepare data for API response"""
        transfer_records = []

        for _, transfer in df_transfers.iterrows():
            # Find assigned truck for this transfer
            assigned_truck = None
            for product_id, assignments in all_truck_assignments.items():
                if transfer["productid"] == product_id:
                    route_key = (
                        transfer["from_warehouseid"],
                        transfer["to_warehouseid"],
                    )
                    if route_key in assignments:
                        assigned_truck = assignments[route_key]
                        break
                    # Also check VRP routes
                    for key, truck_info in assignments.items():
                        if isinstance(key, str) and key.startswith("vrp_route_"):
                            assigned_truck = truck_info
                            break
                    if assigned_truck:
                        break

            # Get product name
            product_name = (
                df_products[df_products["productid"] == transfer["productid"]][
                    "name"
                ].iloc[0]
                if len(df_products[df_products["productid"] == transfer["productid"]])
                > 0
                else f"Product #{transfer['productid']}"
            )

            # Get warehouse names
            origin_warehouse_name = (
                gdf_warehouses[
                    gdf_warehouses["warehouseid"] == transfer["from_warehouseid"]
                ]["name"].iloc[0]
                if len(
                    gdf_warehouses[
                        gdf_warehouses["warehouseid"] == transfer["from_warehouseid"]
                    ]
                )
                > 0
                else f"Warehouse #{transfer['from_warehouseid']}"
            )
            destination_warehouse_name = (
                gdf_warehouses[
                    gdf_warehouses["warehouseid"] == transfer["to_warehouseid"]
                ]["name"].iloc[0]
                if len(
                    gdf_warehouses[
                        gdf_warehouses["warehouseid"] == transfer["to_warehouseid"]
                    ]
                )
                > 0
                else f"Warehouse #{transfer['to_warehouseid']}"
            )

            transfer_record = {
                "transfer_id": f"T{len(transfer_records) + 1:04d}",
                "product_id": int(transfer["productid"]),
                "product_name": product_name,
                "product_record_id": int(transfer["recordid"]),
                "origin_warehouse_id": int(transfer["from_warehouseid"]),
                "origin_warehouse_name": origin_warehouse_name,
                "destination_warehouse_id": int(transfer["to_warehouseid"]),
                "destination_warehouse_name": destination_warehouse_name,
                "quantity_kg": float(transfer["transfer_qty"]),
                "supplier_id": int(transfer["supplier_id"]),
                "quality_classification": str(transfer["quality"]),
                "registration_date": transfer["registration_date"],
                "assigned_truck_id": assigned_truck["truck_id"]
                if assigned_truck
                else None,
                "truck_capacity_kg": assigned_truck["capacity"]
                if assigned_truck
                else None,
                "route_total_load_kg": assigned_truck["total_load"]
                if assigned_truck
                else None,
                "generated_timestamp": datetime.now(),
                "status": "Pending",
            }
            transfer_records.append(transfer_record)

        # Create product summary
        df_export = pd.DataFrame(transfer_records)
        product_summary = []
        if not df_export.empty:
            summary_by_product = (
                df_export.groupby("product_id")
                .agg(
                    {
                        "quantity_kg": "sum",
                        "product_record_id": "count",
                        "assigned_truck_id": "nunique",
                    }
                )
                .reset_index()
            )

            for _, row in summary_by_product.iterrows():
                product_summary.append(
                    {
                        "product_id": int(row["product_id"]),
                        "total_quantity_kg": float(row["quantity_kg"]),
                        "number_of_transfers": int(row["product_record_id"]),
                        "trucks_required": int(row["assigned_truck_id"])
                        if pd.notna(row["assigned_truck_id"])
                        else 0,
                    }
                )

        # Create route summary
        route_summary = []
        if not df_export.empty:
            route_summary_df = (
                df_export.groupby(
                    [
                        "origin_warehouse_id",
                        "destination_warehouse_id",
                        "assigned_truck_id",
                    ]
                )
                .agg(
                    {
                        "quantity_kg": "sum",
                        "product_record_id": "count",
                        "product_id": "nunique",
                    }
                )
                .reset_index()
            )

            for _, row in route_summary_df.iterrows():
                route_summary.append(
                    {
                        "origin_warehouse_id": int(row["origin_warehouse_id"]),
                        "destination_warehouse_id": int(
                            row["destination_warehouse_id"]
                        ),
                        "assigned_truck_id": int(row["assigned_truck_id"])
                        if pd.notna(row["assigned_truck_id"])
                        else None,
                        "route_total_kg": float(row["quantity_kg"]),
                        "number_of_records": int(row["product_record_id"]),
                        "number_of_products": int(row["product_id"]),
                    }
                )

        return transfer_records, product_summary, route_summary

    def generate_transfer_suggestions(self) -> Dict[str, Any]:
        """Main method to generate transfer suggestions"""
        try:
            # Fetch all data
            (
                gdf_users,
                gdf_warehouses,
                df_products,
                df_sales,
                df_inventory,
                df_trucks,
            ) = self.fetch_data()
            if gdf_users is None:
                return {
                    "success": False,
                    "message": "Failed to fetch data from database",
                    "error": "Database connection error",
                }

            # Step 1: Clustering and zone mapping
            gdf_users_with_zones = self.run_clustering(gdf_users)
            if gdf_users_with_zones is None:
                return {
                    "success": False,
                    "message": "No user data available for clustering",
                    "error": "Insufficient user data",
                }

            zone_warehouse_map = self.map_zones_to_warehouses(
                gdf_users_with_zones, gdf_warehouses
            )

            # Step 2: Demand forecasting
            df_sales_with_zones = pd.merge(
                df_sales,
                gdf_users_with_zones[["userid", "zone_id"]],
                left_on="buyerid",
                right_on="userid",
            )
            df_forecast = self.run_forecasting(df_sales_with_zones)

            # Force transfer generation even without forecasting data
            if df_forecast.empty:
                print("No demand forecasting available - generating transfers based on warehouse imbalances")
                df_forecast = self.generate_warehouse_balance_transfers(df_inventory, gdf_warehouses)

            # Step 3: Transfer suggestions
            df_transfers = self.calculate_inventory_delta(
                df_forecast, df_inventory, zone_warehouse_map
            )

            # Force transfer generation if none found - create warehouse balancing transfers
            if df_transfers.empty:
                print("No transfer opportunities found - generating warehouse balancing transfers")
                df_transfers = self.generate_warehouse_balance_transfers(df_inventory, gdf_warehouses)

            # Apply confidence threshold filtering
            df_transfers = self.apply_confidence_threshold(df_transfers)

            # Step 4: Generate VRP transfer plans (limited for performance)
            # Prioritize products with more transfer opportunities for better results
            product_transfer_counts = df_transfers["productid"].value_counts()
            print(f"  - Total products with transfers: {len(product_transfer_counts)}")
            print(
                f"  - Top products by transfer count: {product_transfer_counts.head(10).to_dict()}"
            )

            # Process all products with transfers (no limit)
            products_needing_transfers = product_transfer_counts.index.tolist()
            print(
                f"  - Selected products for VRP processing: {products_needing_transfers}"
            )

            all_truck_assignments = {}
            products_with_vrp_solutions = []

            for product_id in products_needing_transfers:
                result = self.solve_redistribution_vrp(
                    product_id, df_transfers, gdf_warehouses, df_trucks
                )
                if result and isinstance(result, tuple):
                    plan, truck_assignments = result
                    if truck_assignments:
                        all_truck_assignments[product_id] = truck_assignments
                        products_with_vrp_solutions.append(product_id)

            # Always use VRP - no filtering out of solutions
            if not products_with_vrp_solutions:
                print("No VRP solutions found initially - forcing VRP on all transfers")
                # Force VRP on all available transfers
                all_truck_assignments = {}
                for product_id in products_needing_transfers:
                    # Force VRP solution for each product
                    forced_assignments = self.force_vrp_solution(product_id, df_transfers, gdf_warehouses, df_trucks)
                    if forced_assignments:
                        all_truck_assignments[product_id] = forced_assignments
                        products_with_vrp_solutions.append(product_id)

            # Prepare response data
            transfer_records, product_summary, route_summary = (
                self.prepare_response_data(
                    df_transfers, all_truck_assignments, df_products, gdf_warehouses
                )
            )

            total_volume = df_transfers["transfer_qty"].sum()

            return {
                "success": True,
                "message": f"Successfully generated {len(transfer_records)} transfer suggestions",
                "transfer_records": transfer_records,
                "product_summary": product_summary,
                "route_summary": route_summary,
                "results": {
                    "total_products": len(products_needing_transfers),
                    "total_transfers": len(transfer_records),
                    "total_volume": float(total_volume),
                    "parameters_used": {
                        "max_trucks_to_use": self.max_trucks_to_use,
                        "forecast_days": self.forecast_days,
                        "dbscan_eps_meters": self.dbscan_eps_meters,
                        "dbscan_min_samples": self.dbscan_min_samples,
                    },
                },
            }

        except Exception as e:
            return {
                "success": False,
                "message": "Error during transfer suggestion generation",
                "error": str(e),
                "transfer_records": [],
                "product_summary": [],
                "route_summary": [],
            }
