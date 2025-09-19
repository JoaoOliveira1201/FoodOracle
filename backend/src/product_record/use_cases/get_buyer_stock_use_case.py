from typing import List, Optional
from datetime import datetime, timedelta
from src.product_record.product_record_repository import ProductRecordRepository
from src.product_record.product_record_dto import (
    BuyerStockResponseDto,
    BuyerStockItemDto,
)


class GetBuyerStockUseCase:
    def __init__(self, product_record_repository: ProductRecordRepository):
        self._product_record_repository = product_record_repository

    def _format_product_name(self, name: str) -> str:
        """Helper to normalize display names (strip trailing numeric noise like 'Bananas 889')"""
        import re

        return re.sub(r"\s*\d+\s*$", "", name).strip() if name else name

    async def execute(
        self, warehouse_id: Optional[int] = None
    ) -> BuyerStockResponseDto:
        """Get available stock for buyers with calculated pricing based on discount rules"""
        # Get detailed stock items with product information
        stock_records_with_products = (
            await self._product_record_repository.get_available_stock_with_products()
        )

        # Filter by warehouse if specified
        if warehouse_id:
            stock_records_with_products = [
                (record, product)
                for record, product in stock_records_with_products
                if record.WarehouseID == warehouse_id
            ]

        buyer_items = []
        current_date = datetime.utcnow()

        for product_record_model, product_model in stock_records_with_products:
            # Calculate days until expiry
            days_until_expiry = None
            if product_model.ShelfLifeDays is not None:
                if product_record_model.RegistrationDate:
                    expiry_date = product_record_model.RegistrationDate + timedelta(
                        days=product_model.ShelfLifeDays
                    )
                    days_until_expiry = (expiry_date - current_date).days
                else:
                    days_until_expiry = product_model.ShelfLifeDays

                # Ensure non-negative days
                if days_until_expiry is not None and days_until_expiry < 0:
                    days_until_expiry = 0

            # Discount rules - matches frontend logic
            is_sub_optimal = product_record_model.QualityClassification == "Sub-optimal"
            within_deadline = (
                days_until_expiry is not None
                and product_model.DeadlineToDiscount is not None
                and days_until_expiry < product_model.DeadlineToDiscount
            )
            is_discounted = is_sub_optimal or within_deadline

            # Calculate pricing
            base_price = product_model.BasePrice
            discount_percentage = product_model.DiscountPercentage or 0

            # Apply discount if conditions are met
            if base_price is not None:
                if is_discounted and discount_percentage > 0:
                    current_price = round(
                        (base_price * (100 - discount_percentage)) / 100
                    )
                else:
                    current_price = base_price
            else:
                current_price = None

            buyer_item = BuyerStockItemDto(
                record_id=product_record_model.RecordID,
                product_id=product_record_model.ProductID,
                product_name=self._format_product_name(product_model.Name),
                warehouse_id=product_record_model.WarehouseID,
                quantity_kg=product_record_model.QuantityKg,
                quality_classification=product_record_model.QualityClassification,
                original_price=base_price,
                current_price=current_price,
                discount_percentage=discount_percentage
                if is_discounted and discount_percentage > 0
                else None,
                requires_refrigeration=product_model.RequiresRefrigeration,
                days_until_expiry=days_until_expiry,
                is_discounted=is_discounted,
                image_path=product_record_model.ImagePath,
                registration_date=product_record_model.RegistrationDate,
            )
            buyer_items.append(buyer_item)

        # Sort by registration date (older products first) and then by price
        buyer_items.sort(
            key=lambda x: (
                x.registration_date
                if x.registration_date is not None
                else datetime.min,
                x.current_price if x.current_price is not None else float("inf"),
            )
        )

        # Calculate totals
        total_items = len(buyer_items)
        total_quantity_kg = sum(item.quantity_kg or 0 for item in buyer_items)

        return BuyerStockResponseDto(
            available_items=buyer_items,
            total_items=total_items,
            total_quantity_kg=total_quantity_kg,
        )

    async def execute_by_product(self, product_id: int) -> BuyerStockResponseDto:
        """Get available stock for a specific product for buyers"""
        all_stock = await self.execute()

        # Filter by product ID
        filtered_items = [
            item for item in all_stock.available_items if item.product_id == product_id
        ]

        # Calculate totals
        total_items = len(filtered_items)
        total_quantity_kg = sum(item.quantity_kg or 0 for item in filtered_items)

        return BuyerStockResponseDto(
            available_items=filtered_items,
            total_items=total_items,
            total_quantity_kg=total_quantity_kg,
        )

    async def execute_discounted_only(
        self, warehouse_id: Optional[int] = None
    ) -> BuyerStockResponseDto:
        """Get only discounted items for buyers"""
        all_stock = await self.execute(warehouse_id)

        # Filter only discounted items
        discounted_items = [
            item for item in all_stock.available_items if item.is_discounted
        ]

        # Calculate totals
        total_items = len(discounted_items)
        total_quantity_kg = sum(item.quantity_kg or 0 for item in discounted_items)

        return BuyerStockResponseDto(
            available_items=discounted_items,
            total_items=total_items,
            total_quantity_kg=total_quantity_kg,
        )
