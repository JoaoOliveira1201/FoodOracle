from src.product.product_repository import ProductRepository
from src.user.user_repository import UserRepository
from src.user.user_entity import UserRole


class DeleteProductUseCase:
    def __init__(
        self, product_repository: ProductRepository, user_repository: UserRepository
    ):
        self._product_repository = product_repository
        self._user_repository = user_repository

    async def execute(self, product_id: int) -> bool:
        """Delete a product"""

        # Check if product exists
        existing_product = await self._product_repository.get_by_id(product_id)
        if not existing_product:
            return False

        # Delete product
        return await self._product_repository.delete(product_id)
