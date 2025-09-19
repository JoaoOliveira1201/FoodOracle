from typing import Optional
from src.product_record.product_record_repository import ProductRecordRepository
from src.product_record.product_record_dto import (
    UpdateProductRecordDto,
    ProductRecordResponseDto,
    product_record_to_response_dto,
)
from src.user.user_repository import UserRepository
from src.user.user_entity import UserRole
from src.warehouse.warehouse_repository import WarehouseRepository
from src.product.product_repository import ProductRepository


class UpdateProductRecordUseCase:
    def __init__(
        self,
        product_record_repository: ProductRecordRepository,
        user_repository: UserRepository,
        warehouse_repository: WarehouseRepository,
        product_repository: ProductRepository,
    ):
        self._product_record_repository = product_record_repository
        self._user_repository = user_repository
        self._warehouse_repository = warehouse_repository
        self._product_repository = product_repository

    async def execute(
        self,
        record_id: int,
        update_product_record_dto: UpdateProductRecordDto,
    ) -> Optional[ProductRecordResponseDto]:
        """Update a product record"""

        # Check if product record exists
        existing_product_record = await self._product_record_repository.get_by_id(
            record_id
        )
        if not existing_product_record:
            return None

        # Verify temperature compatibility if warehouse is being updated
        if update_product_record_dto.warehouse_id is not None:
            # Get the product to check if it requires refrigeration
            product = await self._product_repository.get_by_id(
                existing_product_record.product_id
            )
            if not product:
                raise ValueError(
                    f"Product with ID {existing_product_record.product_id} not found"
                )

            # Get the warehouse to check refrigerated capacity
            warehouse = await self._warehouse_repository.get_by_id(
                update_product_record_dto.warehouse_id
            )
            if not warehouse:
                raise ValueError(
                    f"Warehouse with ID {update_product_record_dto.warehouse_id} not found"
                )

            # Temperature compatibility validation
            if product.requires_refrigeration:
                if (
                    not warehouse.refrigerated_capacity_kg
                    or warehouse.refrigerated_capacity_kg <= 0
                ):
                    raise ValueError(
                        f"Product '{product.name}' requires refrigeration but warehouse "
                        f"(ID: {warehouse.warehouse_id}) has no refrigerated capacity. "
                        f"Refrigerated products can only be stored in warehouses with refrigerated capacity."
                    )

        # Prepare update data
        update_data = {}
        if update_product_record_dto.warehouse_id is not None:
            update_data["WarehouseID"] = update_product_record_dto.warehouse_id
        if update_product_record_dto.quantity_kg is not None:
            update_data["QuantityKg"] = update_product_record_dto.quantity_kg
        if update_product_record_dto.quality_classification is not None:
            update_data["QualityClassification"] = (
                update_product_record_dto.quality_classification.value
            )
        if update_product_record_dto.status is not None:
            update_data["Status"] = update_product_record_dto.status.value
            # Nullify warehouse assignment for sold/donated products to free warehouse space
            if update_product_record_dto.status.value in ["Sold", "Donated"]:
                update_data["WarehouseID"] = None
        if update_product_record_dto.sale_date is not None:
            update_data["SaleDate"] = update_product_record_dto.sale_date

        # Update product record
        updated_product_record = await self._product_record_repository.update(
            record_id, update_data
        )

        if not updated_product_record:
            return None

        # Get updated record with names
        result = await self._product_record_repository.get_by_id_with_names(record_id)
        if not result:
            return product_record_to_response_dto(updated_product_record)

        product_record, supplier_name, warehouse_name = result
        return product_record_to_response_dto(
            product_record, supplier_name, warehouse_name
        )
