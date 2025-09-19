from typing import List, Optional
from src.order.order_repository import OrderRepository
from src.order.order_entity import OrderStatus
from src.order.order_dto import (
    OrderResponseDto,
    OrderedProductDto,
    order_to_response_dto,
)
from src.product_record.product_record_entity import QualityClassification


class GetOrderUseCase:
    def __init__(self, order_repository: OrderRepository):
        self._order_repository = order_repository

    async def execute_by_id(self, order_id: int) -> Optional[OrderResponseDto]:
        """Get order by ID with ordered products"""
        result = await self._order_repository.get_order_with_products(order_id)
        if not result:
            return None

        order, product_data = result
        ordered_products = self._convert_products_to_dto(product_data)

        return order_to_response_dto(order, ordered_products)

    def _convert_products_to_dto(
        self, product_data: List[dict]
    ) -> List[OrderedProductDto]:
        """Helper method to convert product data to OrderedProductDto list"""
        ordered_products = []
        for product_info in product_data:
            quality_classification = None
            if product_info["quality_classification"]:
                try:
                    quality_classification = QualityClassification(
                        product_info["quality_classification"]
                    )
                except ValueError:
                    quality_classification = None

            ordered_product = OrderedProductDto(
                product_name=product_info["product_name"],
                quantity=product_info["quantity"],
                quality_classification=quality_classification,
                price_at_purchase=product_info["price_at_purchase"],
            )
            ordered_products.append(ordered_product)
        return ordered_products

    async def execute_all(self) -> List[OrderResponseDto]:
        """Get all orders with their products"""
        orders = await self._order_repository.get_all()
        if not orders:
            return []

        # Get order IDs and fetch with products
        order_ids = [order.order_id for order in orders]
        orders_with_products = await self._order_repository.get_orders_with_products(
            order_ids
        )

        # Convert to response DTOs
        result = []
        for order, product_data in orders_with_products:
            ordered_products = self._convert_products_to_dto(product_data)
            result.append(order_to_response_dto(order, ordered_products))

        return result

    async def execute_by_buyer_id(self, buyer_id: int) -> List[OrderResponseDto]:
        """Get orders by buyer ID with their products"""
        orders = await self._order_repository.get_by_buyer_id(buyer_id)
        if not orders:
            return []

        # Get order IDs and fetch with products
        order_ids = [order.order_id for order in orders]
        orders_with_products = await self._order_repository.get_orders_with_products(
            order_ids
        )

        # Convert to response DTOs
        result = []
        for order, product_data in orders_with_products:
            ordered_products = self._convert_products_to_dto(product_data)
            result.append(order_to_response_dto(order, ordered_products))

        return result

    async def execute_by_status(self, status: OrderStatus) -> List[OrderResponseDto]:
        """Get orders by status with their products"""
        orders = await self._order_repository.get_by_status(status)
        if not orders:
            return []

        # Get order IDs and fetch with products
        order_ids = [order.order_id for order in orders]
        orders_with_products = await self._order_repository.get_orders_with_products(
            order_ids
        )

        # Convert to response DTOs
        result = []
        for order, product_data in orders_with_products:
            ordered_products = self._convert_products_to_dto(product_data)
            result.append(order_to_response_dto(order, ordered_products))

        return result
