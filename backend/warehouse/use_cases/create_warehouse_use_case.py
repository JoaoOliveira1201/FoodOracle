from src.warehouse.warehouse_entity import Warehouse
from src.warehouse.warehouse_repository import WarehouseRepository
from src.warehouse.warehouse_dto import CreateWarehouseDto, CreateWarehouseResponseDto
from src.user.user_repository import UserRepository
from src.user.user_entity import UserRole


class CreateWarehouseUseCase:
    def __init__(
        self, warehouse_repository: WarehouseRepository, user_repository: UserRepository
    ):
        self._warehouse_repository = warehouse_repository
        self._user_repository = user_repository

    async def execute(
        self, create_warehouse_dto: CreateWarehouseDto
    ) -> CreateWarehouseResponseDto:
        """Create a new warehouse"""

        warehouse = Warehouse(
            warehouse_id=None,
            name=create_warehouse_dto.name,
            location=create_warehouse_dto.location,
            normal_capacity_kg=create_warehouse_dto.normal_capacity_kg,
            refrigerated_capacity_kg=create_warehouse_dto.refrigerated_capacity_kg,
        )

        created_warehouse = await self._warehouse_repository.create(warehouse)

        return CreateWarehouseResponseDto(
            warehouse_id=created_warehouse.warehouse_id,
            message="Warehouse created successfully",
        )
