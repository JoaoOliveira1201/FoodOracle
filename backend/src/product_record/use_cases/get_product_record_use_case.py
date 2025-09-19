from typing import List, Optional
from src.product_record.product_record_repository import ProductRecordRepository
from src.product_record.product_record_dto import (
    ProductRecordResponseDto,
    product_record_to_response_dto,
)
from src.product_record.product_record_entity import (
    QualityClassification,
    ProductRecordStatus,
)


class GetProductRecordUseCase:
    def __init__(self, product_record_repository: ProductRecordRepository):
        self._product_record_repository = product_record_repository

    async def execute_by_id(self, record_id: int) -> Optional[ProductRecordResponseDto]:
        """Get product record by ID"""
        result = await self._product_record_repository.get_by_id_with_names(record_id)
        if not result:
            return None
        product_record, supplier_name, warehouse_name = result
        return product_record_to_response_dto(
            product_record, supplier_name, warehouse_name
        )

    async def execute_all(self) -> List[ProductRecordResponseDto]:
        """Get all product records"""
        results = await self._product_record_repository.get_all_with_names()
        return [
            product_record_to_response_dto(
                product_record, supplier_name, warehouse_name
            )
            for product_record, supplier_name, warehouse_name in results
        ]

    async def execute_by_supplier_id(
        self, supplier_id: int
    ) -> List[ProductRecordResponseDto]:
        """Get product records by supplier ID"""
        results = await self._product_record_repository.get_by_supplier_id_with_names(
            supplier_id
        )
        return [
            product_record_to_response_dto(
                product_record, supplier_name, warehouse_name
            )
            for product_record, supplier_name, warehouse_name in results
        ]

    async def execute_by_product_id(
        self, product_id: int
    ) -> List[ProductRecordResponseDto]:
        """Get product records by product ID"""
        results = await self._product_record_repository.get_by_product_id_with_names(
            product_id
        )
        return [
            product_record_to_response_dto(
                product_record, supplier_name, warehouse_name
            )
            for product_record, supplier_name, warehouse_name in results
        ]

    async def execute_by_warehouse_id(
        self, warehouse_id: int
    ) -> List[ProductRecordResponseDto]:
        """Get product records by warehouse ID"""
        results = await self._product_record_repository.get_by_warehouse_id_with_names(
            warehouse_id
        )
        return [
            product_record_to_response_dto(
                product_record, supplier_name, warehouse_name
            )
            for product_record, supplier_name, warehouse_name in results
        ]

    async def execute_by_status(
        self, status: ProductRecordStatus
    ) -> List[ProductRecordResponseDto]:
        """Get product records by status"""
        results = await self._product_record_repository.get_by_status_with_names(status)
        return [
            product_record_to_response_dto(
                product_record, supplier_name, warehouse_name
            )
            for product_record, supplier_name, warehouse_name in results
        ]

    async def execute_by_quality_classification(
        self, quality_classification: QualityClassification
    ) -> List[ProductRecordResponseDto]:
        """Get product records by quality classification"""
        results = await self._product_record_repository.get_by_quality_classification_with_names(
            quality_classification
        )
        return [
            product_record_to_response_dto(
                product_record, supplier_name, warehouse_name
            )
            for product_record, supplier_name, warehouse_name in results
        ]
