from typing import Optional
from datetime import datetime
from src.warehouse_transfer.warehouse_transfer_entity import (
    WarehouseTransfer,
    TransferStatus,
)
from src.warehouse_transfer.warehouse_transfer_repository import (
    WarehouseTransferRepository,
)
from src.warehouse_transfer.warehouse_transfer_dto import (
    UpdateWarehouseTransferDto,
    WarehouseTransferResponseDto,
    warehouse_transfer_to_response_dto,
)
from src.truck.truck_repository import TruckRepository
from src.truck.truck_entity import TruckStatus
from src.product_record.product_record_repository import ProductRecordRepository


class UpdateWarehouseTransferUseCase:
    def __init__(
        self,
        transfer_repository: WarehouseTransferRepository,
        truck_repository: TruckRepository,
        product_record_repository: ProductRecordRepository,
    ):
        self._transfer_repository = transfer_repository
        self._truck_repository = truck_repository
        self._product_record_repository = product_record_repository

    async def execute(
        self, transfer_id: int, update_dto: UpdateWarehouseTransferDto
    ) -> Optional[WarehouseTransferResponseDto]:
        """Update an existing warehouse transfer with business logic"""

        # Get existing transfer
        existing_transfer = await self._transfer_repository.get_by_id(transfer_id)
        if not existing_transfer:
            return None

        # Handle status change logic
        old_status = existing_transfer.status
        new_status = update_dto.status or existing_transfer.status

        # Set start_date automatically when status changes to IN_TRANSIT
        start_date = (
            update_dto.start_date if hasattr(update_dto, "start_date") else None
        )
        if (
            new_status == TransferStatus.IN_TRANSIT
            and old_status == TransferStatus.PENDING
            and start_date is None
        ):
            start_date = datetime.utcnow()

        # Set completed_date automatically when status becomes COMPLETED
        completed_date = (
            update_dto.completed_date if hasattr(update_dto, "completed_date") else None
        )
        if (
            new_status == TransferStatus.COMPLETED
            and old_status != TransferStatus.COMPLETED
            and completed_date is None
        ):
            completed_date = datetime.utcnow()

        # Create updated transfer
        updated_transfer = WarehouseTransfer(
            transfer_id=existing_transfer.transfer_id,
            record_id=existing_transfer.record_id,
            origin_warehouse_id=existing_transfer.origin_warehouse_id,
            destination_warehouse_id=existing_transfer.destination_warehouse_id,
            truck_id=update_dto.truck_id
            if update_dto.truck_id is not None
            else existing_transfer.truck_id,
            reason=existing_transfer.reason,
            status=new_status,
            estimated_time=update_dto.estimated_time
            if update_dto.estimated_time is not None
            else existing_transfer.estimated_time,
            actual_time=update_dto.actual_time
            if update_dto.actual_time is not None
            else existing_transfer.actual_time,
            requested_date=existing_transfer.requested_date,
            start_date=start_date or existing_transfer.start_date,
            completed_date=completed_date or existing_transfer.completed_date,
            notes=update_dto.notes
            if update_dto.notes is not None
            else existing_transfer.notes,
        )

        # Update the transfer
        result = await self._transfer_repository.update(transfer_id, updated_transfer)
        if not result:
            return None

        # Handle post-update business logic
        await self._handle_transfer_status_changes(result, old_status)

        return warehouse_transfer_to_response_dto(result)

    async def _handle_transfer_status_changes(
        self, transfer: WarehouseTransfer, old_status: TransferStatus
    ) -> None:
        """Handle business logic when transfer status changes"""

        # When transfer starts (IN_TRANSIT), update truck status to IN_SERVICE
        if (
            transfer.status == TransferStatus.IN_TRANSIT
            and old_status == TransferStatus.PENDING
            and transfer.truck_id
        ):
            await self._truck_repository.update_status_and_location(
                transfer.truck_id, TruckStatus.IN_SERVICE
            )

        # When transfer is completed, update product record warehouse and set truck back to available
        if (
            transfer.status == TransferStatus.COMPLETED
            and old_status != TransferStatus.COMPLETED
        ):
            # Update product record warehouse location if there's an associated product record
            if transfer.record_id and transfer.destination_warehouse_id:
                await self._product_record_repository.update(
                    transfer.record_id,
                    {"WarehouseID": transfer.destination_warehouse_id},
                )

            # Set truck back to available
            if transfer.truck_id:
                await self._truck_repository.update_status_and_location(
                    transfer.truck_id, TruckStatus.AVAILABLE
                )

        # When transfer is cancelled, set truck back to available
        if (
            transfer.status == TransferStatus.CANCELLED
            and old_status not in [TransferStatus.CANCELLED, TransferStatus.PENDING]
            and transfer.truck_id
        ):
            await self._truck_repository.update_status_and_location(
                transfer.truck_id, TruckStatus.AVAILABLE
            )
