from typing import List, Optional
from src.warehouse_transfer.warehouse_transfer_repository import (
    WarehouseTransferRepository,
)
from src.warehouse_transfer.warehouse_transfer_entity import TransferStatus
from src.warehouse_transfer.warehouse_transfer_dto import (
    WarehouseTransferResponseDto,
    warehouse_transfer_to_response_dto,
)


class GetWarehouseTransferUseCase:
    def __init__(self, warehouse_transfer_repository: WarehouseTransferRepository):
        self._warehouse_transfer_repository = warehouse_transfer_repository

    async def execute_by_id(
        self, transfer_id: int
    ) -> Optional[WarehouseTransferResponseDto]:
        """Get warehouse transfer by ID"""
        warehouse_transfer = await self._warehouse_transfer_repository.get_by_id(
            transfer_id
        )
        if not warehouse_transfer:
            return None
        return warehouse_transfer_to_response_dto(warehouse_transfer)

    async def execute_all(self) -> List[WarehouseTransferResponseDto]:
        """Get all warehouse transfers"""
        warehouse_transfers = await self._warehouse_transfer_repository.get_all()
        return [warehouse_transfer_to_response_dto(wt) for wt in warehouse_transfers]

    async def execute_by_record_id(
        self, record_id: int
    ) -> List[WarehouseTransferResponseDto]:
        """Get warehouse transfers by record ID"""
        warehouse_transfers = (
            await self._warehouse_transfer_repository.get_by_record_id(record_id)
        )
        return [warehouse_transfer_to_response_dto(wt) for wt in warehouse_transfers]

    async def execute_by_truck_id(
        self, truck_id: int
    ) -> List[WarehouseTransferResponseDto]:
        """Get warehouse transfers by truck ID"""
        warehouse_transfers = await self._warehouse_transfer_repository.get_by_truck_id(
            truck_id
        )
        return [warehouse_transfer_to_response_dto(wt) for wt in warehouse_transfers]

    async def execute_by_origin_warehouse_id(
        self, origin_warehouse_id: int
    ) -> List[WarehouseTransferResponseDto]:
        """Get warehouse transfers by origin warehouse ID"""
        warehouse_transfers = (
            await self._warehouse_transfer_repository.get_by_origin_warehouse_id(
                origin_warehouse_id
            )
        )
        return [warehouse_transfer_to_response_dto(wt) for wt in warehouse_transfers]

    async def execute_by_destination_warehouse_id(
        self, destination_warehouse_id: int
    ) -> List[WarehouseTransferResponseDto]:
        """Get warehouse transfers by destination warehouse ID"""
        warehouse_transfers = (
            await self._warehouse_transfer_repository.get_by_destination_warehouse_id(
                destination_warehouse_id
            )
        )
        return [warehouse_transfer_to_response_dto(wt) for wt in warehouse_transfers]

    async def execute_by_status(
        self, status: TransferStatus
    ) -> List[WarehouseTransferResponseDto]:
        """Get warehouse transfers by status"""
        warehouse_transfers = await self._warehouse_transfer_repository.get_by_status(
            status
        )
        return [warehouse_transfer_to_response_dto(wt) for wt in warehouse_transfers]
