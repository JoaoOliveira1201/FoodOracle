from datetime import datetime, timedelta
from typing import Optional
from src.warehouse_transfer.warehouse_transfer_entity import (
    WarehouseTransfer,
    TransferStatus,
    TransferReason,
)
from src.warehouse_transfer.warehouse_transfer_repository import (
    WarehouseTransferRepository,
)
from src.warehouse_transfer.warehouse_transfer_dto import (
    CreateWarehouseTransferDto,
    CreateWarehouseTransferResponseDto,
)
from src.truck.truck_repository import TruckRepository
from src.truck.truck_entity import TruckStatus
from src.warehouse.warehouse_repository import WarehouseRepository
from src.base import Location
import math


class CreateWarehouseTransferUseCase:
    def __init__(
        self,
        transfer_repository: WarehouseTransferRepository,
        truck_repository: TruckRepository,
        warehouse_repository: WarehouseRepository,
    ):
        self._transfer_repository = transfer_repository
        self._truck_repository = truck_repository
        self._warehouse_repository = warehouse_repository

    async def execute(
        self, create_dto: CreateWarehouseTransferDto
    ) -> CreateWarehouseTransferResponseDto:
        """Create a new warehouse transfer and assign a driver automatically"""

        # Get warehouse locations for distance calculation
        origin_warehouse = await self._warehouse_repository.get_by_id(
            create_dto.origin_warehouse_id
        )
        destination_warehouse = await self._warehouse_repository.get_by_id(
            create_dto.destination_warehouse_id
        )

        if not origin_warehouse or not destination_warehouse:
            raise ValueError("Invalid warehouse IDs provided")

        # Find closest available truck with driver
        available_truck = await self._find_closest_available_truck(
            origin_warehouse.location
        )

        # Calculate estimated time
        estimated_time = self._calculate_estimated_time(
            origin_warehouse.location, destination_warehouse.location
        )

        # Create warehouse transfer
        transfer = WarehouseTransfer(
            transfer_id=None,
            record_id=create_dto.record_id,
            origin_warehouse_id=create_dto.origin_warehouse_id,
            destination_warehouse_id=create_dto.destination_warehouse_id,
            truck_id=available_truck.truck_id if available_truck else None,
            reason=create_dto.reason,
            status=TransferStatus.PENDING,
            estimated_time=estimated_time,
            actual_time=None,
            requested_date=datetime.utcnow(),
            start_date=None,
            completed_date=None,
            notes=create_dto.notes,
        )

        created_transfer = await self._transfer_repository.create(transfer)

        # Update truck status if truck assigned
        if available_truck:
            await self._truck_repository.update_status_and_location(
                available_truck.truck_id, TruckStatus.IN_SERVICE
            )

        return CreateWarehouseTransferResponseDto(
            transfer_id=created_transfer.transfer_id,
            message="Warehouse transfer created successfully"
            + (
                " and driver assigned"
                if available_truck
                else " - waiting for available driver"
            ),
        )

    async def _find_closest_available_truck(
        self, origin_location: Location, required_truck_type=None
    ) -> Optional[object]:
        """Find the closest available truck with driver to the origin warehouse"""
        available_trucks = await self._truck_repository.get_by_status(
            TruckStatus.AVAILABLE
        )

        # Filter trucks that have drivers
        trucks_with_drivers = [
            truck for truck in available_trucks if truck.truck_driver_id is not None
        ]

        if not trucks_with_drivers:
            return None

        # Filter by truck type if specified (useful for refrigerated transfers)
        if required_truck_type:
            trucks_with_drivers = [
                truck
                for truck in trucks_with_drivers
                if truck.type == required_truck_type
            ]
            if not trucks_with_drivers:
                return None

        # Find closest truck by calculating distances
        closest_truck = None
        min_distance = float("inf")

        for truck in trucks_with_drivers:
            if truck.current_location:
                distance = self._calculate_distance_km(
                    origin_location, truck.current_location
                )
                if distance < min_distance:
                    min_distance = distance
                    closest_truck = truck

        # If no truck has location data, return first available
        return closest_truck or trucks_with_drivers[0]

    def _calculate_estimated_time(
        self, origin: Location, destination: Location
    ) -> timedelta:
        """Calculate estimated travel time for warehouse transfer"""
        distance_km = self._calculate_distance_km(origin, destination)

        # Average truck speed for warehouse transfers (slightly faster than customer deliveries)
        avg_speed_kmh = 60

        # Basic travel time
        travel_hours = distance_km / avg_speed_kmh

        # Add mandatory breaks according to legal driving hours
        mandatory_breaks_hours = 0
        if travel_hours > 4.5:
            mandatory_breaks_hours += 0.75  # 45 minutes
        if travel_hours > 9:
            mandatory_breaks_hours += 11  # Overnight rest

        # Add buffer for loading/unloading at warehouses
        buffer_hours = min(
            3, travel_hours * 0.3
        )  # 30% buffer, max 3 hours for warehouse operations

        total_hours = travel_hours + mandatory_breaks_hours + buffer_hours

        return timedelta(hours=total_hours)

    def _calculate_distance_km(self, origin: Location, destination: Location) -> float:
        """Calculate distance between two locations using Haversine formula"""
        return origin.distance_to(destination)
