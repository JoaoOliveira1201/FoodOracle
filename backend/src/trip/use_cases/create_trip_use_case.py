from datetime import datetime
from src.trip.trip_entity import Trip, TripStatus
from src.trip.trip_repository import TripRepository
from src.trip.trip_dto import CreateTripDto, CreateTripResponseDto


class CreateTripUseCase:
    def __init__(self, trip_repository: TripRepository):
        self._trip_repository = trip_repository

    async def execute(self, create_trip_dto: CreateTripDto) -> CreateTripResponseDto:
        """Create a new trip"""
        trip = Trip(
            trip_id=None,
            truck_id=create_trip_dto.truck_id,
            order_id=create_trip_dto.order_id,
            origin=create_trip_dto.origin,
            destination=create_trip_dto.destination,
            status=create_trip_dto.status,
            estimated_time=create_trip_dto.estimated_time,
            actual_time=None,
            start_date=create_trip_dto.start_date,
            end_date=None,
        )

        created_trip = await self._trip_repository.create(trip)

        return CreateTripResponseDto(
            trip_id=created_trip.trip_id, message="Trip created successfully"
        )
