from typing import Optional
from src.order.order_entity import Order
from src.order.order_repository import OrderRepository
from src.order.order_dto import UpdateOrderDto, OrderResponseDto, order_to_response_dto


class UpdateOrderUseCase:
    def __init__(self, order_repository: OrderRepository):
        self._order_repository = order_repository

    async def execute(
        self, order_id: int, update_order_dto: UpdateOrderDto
    ) -> Optional[OrderResponseDto]:
        """Update an existing order"""
        # First, get the existing order
        existing_order = await self._order_repository.get_by_id(order_id)
        if not existing_order:
            return None

        # Create updated order with new values or keep existing ones
        updated_order = Order(
            order_id=existing_order.order_id,
            buyer_id=existing_order.buyer_id,
            order_date=existing_order.order_date,
            status=update_order_dto.status or existing_order.status,
            total_amount=update_order_dto.total_amount
            if update_order_dto.total_amount is not None
            else existing_order.total_amount,
        )

        # Update the order
        result = await self._order_repository.update(order_id, updated_order)
        if not result:
            return None

        return order_to_response_dto(result)
