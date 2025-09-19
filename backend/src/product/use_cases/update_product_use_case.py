from typing import Optional
from src.product.product_repository import ProductRepository
from src.product.product_dto import (
    UpdateProductDto,
    UpdateProductResponseDto,
    ProductResponseDto,
    product_to_response_dto,
)
from src.user.user_repository import UserRepository
from src.user.user_entity import UserRole


class UpdateProductUseCase:
    def __init__(
        self, product_repository: ProductRepository, user_repository: UserRepository
    ):
        self._product_repository = product_repository
        self._user_repository = user_repository

    async def execute(
        self, product_id: int, update_product_dto: UpdateProductDto
    ) -> Optional[ProductResponseDto]:
        """Update a product"""

        # Check if product exists
        existing_product = await self._product_repository.get_by_id(product_id)
        if not existing_product:
            return None

        # Prepare update data
        update_data = {}
        if update_product_dto.name is not None:
            update_data["Name"] = update_product_dto.name
        if update_product_dto.base_price is not None:
            update_data["BasePrice"] = update_product_dto.base_price
        if update_product_dto.discount_percentage is not None:
            update_data["DiscountPercentage"] = update_product_dto.discount_percentage
        if update_product_dto.requires_refrigeration is not None:
            update_data["RequiresRefrigeration"] = (
                update_product_dto.requires_refrigeration
            )
        if update_product_dto.shelf_life_days is not None:
            update_data["ShelfLifeDays"] = update_product_dto.shelf_life_days
        if update_product_dto.deadline_to_discount is not None:
            update_data["DeadlineToDiscount"] = update_product_dto.deadline_to_discount

        # Update product
        updated_product = await self._product_repository.update(product_id, update_data)

        if not updated_product:
            return None

        return product_to_response_dto(updated_product)
