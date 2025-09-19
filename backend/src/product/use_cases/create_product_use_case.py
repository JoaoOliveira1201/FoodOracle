from src.product.product_entity import Product
from src.product.product_repository import ProductRepository
from src.product.product_dto import CreateProductDto, CreateProductResponseDto
from src.user.user_repository import UserRepository
from src.user.user_entity import UserRole


class CreateProductUseCase:
    def __init__(
        self, product_repository: ProductRepository, user_repository: UserRepository
    ):
        self._product_repository = product_repository
        self._user_repository = user_repository

    async def execute(
        self, create_product_dto: CreateProductDto
    ) -> CreateProductResponseDto:
        """Create a new product"""

        product = Product(
            product_id=None,
            name=create_product_dto.name,
            base_price=create_product_dto.base_price,
            discount_percentage=create_product_dto.discount_percentage,
            requires_refrigeration=create_product_dto.requires_refrigeration,
            shelf_life_days=create_product_dto.shelf_life_days,
            deadline_to_discount=create_product_dto.deadline_to_discount,
        )

        created_product = await self._product_repository.create(product)

        return CreateProductResponseDto(
            product_id=created_product.product_id,
            message="Product created successfully",
        )
