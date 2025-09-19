from datetime import datetime, timedelta
from typing import Optional
from src.order.order_entity import Order, OrderStatus
from src.order.order_repository import OrderRepository
from src.order.order_dto import CreateOrderDto, CreateOrderResponseDto
from src.trip.trip_entity import Trip, TripStatus
from src.trip.trip_repository import TripRepository
from src.truck.truck_repository import TruckRepository
from src.truck.truck_entity import TruckStatus, TruckType
from src.warehouse.warehouse_repository import WarehouseRepository
from src.user.user_repository import UserRepository
from src.product_record.product_record_repository import ProductRecordRepository
from src.product_record.product_record_entity import ProductRecordStatus
from src.base import Location
from typing import List
import math
import asyncio


class CreateOrderUseCase:
    def __init__(
        self,
        order_repository: OrderRepository,
        trip_repository: TripRepository,
        truck_repository: TruckRepository,
        warehouse_repository: WarehouseRepository,
        user_repository: UserRepository,
        product_record_repository: ProductRecordRepository,
    ):
        self._order_repository = order_repository
        self._trip_repository = trip_repository
        self._truck_repository = truck_repository
        self._warehouse_repository = warehouse_repository
        self._user_repository = user_repository
        self._product_record_repository = product_record_repository

    async def execute(self, create_order_dto: CreateOrderDto) -> CreateOrderResponseDto:
        """Create a new order with stock validation and concurrent safety"""
        # Validate stock availability and lock records for concurrent safety
        if create_order_dto.record_ids:
            available_records = await self._validate_and_reserve_stock(
                create_order_dto.record_ids
            )
            if not available_records:
                raise Exception("No product records are available for purchase")

        # Calculate total amount if not provided
        total_amount = create_order_dto.total_amount
        if not total_amount and create_order_dto.record_ids:
            total_amount = await self._calculate_total_amount(
                create_order_dto.record_ids
            )

        order = Order(
            order_id=None,
            buyer_id=create_order_dto.buyer_id,
            order_date=datetime.utcnow(),
            status=create_order_dto.status,
            total_amount=total_amount,
        )

        created_order = await self._order_repository.create(order)

        # Create order items for purchased product records
        if create_order_dto.record_ids:
            await self._create_order_items_for_records(
                created_order.order_id, create_order_dto.record_ids
            )

        # Automatically create trip for the order
        await self._create_trip_for_order(created_order)

        return CreateOrderResponseDto(
            order_id=created_order.order_id,
            message="Order and trip created successfully",
        )

    async def _validate_and_reserve_stock(self, record_ids: List[int]) -> List[int]:
        """Validate stock availability and reserve for concurrent safety"""
        available_records = []

        for record_id in record_ids:
            # Get product record with current status
            product_record = await self._product_record_repository.get_by_id(record_id)

            if not product_record:
                continue  # Skip if record doesn't exist

            # Check if product is available (not sold or discarded)
            if product_record.status != ProductRecordStatus.IN_STOCK:
                continue  # Skip if not in stock

            # Attempt to atomically mark as sold to prevent concurrent purchases
            try:
                update_data = {
                    "Status": ProductRecordStatus.SOLD.value,
                    "SaleDate": datetime.utcnow(),
                    "WarehouseID": None,  # Free warehouse space when product is sold
                }
                updated_record = await self._product_record_repository.update(
                    record_id, update_data
                )
                if updated_record and updated_record.status == ProductRecordStatus.SOLD:
                    available_records.append(record_id)
            except Exception:
                # If update fails (likely due to concurrent access), skip this record
                continue

        return available_records

    async def _calculate_total_amount(self, record_ids: List[int]) -> int:
        """Calculate total amount for the order based on product prices"""
        # This is a simplified calculation - in a real system you'd have product prices
        # For now, return a basic amount per item
        return len(record_ids) * 1000  # 1000 units per item as placeholder

    async def _create_order_items_for_records(
        self, order_id: int, record_ids: List[int]
    ) -> None:
        """Create order items for each reserved product record"""
        from src.order_item.order_item_entity import OrderItem
        from src.order_item.order_item_repository import OrderItemRepository

        # Create repository instance using the same session as product_record_repository
        order_item_repo = OrderItemRepository(self._product_record_repository.session)

        for record_id in record_ids:
            order_item = OrderItem(
                order_item_id=None,
                order_id=order_id,
                record_id=record_id,
                price_at_purchase=1000,  # Placeholder price
            )
            await order_item_repo.create(order_item)

    async def _create_trip_for_order(self, order: Order) -> None:
        """Create a trip for the given order and assign an available truck/driver"""
        # Get buyer's location (destination)
        buyer = await self._user_repository.get_by_id(order.buyer_id)
        if not buyer or not buyer.location:
            # Default destination if buyer location not found
            destination = Location(latitude=40.7128, longitude=-74.0060)  # NYC default
        else:
            destination = buyer.location

        # For now, set origin to the first available warehouse
        warehouses = await self._warehouse_repository.get_all()
        if not warehouses:
            origin = Location(latitude=40.7589, longitude=-73.9851)  # Manhattan default
        else:
            origin = warehouses[0].location

        # Find closest available truck with driver
        available_truck = await self._find_closest_available_truck(origin)

        # Calculate estimated time
        estimated_time = self._calculate_estimated_time(origin, destination)

        # Create trip
        trip = Trip(
            trip_id=None,
            truck_id=available_truck.truck_id if available_truck else None,
            order_id=order.order_id,
            origin=origin,
            destination=destination,
            status=TripStatus.WAITING,
            estimated_time=estimated_time,
            actual_time=None,
            start_date=None,
            end_date=None,
        )

        await self._trip_repository.create(trip)

        # Update truck status to IN_SERVICE if truck assigned
        if available_truck:
            await self._truck_repository.update_status_and_location(
                available_truck.truck_id, TruckStatus.IN_SERVICE
            )

    async def _find_closest_available_truck(
        self, origin_location: Location
    ) -> Optional[object]:
        """Find the closest available truck with driver that's not already assigned to active trips"""
        available_trucks = await self._truck_repository.get_by_status(
            TruckStatus.AVAILABLE
        )

        # Filter trucks that have drivers
        trucks_with_drivers = [
            truck for truck in available_trucks if truck.truck_driver_id is not None
        ]

        if not trucks_with_drivers:
            return None

        # Filter out trucks that are already assigned to active trips
        truly_available_trucks = []
        for truck in trucks_with_drivers:
            # Check if truck is already assigned to active trips
            active_trips = await self._trip_repository.get_by_truck_id(truck.truck_id)
            has_active_trip = any(
                trip.status
                in [
                    TripStatus.WAITING,
                    TripStatus.COLLECTING,
                    TripStatus.LOADED,
                    TripStatus.DELIVERING,
                ]
                for trip in active_trips
            )

            if not has_active_trip:
                truly_available_trucks.append(truck)

        if not truly_available_trucks:
            return None

        # Find closest truck by calculating distances
        closest_truck = None
        min_distance = float("inf")

        for truck in truly_available_trucks:
            if truck.current_location:
                distance = self._calculate_distance_km(
                    origin_location, truck.current_location
                )
                if distance < min_distance:
                    min_distance = distance
                    closest_truck = truck

        # If no truck has location data, return first available
        return closest_truck or truly_available_trucks[0]

    def _calculate_estimated_time(
        self, origin: Location, destination: Location
    ) -> timedelta:
        """Calculate estimated travel time considering speed and legal driving hours"""
        # Calculate distance using Haversine formula
        distance_km = self._calculate_distance_km(origin, destination)

        # Average truck speed: 60 km/h on highways, 40 km/h in cities
        # Using conservative 50 km/h average
        avg_speed_kmh = 50

        # Basic travel time
        travel_hours = distance_km / avg_speed_kmh

        # Add breaks according to legal driving hours
        # EU regulation: 4.5h driving requires 45min break, max 9h driving per day
        mandatory_breaks_hours = 0
        if travel_hours > 4.5:
            mandatory_breaks_hours += 0.75  # 45 minutes
        if travel_hours > 9:
            # For long distances, assume overnight rest (11 hours minimum)
            mandatory_breaks_hours += 11

        # Add buffer for loading/unloading and traffic
        buffer_hours = min(2, travel_hours * 0.2)  # 20% buffer, max 2 hours

        total_hours = travel_hours + mandatory_breaks_hours + buffer_hours

        return timedelta(hours=total_hours)

    def _calculate_distance_km(self, origin: Location, destination: Location) -> float:
        """Calculate distance between two locations using Haversine formula"""
        return origin.distance_to(destination)
