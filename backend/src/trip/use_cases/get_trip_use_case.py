from typing import List, Optional
from src.trip.trip_repository import TripRepository
from src.trip.trip_entity import TripStatus
from src.trip.trip_dto import TripResponseDto, trip_to_response_dto


class GetTripUseCase:
    def __init__(self, trip_repository: TripRepository):
        self._trip_repository = trip_repository

    async def execute_by_id(self, trip_id: int) -> Optional[TripResponseDto]:
        """Get trip by ID"""
        trip = await self._trip_repository.get_by_id(trip_id)
        if not trip:
            return None
        return trip_to_response_dto(trip)

    async def execute_all(self) -> List[TripResponseDto]:
        """Get all trips"""
        trips = await self._trip_repository.get_all()
        return [trip_to_response_dto(trip) for trip in trips]

    async def execute_by_truck_id(self, truck_id: int) -> List[TripResponseDto]:
        """Get trips by truck ID"""
        trips = await self._trip_repository.get_by_truck_id(truck_id)
        return [trip_to_response_dto(trip) for trip in trips]

    async def execute_by_order_id(self, order_id: int) -> List[TripResponseDto]:
        """Get trips by order ID"""
        trips = await self._trip_repository.get_by_order_id(order_id)
        return [trip_to_response_dto(trip) for trip in trips]

    async def execute_by_status(self, status: TripStatus) -> List[TripResponseDto]:
        """Get trips by status"""
        trips = await self._trip_repository.get_by_status(status)
        return [trip_to_response_dto(trip) for trip in trips]
