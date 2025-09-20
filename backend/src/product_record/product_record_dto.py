from pydantic import BaseModel
from typing import Optional, TYPE_CHECKING, List
from datetime import datetime
from src.product_record.product_record_entity import (
    QualityClassification,
    ProductRecordStatus,
)

if TYPE_CHECKING:
    from src.product_record.product_record_entity import ProductRecord


class CreateProductRecordDto(BaseModel):
    product_id: int
    warehouse_id: Optional[int] = None
    quantity_kg: Optional[int] = None
    quality_classification: Optional[QualityClassification] = None
    status: ProductRecordStatus = ProductRecordStatus.IN_STOCK


class UpdateProductRecordDto(BaseModel):
    warehouse_id: Optional[int] = None
    quantity_kg: Optional[int] = None
    quality_classification: Optional[QualityClassification] = None
    status: Optional[ProductRecordStatus] = None
    sale_date: Optional[datetime] = None


class ProductRecordResponseDto(BaseModel):
    record_id: int
    product_id: int
    supplier_id: Optional[int]
    supplier_name: Optional[str]
    warehouse_id: Optional[int]
    warehouse_name: Optional[str]
    quantity_kg: Optional[int]
    quality_classification: Optional[QualityClassification]
    status: ProductRecordStatus
    image_path: Optional[str]
    registration_date: Optional[datetime]
    sale_date: Optional[datetime]

    class Config:
        from_attributes = True


class CreateProductRecordResponseDto(BaseModel):
    record_id: int
    message: str


class AvailableStockItemDto(BaseModel):
    """Individual stock item with product details"""

    record_id: int
    product_id: int
    product_name: str
    warehouse_id: Optional[int]
    quantity_kg: Optional[int]
    quality_classification: Optional[QualityClassification]
    image_path: Optional[str]
    registration_date: Optional[datetime]
    base_price: Optional[int]
    discount_percentage: Optional[int]
    requires_refrigeration: bool
    shelf_life_days: Optional[int]
    deadline_to_discount: Optional[int]

    class Config:
        from_attributes = True


class AvailableStockSummaryDto(BaseModel):
    """Summary of available stock by product"""

    product_id: int
    product_name: str
    total_quantity_kg: int
    total_records: int
    base_price: Optional[int]
    discount_percentage: Optional[int]
    requires_refrigeration: bool
    shelf_life_days: Optional[int]
    deadline_to_discount: Optional[int]
    warehouses: List[int]  # List of warehouse IDs where this product is available

    class Config:
        from_attributes = True


class AvailableStockResponseDto(BaseModel):
    """Complete available stock response"""

    summary: List[AvailableStockSummaryDto]
    detailed_items: List[AvailableStockItemDto]
    total_products: int
    total_quantity_kg: int
    total_records: int

    class Config:
        from_attributes = True


class BuyerStockItemDto(BaseModel):
    """Stock item for buyers with calculated prices and relevant info only"""

    record_id: int
    product_id: int
    product_name: str
    warehouse_id: Optional[int]
    quantity_kg: Optional[int]
    quality_classification: Optional[QualityClassification]
    original_price: Optional[int]  # Base price before any discounts
    current_price: Optional[int]  # Price after applying discounts
    discount_percentage: Optional[int]  # Applied discount percentage
    requires_refrigeration: bool
    days_until_expiry: Optional[int]  # Days remaining before expiry
    is_discounted: bool  # Whether discount has been applied due to age
    image_path: Optional[str]
    registration_date: Optional[datetime]

    class Config:
        from_attributes = True


class BuyerStockResponseDto(BaseModel):
    """Stock response for buyers"""

    available_items: List[BuyerStockItemDto]
    total_items: int
    total_quantity_kg: int

    class Config:
        from_attributes = True


class ProductMetricsDto(BaseModel):
    """Comprehensive metrics for a product"""

    total_in_stock_kg: int
    total_sold_kg: int
    total_discarded_kg: int
    total_donated_kg: int
    total_records: int
    total_profit: float
    average_days_to_sell: float
    quality_distribution: dict  # {"Good": count, "Sub-optimal": count, "Bad": count}
    revenue_by_status: dict  # {"InStock": revenue, "Sold": revenue, "Discarded": revenue, "Donated": revenue}
    inventory_turnover_rate: float  # percentage
    loss_percentage: float  # percentage
    base_price: int
    discount_percentage: int

    class Config:
        from_attributes = True


class SupplierStatisticsDto(BaseModel):
    """Comprehensive statistics for a supplier"""

    total_products_registered: int
    total_quantity_kg: int
    total_records: int
    quality_distribution: dict  # {"Good": count, "Sub-optimal": count, "Bad": count}
    quality_percentages: (
        dict  # {"Good": percentage, "Sub-optimal": percentage, "Bad": percentage}
    )
    status_distribution: (
        dict  # {"InStock": count, "Sold": count, "Discarded": count, "Donated": count}
    )
    status_percentages: dict  # {"InStock": percentage, "Sold": percentage, "Discarded": percentage, "Donated": percentage}
    average_quality_score: float  # 1-3 scale
    total_revenue_generated: float
    average_days_to_sell: float
    performance_rating: str  # "Excellent", "Good", "Average", "Below Average", "Poor"
    products_list: list  # List of product names
    supplier_tier: str  # "Platinum", "Gold", "Silver", "Bronze", "Basic"
    tier_score: float  # Overall calculated score (0-100)
    tier_breakdown: dict  # Breakdown by component for transparency

    class Config:
        from_attributes = True


def product_record_to_response_dto(
    product_record: "ProductRecord",
    supplier_name: Optional[str] = None,
    warehouse_name: Optional[str] = None,
) -> ProductRecordResponseDto:
    """Convert ProductRecord entity to ProductRecordResponseDto"""
    return ProductRecordResponseDto(
        record_id=product_record.record_id,
        product_id=product_record.product_id,
        supplier_id=product_record.supplier_id,
        supplier_name=supplier_name,
        warehouse_id=product_record.warehouse_id,
        warehouse_name=warehouse_name,
        quantity_kg=product_record.quantity_kg,
        quality_classification=product_record.quality_classification,
        status=product_record.status,
        image_path=product_record.image_path,
        registration_date=product_record.registration_date,
        sale_date=product_record.sale_date,
    )
