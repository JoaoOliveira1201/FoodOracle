from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.exc import SQLAlchemyError
from src.product.product_entity import Product, ProductModel


class ProductRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, product: Product) -> Product:
        """Create a new product"""
        try:
            product_model = ProductModel(
                Name=product.name,
                BasePrice=product.base_price,
                DiscountPercentage=product.discount_percentage,
                RequiresRefrigeration=product.requires_refrigeration,
                ShelfLifeDays=product.shelf_life_days,
                DeadlineToDiscount=product.deadline_to_discount,
            )

            self.session.add(product_model)
            await self.session.flush()

            created_product = self._model_to_entity(product_model)
            return created_product

        except SQLAlchemyError as e:
            await self.session.rollback()
            raise Exception(f"Failed to create product: {str(e)}")

    async def get_by_id(self, product_id: int) -> Optional[Product]:
        """Get product by ID"""
        try:
            result = await self.session.execute(
                select(ProductModel).where(ProductModel.ProductID == product_id)
            )
            product_model = result.scalar_one_or_none()

            if not product_model:
                return None

            return self._model_to_entity(product_model)

        except SQLAlchemyError as e:
            raise Exception(f"Failed to get product by ID: {str(e)}")

    async def get_all(self) -> List[Product]:
        """Get all products"""
        try:
            result = await self.session.execute(select(ProductModel))
            product_models = result.scalars().all()

            return [self._model_to_entity(model) for model in product_models]

        except SQLAlchemyError as e:
            raise Exception(f"Failed to get all products: {str(e)}")

    async def get_by_refrigeration_requirement(
        self, requires_refrigeration: bool
    ) -> List[Product]:
        """Get products by refrigeration requirement"""
        try:
            result = await self.session.execute(
                select(ProductModel).where(
                    ProductModel.RequiresRefrigeration == requires_refrigeration
                )
            )
            product_models = result.scalars().all()

            return [self._model_to_entity(model) for model in product_models]

        except SQLAlchemyError as e:
            raise Exception(
                f"Failed to get products by refrigeration requirement: {str(e)}"
            )

    async def update(self, product_id: int, product_data: dict) -> Optional[Product]:
        """Update product by ID"""
        try:
            # Remove None values from update data
            update_data = {k: v for k, v in product_data.items() if v is not None}

            if not update_data:
                return await self.get_by_id(product_id)

            # Execute update
            await self.session.execute(
                update(ProductModel)
                .where(ProductModel.ProductID == product_id)
                .values(**update_data)
            )

            # Return updated product
            return await self.get_by_id(product_id)

        except SQLAlchemyError as e:
            await self.session.rollback()
            raise Exception(f"Failed to update product: {str(e)}")

    async def delete(self, product_id: int) -> bool:
        """Delete product by ID"""
        try:
            result = await self.session.execute(
                delete(ProductModel).where(ProductModel.ProductID == product_id)
            )

            return result.rowcount > 0

        except SQLAlchemyError as e:
            await self.session.rollback()
            raise Exception(f"Failed to delete product: {str(e)}")

    def _model_to_entity(self, product_model: ProductModel) -> Product:
        """Convert SQLAlchemy model to domain entity"""
        return Product(
            product_id=product_model.ProductID,
            name=product_model.Name,
            base_price=product_model.BasePrice,
            discount_percentage=product_model.DiscountPercentage,
            requires_refrigeration=product_model.RequiresRefrigeration,
            shelf_life_days=product_model.ShelfLifeDays,
            deadline_to_discount=product_model.DeadlineToDiscount,
        )
