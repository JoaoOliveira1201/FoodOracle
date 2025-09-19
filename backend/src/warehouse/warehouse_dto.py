from pydantic import BaseModel
from typing import Optional, List, TYPE_CHECKING
from src.base import Location
from datetime import datetime
from src.product_record.product_record_entity import (
    QualityClassification,
    ProductRecordStatus,
)

if TYPE_CHECKING:
    from src.warehouse.warehouse_entity import Warehouse


class ProductInStorageDto(BaseModel):
    record_id: int
    product_id: int
    product_name: str
    quantity_kg: Optional[int]
    quality_classification: Optional[QualityClassification]
    status: ProductRecordStatus
    registration_date: Optional[datetime]
    requires_refrigeration: bool
    base_price: Optional[int]
    shelf_life_days: Optional[int]
    deadline_to_discount: Optional[int]

    class Config:
        from_attributes = True


class CreateWarehouseDto(BaseModel):
    name: str
    location: Location
    normal_capacity_kg: Optional[int] = None
    refrigerated_capacity_kg: Optional[int] = None


class WarehouseResponseDto(BaseModel):
    warehouse_id: int
    name: str
    location: Location
    normal_capacity_kg: Optional[int]
    refrigerated_capacity_kg: Optional[int]
    products_in_storage: List[ProductInStorageDto] = []

    class Config:
        from_attributes = True


class CreateWarehouseResponseDto(BaseModel):
    warehouse_id: int
    message: str


def warehouse_to_response_dto(warehouse: "Warehouse") -> WarehouseResponseDto:
    """Convert Warehouse entity to WarehouseResponseDto"""
    return WarehouseResponseDto(
        warehouse_id=warehouse.warehouse_id,
        name=warehouse.name,
        location=warehouse.location,
        normal_capacity_kg=warehouse.normal_capacity_kg,
        refrigerated_capacity_kg=warehouse.refrigerated_capacity_kg,
    )
