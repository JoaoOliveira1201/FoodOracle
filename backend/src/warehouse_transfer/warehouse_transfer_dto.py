from dataclasses import dataclass
from typing import Optional
from datetime import datetime, timedelta
from src.warehouse_transfer.warehouse_transfer_entity import (
    WarehouseTransfer,
    TransferStatus,
    TransferReason,
)


@dataclass
class CreateWarehouseTransferDto:
    record_id: Optional[int]
    origin_warehouse_id: Optional[int]
    destination_warehouse_id: Optional[int]
    reason: Optional[TransferReason] = None
    status: TransferStatus = TransferStatus.PENDING
    notes: Optional[str] = None


@dataclass
class UpdateWarehouseTransferDto:
    truck_id: Optional[int] = None
    status: Optional[TransferStatus] = None
    reason: Optional[TransferReason] = None
    estimated_time: Optional[timedelta] = None
    actual_time: Optional[timedelta] = None
    start_date: Optional[datetime] = None
    completed_date: Optional[datetime] = None
    notes: Optional[str] = None


@dataclass
class WarehouseTransferResponseDto:
    transfer_id: int
    record_id: Optional[int]
    origin_warehouse_id: Optional[int]
    destination_warehouse_id: Optional[int]
    truck_id: Optional[int]
    status: str
    reason: Optional[str]
    estimated_time: Optional[timedelta]
    actual_time: Optional[timedelta]
    requested_date: Optional[datetime]
    start_date: Optional[datetime]
    completed_date: Optional[datetime]
    notes: Optional[str]


@dataclass
class CreateWarehouseTransferResponseDto:
    transfer_id: int
    message: str


def warehouse_transfer_to_response_dto(
    transfer: WarehouseTransfer,
) -> WarehouseTransferResponseDto:
    """Convert WarehouseTransfer entity to response DTO"""
    return WarehouseTransferResponseDto(
        transfer_id=transfer.transfer_id,
        record_id=transfer.record_id,
        origin_warehouse_id=transfer.origin_warehouse_id,
        destination_warehouse_id=transfer.destination_warehouse_id,
        truck_id=transfer.truck_id,
        status=transfer.status.value,
        reason=transfer.reason.value if transfer.reason else None,
        estimated_time=transfer.estimated_time,
        actual_time=transfer.actual_time,
        requested_date=transfer.requested_date,
        start_date=transfer.start_date,
        completed_date=transfer.completed_date,
        notes=transfer.notes,
    )
