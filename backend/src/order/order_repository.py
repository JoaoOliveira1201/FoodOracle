from typing import List, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import selectinload, joinedload
from src.order.order_entity import Order, OrderStatus, OrderModel
from src.order_item.order_item_entity import OrderItemModel
from src.product_record.product_record_entity import ProductRecordModel
from src.product.product_entity import ProductModel


class OrderRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    # --------------------------------------------------------------------------------------------------------------------------------------------------
    # --------------------------------------------------------------------------------------------------------------------------------------------------
    # --------------------------------------------------------------------------------------------------------------------------------------------------

    async def create(self, order: Order) -> Order:
        """Create a new order"""
        try:
            order_model = OrderModel(
                BuyerID=order.buyer_id,
                OrderDate=order.order_date or datetime.utcnow(),
                Status=order.status.value,
                TotalAmount=order.total_amount,
            )

            self.session.add(order_model)
            await self.session.flush()

            created_order = self._model_to_entity(order_model)
            return created_order

        except SQLAlchemyError as e:
            await self.session.rollback()
            raise Exception(f"Failed to create order: {str(e)}")

    # --------------------------------------------------------------------------------------------------------------------------------------------------

    async def get_by_id(self, order_id: int) -> Optional[Order]:
        """Get order by ID"""
        try:
            stmt = select(OrderModel).where(OrderModel.OrderID == order_id)
            result = await self.session.execute(stmt)
            order_model = result.scalar_one_or_none()

            if order_model is None:
                return None

            return self._model_to_entity(order_model)

        except SQLAlchemyError as e:
            raise Exception(f"Failed to get order by ID: {str(e)}")

    # --------------------------------------------------------------------------------------------------------------------------------------------------

    async def get_all(self) -> List[Order]:
        """Get all orders"""
        try:
            stmt = select(OrderModel)
            result = await self.session.execute(stmt)
            order_models = result.scalars().all()

            return [self._model_to_entity(model) for model in order_models]

        except SQLAlchemyError as e:
            raise Exception(f"Failed to get all orders: {str(e)}")

    # --------------------------------------------------------------------------------------------------------------------------------------------------

    async def get_by_buyer_id(self, buyer_id: int) -> List[Order]:
        """Get orders by buyer ID"""
        try:
            stmt = select(OrderModel).where(OrderModel.BuyerID == buyer_id)
            result = await self.session.execute(stmt)
            order_models = result.scalars().all()

            return [self._model_to_entity(model) for model in order_models]

        except SQLAlchemyError as e:
            raise Exception(f"Failed to get orders by buyer ID: {str(e)}")

    # --------------------------------------------------------------------------------------------------------------------------------------------------

    async def get_by_status(self, status: OrderStatus) -> List[Order]:
        """Get orders by status"""
        try:
            stmt = select(OrderModel).where(OrderModel.Status == status.value)
            result = await self.session.execute(stmt)
            order_models = result.scalars().all()

            return [self._model_to_entity(model) for model in order_models]

        except SQLAlchemyError as e:
            raise Exception(f"Failed to get orders by status: {str(e)}")

    # --------------------------------------------------------------------------------------------------------------------------------------------------

    async def update(self, order_id: int, order: Order) -> Optional[Order]:
        """Update an existing order"""
        try:
            stmt = (
                update(OrderModel)
                .where(OrderModel.OrderID == order_id)
                .values(
                    Status=order.status.value,
                    TotalAmount=order.total_amount,
                )
                .returning(OrderModel)
            )

            result = await self.session.execute(stmt)
            updated_model = result.scalar_one_or_none()

            if updated_model is None:
                return None

            return self._model_to_entity(updated_model)

        except SQLAlchemyError as e:
            await self.session.rollback()
            raise Exception(f"Failed to update order: {str(e)}")

    # --------------------------------------------------------------------------------------------------------------------------------------------------
    # Helper Methods
    # --------------------------------------------------------------------------------------------------------------------------------------------------

    async def get_order_with_products(
        self, order_id: int
    ) -> Optional[tuple[Order, List[dict]]]:
        """Get order by ID with its related products information"""
        try:
            # Query to get order with order items, product records, and products
            stmt = (
                select(OrderModel, OrderItemModel, ProductRecordModel, ProductModel)
                .outerjoin(OrderItemModel, OrderModel.OrderID == OrderItemModel.OrderID)
                .outerjoin(
                    ProductRecordModel,
                    OrderItemModel.RecordID == ProductRecordModel.RecordID,
                )
                .outerjoin(
                    ProductModel, ProductRecordModel.ProductID == ProductModel.ProductID
                )
                .where(OrderModel.OrderID == order_id)
            )

            result = await self.session.execute(stmt)
            rows = result.fetchall()

            if not rows:
                return None

            # Extract order from first row
            order_model = rows[0][0] if rows[0][0] else None
            if not order_model:
                return None

            order = self._model_to_entity(order_model)

            # Extract product information
            ordered_products = []
            for row in rows:
                order_item_model, product_record_model, product_model = (
                    row[1],
                    row[2],
                    row[3],
                )

                # Skip if no order item (order with no items)
                if not order_item_model:
                    continue

                product_info = {
                    "product_name": product_model.Name
                    if product_model
                    else "Unknown Product",
                    "quantity": product_record_model.QuantityKg
                    if product_record_model
                    else None,
                    "quality_classification": product_record_model.QualityClassification
                    if product_record_model
                    else None,
                    "price_at_purchase": order_item_model.PriceAtPurchase
                    if order_item_model
                    else None,
                }
                ordered_products.append(product_info)

            return order, ordered_products

        except SQLAlchemyError as e:
            raise Exception(f"Failed to get order with products: {str(e)}")

    async def get_orders_with_products(
        self, order_ids: List[int]
    ) -> List[tuple[Order, List[dict]]]:
        """Get multiple orders by IDs with their related products information"""
        try:
            if not order_ids:
                return []

            # Query to get orders with order items, product records, and products
            stmt = (
                select(OrderModel, OrderItemModel, ProductRecordModel, ProductModel)
                .outerjoin(OrderItemModel, OrderModel.OrderID == OrderItemModel.OrderID)
                .outerjoin(
                    ProductRecordModel,
                    OrderItemModel.RecordID == ProductRecordModel.RecordID,
                )
                .outerjoin(
                    ProductModel, ProductRecordModel.ProductID == ProductModel.ProductID
                )
                .where(OrderModel.OrderID.in_(order_ids))
                .order_by(OrderModel.OrderID)
            )

            result = await self.session.execute(stmt)
            rows = result.fetchall()

            # Group results by order ID
            orders_dict = {}
            for row in rows:
                order_model, order_item_model, product_record_model, product_model = row

                if not order_model:
                    continue

                order_id = order_model.OrderID
                if order_id not in orders_dict:
                    orders_dict[order_id] = {
                        "order": self._model_to_entity(order_model),
                        "products": [],
                    }

                # Add product info if order item exists
                if order_item_model:
                    product_info = {
                        "product_name": product_model.Name
                        if product_model
                        else "Unknown Product",
                        "quantity": product_record_model.QuantityKg
                        if product_record_model
                        else None,
                        "quality_classification": product_record_model.QualityClassification
                        if product_record_model
                        else None,
                        "price_at_purchase": order_item_model.PriceAtPurchase
                        if order_item_model
                        else None,
                    }
                    orders_dict[order_id]["products"].append(product_info)

            return [(data["order"], data["products"]) for data in orders_dict.values()]

        except SQLAlchemyError as e:
            raise Exception(f"Failed to get orders with products: {str(e)}")

    def _model_to_entity(self, model: OrderModel) -> Order:
        """Convert OrderModel to Order entity"""
        return Order(
            order_id=model.OrderID,
            buyer_id=model.BuyerID,
            order_date=model.OrderDate,
            status=OrderStatus(model.Status),
            total_amount=model.TotalAmount,
        )
