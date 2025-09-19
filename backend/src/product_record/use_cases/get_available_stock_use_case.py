from typing import List
from src.product_record.product_record_repository import ProductRecordRepository
from src.product_record.product_record_dto import (
    AvailableStockResponseDto,
    AvailableStockItemDto,
    AvailableStockSummaryDto,
)


class GetAvailableStockUseCase:
    def __init__(self, product_record_repository: ProductRecordRepository):
        self._product_record_repository = product_record_repository

    async def execute(self) -> AvailableStockResponseDto:
        """Get complete available stock information"""
        # Get detailed stock items with product information
        stock_records_with_products = (
            await self._product_record_repository.get_available_stock_with_products()
        )

        # Get summary data
        summary_data = (
            await self._product_record_repository.get_available_stock_summary()
        )

        # Convert detailed items to DTOs
        detailed_items = []
        for product_record_model, product_model in stock_records_with_products:
            detailed_item = AvailableStockItemDto(
                record_id=product_record_model.RecordID,
                product_id=product_record_model.ProductID,
                product_name=product_model.Name,
                warehouse_id=product_record_model.WarehouseID,
                quantity_kg=product_record_model.QuantityKg,
                quality_classification=product_record_model.QualityClassification,
                registration_date=product_record_model.RegistrationDate,
                base_price=product_model.BasePrice,
                discount_percentage=product_model.DiscountPercentage,
                requires_refrigeration=product_model.RequiresRefrigeration,
                shelf_life_days=product_model.ShelfLifeDays,
                deadline_to_discount=product_model.DeadlineToDiscount,
            )
            detailed_items.append(detailed_item)

        # Convert summary data to DTOs
        summary = []
        for item in summary_data:
            summary_item = AvailableStockSummaryDto(
                product_id=item["product_id"],
                product_name=item["product_name"],
                total_quantity_kg=item["total_quantity_kg"],
                total_records=item["total_records"],
                base_price=item["base_price"],
                discount_percentage=item["discount_percentage"],
                requires_refrigeration=item["requires_refrigeration"],
                shelf_life_days=item["shelf_life_days"],
                deadline_to_discount=item["deadline_to_discount"],
                warehouses=item["warehouses"],
            )
            summary.append(summary_item)

        # Calculate totals
        total_products = len(summary)
        total_quantity_kg = sum(item.total_quantity_kg for item in summary)
        total_records = sum(item.total_records for item in summary)

        return AvailableStockResponseDto(
            summary=summary,
            detailed_items=detailed_items,
            total_products=total_products,
            total_quantity_kg=total_quantity_kg,
            total_records=total_records,
        )

    async def execute_by_warehouse(
        self, warehouse_id: int
    ) -> AvailableStockResponseDto:
        """Get available stock for a specific warehouse"""
        # Get all available stock first
        all_stock = await self.execute()

        # Filter by warehouse
        filtered_detailed_items = [
            item
            for item in all_stock.detailed_items
            if item.warehouse_id == warehouse_id
        ]

        # Recalculate summary for the warehouse
        product_summaries = {}
        for item in filtered_detailed_items:
            if item.product_id not in product_summaries:
                product_summaries[item.product_id] = {
                    "product_id": item.product_id,
                    "product_name": item.product_name,
                    "base_price": item.base_price,
                    "discount_percentage": item.discount_percentage,
                    "requires_refrigeration": item.requires_refrigeration,
                    "shelf_life_days": item.shelf_life_days,
                    "deadline_to_discount": item.deadline_to_discount,
                    "total_quantity_kg": 0,
                    "total_records": 0,
                    "warehouses": set(),
                }

            product_summaries[item.product_id]["total_quantity_kg"] += (
                item.quantity_kg or 0
            )
            product_summaries[item.product_id]["total_records"] += 1
            if item.warehouse_id:
                product_summaries[item.product_id]["warehouses"].add(item.warehouse_id)

        # Convert to DTOs
        summary = []
        for product_data in product_summaries.values():
            summary_item = AvailableStockSummaryDto(
                product_id=product_data["product_id"],
                product_name=product_data["product_name"],
                total_quantity_kg=product_data["total_quantity_kg"],
                total_records=product_data["total_records"],
                base_price=product_data["base_price"],
                discount_percentage=product_data["discount_percentage"],
                requires_refrigeration=product_data["requires_refrigeration"],
                shelf_life_days=product_data["shelf_life_days"],
                deadline_to_discount=product_data["deadline_to_discount"],
                warehouses=list(product_data["warehouses"]),
            )
            summary.append(summary_item)

        # Calculate totals
        total_products = len(summary)
        total_quantity_kg = sum(item.total_quantity_kg for item in summary)
        total_records = sum(item.total_records for item in summary)

        return AvailableStockResponseDto(
            summary=summary,
            detailed_items=filtered_detailed_items,
            total_products=total_products,
            total_quantity_kg=total_quantity_kg,
            total_records=total_records,
        )
