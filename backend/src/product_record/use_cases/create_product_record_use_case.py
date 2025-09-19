from datetime import datetime
from typing import Optional
from fastapi import UploadFile
from src.product_record.product_record_entity import ProductRecord, ProductRecordStatus
from src.product_record.product_record_repository import ProductRecordRepository
from src.product_record.product_record_dto import (
    CreateProductRecordDto,
    CreateProductRecordResponseDto,
)
from src.base.minio_service import MinioService, FileType
from src.user.user_repository import UserRepository
from src.user.user_entity import UserRole
from src.product.product_repository import ProductRepository
from src.warehouse.warehouse_repository import WarehouseRepository


class CreateProductRecordUseCase:
    def __init__(
        self,
        product_record_repository: ProductRecordRepository,
        user_repository: UserRepository,
        product_repository: ProductRepository,
        warehouse_repository: WarehouseRepository,
        minio_service: MinioService,
    ):
        self._product_record_repository = product_record_repository
        self._user_repository = user_repository
        self._product_repository = product_repository
        self._warehouse_repository = warehouse_repository
        self._minio_service = minio_service

    async def execute(
        self,
        create_product_record_dto: CreateProductRecordDto,
        supplier_user_id: int,
        image_file: Optional[UploadFile] = None,
    ) -> CreateProductRecordResponseDto:
        """Create a new product record with optional image"""

        # File validation is handled by MinioService with FileType.IMAGE

        # Get the user
        supplier_user = await self._user_repository.get_by_id(supplier_user_id)
        if not supplier_user:
            raise ValueError(f"User with ID {supplier_user_id} not found")

        # Verify that the product exists
        product = await self._product_repository.get_by_id(
            create_product_record_dto.product_id
        )
        if not product:
            raise ValueError(
                f"Product with ID {create_product_record_dto.product_id} not found"
            )

        # Determine warehouse assignment
        assigned_warehouse_id = create_product_record_dto.warehouse_id

        if assigned_warehouse_id is None:
            # Auto-assign to nearest suitable warehouse
            if not supplier_user.location:
                raise ValueError(
                    "Supplier location is required for automatic warehouse assignment. "
                    "Please either provide a warehouse_id or ensure the supplier has a location."
                )

            # Find nearest suitable warehouse
            suitable_warehouse = (
                await self._warehouse_repository.find_nearest_suitable_warehouse(
                    supplier_user.location,
                    product.requires_refrigeration,
                    create_product_record_dto.quantity_kg or 0,
                )
            )

            if not suitable_warehouse:
                raise ValueError(
                    f"No suitable warehouse found for product '{product.name}'. "
                    f"Requirements: refrigeration={product.requires_refrigeration}, "
                    f"quantity={create_product_record_dto.quantity_kg}kg. "
                    f"Please specify a warehouse_id manually."
                )

            assigned_warehouse_id = suitable_warehouse.warehouse_id
        else:
            # Verify specified warehouse exists and is compatible
            warehouse = await self._warehouse_repository.get_by_id(
                assigned_warehouse_id
            )
            if not warehouse:
                raise ValueError(f"Warehouse with ID {assigned_warehouse_id} not found")

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

        # Determine status based on quality classification
        # If quality is "Bad", automatically set status to "Discarded"
        final_status = create_product_record_dto.status
        if (
            create_product_record_dto.quality_classification
            and create_product_record_dto.quality_classification.value == "Bad"
        ):
            final_status = ProductRecordStatus.DISCARDED

        # First create the product record without image
        product_record = ProductRecord(
            record_id=None,
            product_id=create_product_record_dto.product_id,
            supplier_id=supplier_user_id,
            warehouse_id=assigned_warehouse_id,
            quantity_kg=create_product_record_dto.quantity_kg,
            quality_classification=create_product_record_dto.quality_classification,
            status=final_status,
            image_path=None,
            registration_date=datetime.utcnow(),
            sale_date=None,
        )

        created_product_record = await self._product_record_repository.create(
            product_record
        )

        # Upload image if provided and update product record
        if image_file and image_file.size and image_file.size > 0:
            try:
                image_path = await self._minio_service.upload_file(
                    image_file,
                    f"product_record_{created_product_record.record_id}",
                    FileType.IMAGE,
                )
                # Update product record with image path
                await self._product_record_repository.update(
                    created_product_record.record_id, {"ImagePath": image_path}
                )
                created_product_record.image_path = image_path
            except Exception as e:
                # If image upload fails, delete the created product record to maintain consistency
                await self._product_record_repository.delete(
                    created_product_record.record_id
                )
                raise Exception(f"Failed to upload image: {str(e)}")

        # Create appropriate success message based on final status
        base_message = "Product record created successfully"
        if created_product_record.image_path:
            base_message += " with image"

        if final_status == ProductRecordStatus.DISCARDED:
            base_message += " and automatically discarded due to poor quality"

        return CreateProductRecordResponseDto(
            record_id=created_product_record.record_id,
            message=base_message,
        )
