from dataclasses import dataclass
from typing import Optional
from sqlalchemy import Column, Integer, String, Boolean
from src.database import Base


@dataclass
class Product:
    product_id: Optional[int]
    name: str
    base_price: Optional[int]
    discount_percentage: Optional[int]
    requires_refrigeration: bool = False
    shelf_life_days: Optional[int] = None
    deadline_to_discount: Optional[int] = None


class ProductModel(Base):
    """SQLAlchemy Product model for PostgreSQL"""

    __tablename__ = "product"

    # Columns matching the database schema
    ProductID = Column("productid", Integer, primary_key=True, autoincrement=True)
    Name = Column("name", String(100), nullable=False)
    BasePrice = Column("baseprice", Integer, nullable=True)
    DiscountPercentage = Column("discountpercentage", Integer, nullable=True)
    RequiresRefrigeration = Column("requiresrefrigeration", Boolean, default=False)
    ShelfLifeDays = Column("shelflifedays", Integer, nullable=True)
    DeadlineToDiscount = Column("deadlinetodiscount", Integer, nullable=True)

    def __repr__(self):
        return f"<ProductModel(ProductID={self.ProductID}, Name='{self.Name}', RequiresRefrigeration={self.RequiresRefrigeration})>"
