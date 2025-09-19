from typing import List, Optional
from src.product.product_repository import ProductRepository
from src.product.product_dto import ProductResponseDto, product_to_response_dto


class GetProductUseCase:
    def __init__(self, product_repository: ProductRepository):
        self._product_repository = product_repository

    async def execute_by_id(self, product_id: int) -> Optional[ProductResponseDto]:
        """Get product by ID"""
        product = await self._product_repository.get_by_id(product_id)
        if not product:
            return None
        return product_to_response_dto(product)

    async def execute_all(self) -> List[ProductResponseDto]:
        """Get all products"""
        products = await self._product_repository.get_all()
        return [product_to_response_dto(product) for product in products]

    async def execute_by_refrigeration_requirement(
        self, requires_refrigeration: bool
    ) -> List[ProductResponseDto]:
        """Get products by refrigeration requirement"""
        products = await self._product_repository.get_by_refrigeration_requirement(
            requires_refrigeration
        )
        return [product_to_response_dto(product) for product in products]
