from pydantic import BaseModel
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from src.order_item.order_item_entity import OrderItem


class CreateOrderItemDto(BaseModel):
    order_id: int
    record_id: int
    price_at_purchase: Optional[int] = None


class OrderItemResponseDto(BaseModel):
    order_item_id: int
    order_id: Optional[int]
    record_id: Optional[int]
    price_at_purchase: Optional[int]

    class Config:
        from_attributes = True


class CreateOrderItemResponseDto(BaseModel):
    order_item_id: int
    message: str


def order_item_to_response_dto(order_item: "OrderItem") -> OrderItemResponseDto:
    """Convert OrderItem entity to OrderItemResponseDto"""
    return OrderItemResponseDto(
        order_item_id=order_item.order_item_id,
        order_id=order_item.order_id,
        record_id=order_item.record_id,
        price_at_purchase=order_item.price_at_purchase,
    )
