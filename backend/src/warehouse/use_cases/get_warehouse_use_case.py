from typing import List, Optional
from src.warehouse.warehouse_repository import WarehouseRepository
from src.warehouse.warehouse_dto import (
    WarehouseResponseDto,
    warehouse_to_response_dto,
    ProductInStorageDto,
)


class GetWarehouseUseCase:
    def __init__(self, warehouse_repository: WarehouseRepository):
        self._warehouse_repository = warehouse_repository

    async def execute_by_id(self, warehouse_id: int) -> Optional[WarehouseResponseDto]:
        """Get warehouse by ID"""
        warehouse = await self._warehouse_repository.get_by_id(warehouse_id)
        if not warehouse:
            return None

        # Get products in storage for this warehouse
        products_data = await self._warehouse_repository.get_products_in_storage(
            warehouse_id
        )
        products_in_storage = [
            ProductInStorageDto(**product_data) for product_data in products_data
        ]

        # Convert to response DTO and add products
        warehouse_dto = warehouse_to_response_dto(warehouse)
        warehouse_dto.products_in_storage = products_in_storage

        return warehouse_dto

    async def execute_all(self) -> List[WarehouseResponseDto]:
        """Get all warehouses"""
        warehouses = await self._warehouse_repository.get_all()
        result_warehouses = []

        for warehouse in warehouses:
            # Get products in storage for each warehouse
            products_data = await self._warehouse_repository.get_products_in_storage(
                warehouse.warehouse_id
            )
            products_in_storage = [
                ProductInStorageDto(**product_data) for product_data in products_data
            ]

            # Convert to response DTO and add products
            warehouse_dto = warehouse_to_response_dto(warehouse)
            warehouse_dto.products_in_storage = products_in_storage
            result_warehouses.append(warehouse_dto)

        return result_warehouses
