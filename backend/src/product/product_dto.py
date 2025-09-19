from pydantic import BaseModel
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from src.product.product_entity import Product


class CreateProductDto(BaseModel):
    name: str
    base_price: Optional[int] = None
    discount_percentage: Optional[int] = None
    requires_refrigeration: bool = False
    shelf_life_days: Optional[int] = None
    deadline_to_discount: Optional[int] = None


class UpdateProductDto(BaseModel):
    name: Optional[str] = None
    base_price: Optional[int] = None
    discount_percentage: Optional[int] = None
    requires_refrigeration: Optional[bool] = None
    shelf_life_days: Optional[int] = None
    deadline_to_discount: Optional[int] = None


class ProductResponseDto(BaseModel):
    product_id: int
    name: str
    base_price: Optional[int]
    discount_percentage: Optional[int]
    requires_refrigeration: bool
    shelf_life_days: Optional[int]
    deadline_to_discount: Optional[int]

    class Config:
        from_attributes = True


class CreateProductResponseDto(BaseModel):
    product_id: int
    message: str


class UpdateProductResponseDto(BaseModel):
    product_id: int
    message: str


def product_to_response_dto(product: "Product") -> ProductResponseDto:
    """Convert Product entity to ProductResponseDto"""
    return ProductResponseDto(
        product_id=product.product_id,
        name=product.name,
        base_price=product.base_price,
        discount_percentage=product.discount_percentage,
        requires_refrigeration=product.requires_refrigeration,
        shelf_life_days=product.shelf_life_days,
        deadline_to_discount=product.deadline_to_discount,
    )
