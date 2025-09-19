from typing import List, Optional
from src.order_item.order_item_repository import OrderItemRepository
from src.order_item.order_item_dto import (
    OrderItemResponseDto,
    order_item_to_response_dto,
)


class GetOrderItemUseCase:
    def __init__(self, order_item_repository: OrderItemRepository):
        self._order_item_repository = order_item_repository

    async def execute_by_id(self, order_item_id: int) -> Optional[OrderItemResponseDto]:
        """Get order item by ID"""
        order_item = await self._order_item_repository.get_by_id(order_item_id)
        if not order_item:
            return None
        return order_item_to_response_dto(order_item)

    async def execute_all(self) -> List[OrderItemResponseDto]:
        """Get all order items"""
        order_items = await self._order_item_repository.get_all()
        return [order_item_to_response_dto(order_item) for order_item in order_items]

    async def execute_by_order_id(self, order_id: int) -> List[OrderItemResponseDto]:
        """Get order items by order ID"""
        order_items = await self._order_item_repository.get_by_order_id(order_id)
        return [order_item_to_response_dto(order_item) for order_item in order_items]

    async def execute_by_record_id(self, record_id: int) -> List[OrderItemResponseDto]:
        """Get order items by record ID"""
        order_items = await self._order_item_repository.get_by_record_id(record_id)
        return [order_item_to_response_dto(order_item) for order_item in order_items]
