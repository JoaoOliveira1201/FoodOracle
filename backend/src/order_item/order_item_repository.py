from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from src.order_item.order_item_entity import OrderItem, OrderItemModel


class OrderItemRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    # --------------------------------------------------------------------------------------------------------------------------------------------------
    # --------------------------------------------------------------------------------------------------------------------------------------------------
    # --------------------------------------------------------------------------------------------------------------------------------------------------

    async def create(self, order_item: OrderItem) -> OrderItem:
        """Create a new order item"""
        try:
            order_item_model = OrderItemModel(
                OrderID=order_item.order_id,
                RecordID=order_item.record_id,
                PriceAtPurchase=order_item.price_at_purchase,
            )

            self.session.add(order_item_model)
            await self.session.flush()

            created_order_item = self._model_to_entity(order_item_model)
            return created_order_item

        except SQLAlchemyError as e:
            await self.session.rollback()
            raise Exception(f"Failed to create order item: {str(e)}")

    # --------------------------------------------------------------------------------------------------------------------------------------------------

    async def get_by_id(self, order_item_id: int) -> Optional[OrderItem]:
        """Get order item by ID"""
        try:
            stmt = select(OrderItemModel).where(
                OrderItemModel.OrderItemID == order_item_id
            )
            result = await self.session.execute(stmt)
            order_item_model = result.scalar_one_or_none()

            if order_item_model is None:
                return None

            return self._model_to_entity(order_item_model)

        except SQLAlchemyError as e:
            raise Exception(f"Failed to get order item by ID: {str(e)}")

    # --------------------------------------------------------------------------------------------------------------------------------------------------

    async def get_all(self) -> List[OrderItem]:
        """Get all order items"""
        try:
            stmt = select(OrderItemModel)
            result = await self.session.execute(stmt)
            order_item_models = result.scalars().all()

            return [self._model_to_entity(model) for model in order_item_models]

        except SQLAlchemyError as e:
            raise Exception(f"Failed to get all order items: {str(e)}")

    # --------------------------------------------------------------------------------------------------------------------------------------------------

    async def get_by_order_id(self, order_id: int) -> List[OrderItem]:
        """Get order items by order ID"""
        try:
            stmt = select(OrderItemModel).where(OrderItemModel.OrderID == order_id)
            result = await self.session.execute(stmt)
            order_item_models = result.scalars().all()

            return [self._model_to_entity(model) for model in order_item_models]

        except SQLAlchemyError as e:
            raise Exception(f"Failed to get order items by order ID: {str(e)}")

    # --------------------------------------------------------------------------------------------------------------------------------------------------

    async def get_by_record_id(self, record_id: int) -> List[OrderItem]:
        """Get order items by record ID"""
        try:
            stmt = select(OrderItemModel).where(OrderItemModel.RecordID == record_id)
            result = await self.session.execute(stmt)
            order_item_models = result.scalars().all()

            return [self._model_to_entity(model) for model in order_item_models]

        except SQLAlchemyError as e:
            raise Exception(f"Failed to get order items by record ID: {str(e)}")

    # --------------------------------------------------------------------------------------------------------------------------------------------------
    # Helper Methods
    # --------------------------------------------------------------------------------------------------------------------------------------------------

    def _model_to_entity(self, model: OrderItemModel) -> OrderItem:
        """Convert OrderItemModel to OrderItem entity"""
        return OrderItem(
            order_item_id=model.OrderItemID,
            order_id=model.OrderID,
            record_id=model.RecordID,
            price_at_purchase=model.PriceAtPurchase,
        )
