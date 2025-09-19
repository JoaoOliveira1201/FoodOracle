from datetime import datetime
from src.order_item.order_item_entity import OrderItem
from src.order_item.order_item_repository import OrderItemRepository
from src.order_item.order_item_dto import CreateOrderItemDto, CreateOrderItemResponseDto
from src.product_record.product_record_repository import ProductRecordRepository
from src.product_record.product_record_entity import ProductRecordStatus


class CreateOrderItemUseCase:
    def __init__(
        self,
        order_item_repository: OrderItemRepository,
        product_record_repository: ProductRecordRepository,
    ):
        self._order_item_repository = order_item_repository
        self._product_record_repository = product_record_repository

    async def execute(
        self, create_order_item_dto: CreateOrderItemDto
    ) -> CreateOrderItemResponseDto:
        """Create a new order item and mark the associated product record as sold"""
        # Create the order item
        order_item = OrderItem(
            order_item_id=None,
            order_id=create_order_item_dto.order_id,
            record_id=create_order_item_dto.record_id,
            price_at_purchase=create_order_item_dto.price_at_purchase,
        )

        created_order_item = await self._order_item_repository.create(order_item)

        # Update the associated product record status to "Sold" and set sale date
        if create_order_item_dto.record_id:
            update_data = {
                "Status": ProductRecordStatus.SOLD.value,
                "SaleDate": datetime.utcnow(),
            }
            await self._product_record_repository.update(
                create_order_item_dto.record_id, update_data
            )

        return CreateOrderItemResponseDto(
            order_item_id=created_order_item.order_item_id,
            message="Order item created successfully and product record marked as sold",
        )
