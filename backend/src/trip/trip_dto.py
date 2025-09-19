from pydantic import BaseModel
from typing import Optional, TYPE_CHECKING
from datetime import datetime, timedelta
from src.trip.trip_entity import TripStatus
from src.base import Location

if TYPE_CHECKING:
    from src.trip.trip_entity import Trip


class CreateTripDto(BaseModel):
    truck_id: Optional[int] = None
    order_id: Optional[int] = None
    origin: Optional[Location] = None
    destination: Optional[Location] = None
    status: TripStatus = TripStatus.WAITING
    estimated_time: Optional[timedelta] = None
    start_date: Optional[datetime] = None


class UpdateTripDto(BaseModel):
    truck_id: Optional[int] = None
    order_id: Optional[int] = None
    origin: Optional[Location] = None
    destination: Optional[Location] = None
    status: Optional[TripStatus] = None
    estimated_time: Optional[timedelta] = None
    actual_time: Optional[timedelta] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class TripResponseDto(BaseModel):
    trip_id: int
    truck_id: Optional[int]
    order_id: Optional[int]
    origin: Optional[Location]
    destination: Optional[Location]
    status: TripStatus
    estimated_time: Optional[timedelta]
    actual_time: Optional[timedelta]
    start_date: Optional[datetime]
    end_date: Optional[datetime]

    class Config:
        from_attributes = True


class CreateTripResponseDto(BaseModel):
    trip_id: int
    message: str


def trip_to_response_dto(trip: "Trip") -> TripResponseDto:
    """Convert Trip entity to TripResponseDto"""
    return TripResponseDto(
        trip_id=trip.trip_id,
        truck_id=trip.truck_id,
        order_id=trip.order_id,
        origin=trip.origin,
        destination=trip.destination,
        status=trip.status,
        estimated_time=trip.estimated_time,
        actual_time=trip.actual_time,
        start_date=trip.start_date,
        end_date=trip.end_date,
    )
