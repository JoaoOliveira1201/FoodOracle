from pydantic import BaseModel
from typing import Optional, TYPE_CHECKING
from src.truck.truck_entity import TruckStatus, TruckType
from src.base import Location

if TYPE_CHECKING:
    from src.truck.truck_entity import Truck


class CreateTruckDto(BaseModel):
    truck_driver_id: int
    current_location: Optional[Location] = None
    status: TruckStatus
    type: TruckType
    load_capacity_kg: Optional[int] = None


class UpdateTruckStatusDto(BaseModel):
    status: TruckStatus
    current_location: Optional[Location] = None


class TruckResponseDto(BaseModel):
    truck_id: int
    truck_driver_id: Optional[int]
    current_location: Optional[Location]
    status: TruckStatus
    type: TruckType
    load_capacity_kg: Optional[int]

    class Config:
        from_attributes = True


class CreateTruckResponseDto(BaseModel):
    truck_id: int
    message: str


def truck_to_response_dto(truck: "Truck") -> TruckResponseDto:
    """Convert Truck entity to TruckResponseDto"""
    return TruckResponseDto(
        truck_id=truck.truck_id,
        truck_driver_id=truck.truck_driver_id,
        current_location=truck.current_location,
        status=truck.status,
        type=truck.type,
        load_capacity_kg=truck.load_capacity_kg,
    )
