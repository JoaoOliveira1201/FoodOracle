from pydantic import BaseModel
from typing import Optional, List, TYPE_CHECKING
from datetime import datetime
from src.order.order_entity import OrderStatus
from src.product_record.product_record_entity import QualityClassification

if TYPE_CHECKING:
    from src.order.order_entity import Order


class CreateOrderDto(BaseModel):
    buyer_id: int
    record_ids: List[int] = []  # Product record IDs to purchase
    status: OrderStatus = OrderStatus.PENDING
    total_amount: Optional[int] = None


class UpdateOrderDto(BaseModel):
    status: Optional[OrderStatus] = None
    total_amount: Optional[int] = None


class OrderedProductDto(BaseModel):
    product_name: str
    quantity: Optional[int]
    quality_classification: Optional[QualityClassification]
    price_at_purchase: Optional[int]

    class Config:
        from_attributes = True


class OrderResponseDto(BaseModel):
    order_id: int
    buyer_id: Optional[int]
    order_date: Optional[datetime]
    status: OrderStatus
    total_amount: Optional[int]
    ordered_products: List[OrderedProductDto] = []

    class Config:
        from_attributes = True


class CreateOrderResponseDto(BaseModel):
    order_id: int
    message: str


def order_to_response_dto(
    order: "Order", ordered_products: Optional[List[OrderedProductDto]] = None
) -> OrderResponseDto:
    """Convert Order entity to OrderResponseDto"""
    return OrderResponseDto(
        order_id=order.order_id,
        buyer_id=order.buyer_id,
        order_date=order.order_date,
        status=order.status,
        total_amount=order.total_amount,
        ordered_products=ordered_products or [],
    )
