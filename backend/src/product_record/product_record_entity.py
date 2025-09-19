from dataclasses import dataclass
from typing import Optional
from enum import Enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from src.database import Base


class QualityClassification(str, Enum):
    GOOD = "Good"
    SUB_OPTIMAL = "Sub-optimal"
    BAD = "Bad"


class ProductRecordStatus(str, Enum):
    IN_STOCK = "InStock"
    SOLD = "Sold"
    DISCARDED = "Discarded"
    DONATED = "Donated"


@dataclass
class ProductRecord:
    record_id: Optional[int]
    product_id: int
    supplier_id: Optional[int]
    warehouse_id: Optional[int]
    quantity_kg: Optional[int]
    quality_classification: Optional[QualityClassification]
    status: ProductRecordStatus
    image_path: Optional[str] = None
    registration_date: Optional[datetime] = None
    sale_date: Optional[datetime] = None

    def __post_init__(self):
        if isinstance(self.quality_classification, str):
            self.quality_classification = QualityClassification(
                self.quality_classification
            )
        if isinstance(self.status, str):
            self.status = ProductRecordStatus(self.status)

        # Validate that the status is one of the allowed values
        if self.status not in ProductRecordStatus:
            raise ValueError(
                f"Invalid status: {self.status}. Must be one of {list(ProductRecordStatus)}"
            )

        # Validate that the quality classification is one of the allowed values (if provided)
        if (
            self.quality_classification
            and self.quality_classification not in QualityClassification
        ):
            raise ValueError(
                f"Invalid quality classification: {self.quality_classification}. Must be one of {list(QualityClassification)}"
            )


class ProductRecordModel(Base):
    """SQLAlchemy ProductRecord model for PostgreSQL"""

    __tablename__ = "productrecord"

    # Columns matching the database schema
    RecordID = Column("recordid", Integer, primary_key=True, autoincrement=True)
    ProductID = Column(
        "productid", Integer, ForeignKey("product.productid"), nullable=False
    )
    SupplierID = Column("supplierid", Integer, ForeignKey("User.userid"), nullable=True)
    WarehouseID = Column(
        "warehouseid", Integer, ForeignKey("warehouse.warehouseid"), nullable=True
    )
    QuantityKg = Column("quantitykg", Integer, nullable=True)
    QualityClassification = Column("qualityclassification", String(20), nullable=True)
    Status = Column("status", String(20), nullable=False)
    ImagePath = Column("imagepath", Text, nullable=True)
    RegistrationDate = Column("registrationdate", DateTime, nullable=True)
    SaleDate = Column("saledate", DateTime, nullable=True)

    def __repr__(self):
        return f"<ProductRecordModel(RecordID={self.RecordID}, ProductID={self.ProductID}, Status='{self.Status}')>"
