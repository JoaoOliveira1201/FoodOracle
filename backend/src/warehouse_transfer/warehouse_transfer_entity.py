from dataclasses import dataclass
from typing import Optional
from enum import Enum
from datetime import datetime, timedelta
from sqlalchemy import Column, Integer, String, ForeignKey, Interval, TIMESTAMP
from sqlalchemy.dialects.postgresql import TIMESTAMP
from src.database import Base


class TransferStatus(str, Enum):
    PENDING = "Pending"
    IN_TRANSIT = "InTransit"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"


class TransferReason(str, Enum):
    RESTOCK = "Restock"
    REDISTRIBUTION = "Redistribution"
    EMERGENCY = "Emergency"
    OPTIMIZATION = "Optimization"


@dataclass
class WarehouseTransfer:
    transfer_id: Optional[int]
    record_id: Optional[int]
    origin_warehouse_id: Optional[int]
    destination_warehouse_id: Optional[int]
    truck_id: Optional[int]
    status: TransferStatus
    reason: Optional[TransferReason]
    estimated_time: Optional[timedelta]
    actual_time: Optional[timedelta]
    requested_date: Optional[datetime]
    start_date: Optional[datetime]
    completed_date: Optional[datetime]
    notes: Optional[str]

    def __post_init__(self):
        if isinstance(self.status, str):
            self.status = TransferStatus(self.status)
        if self.reason is not None and isinstance(self.reason, str):
            self.reason = TransferReason(self.reason)

        if self.status not in TransferStatus:
            raise ValueError(
                f"Invalid status: {self.status}. Must be one of {list(TransferStatus)}"
            )

        if self.reason is not None and self.reason not in TransferReason:
            raise ValueError(
                f"Invalid reason: {self.reason}. Must be one of {list(TransferReason)}"
            )


class WarehouseTransferModel(Base):
    """SQLAlchemy WarehouseTransfer model for PostgreSQL"""

    __tablename__ = "warehousetransfer"

    TransferID = Column("transferid", Integer, primary_key=True, autoincrement=True)
    RecordID = Column(
        "recordid",
        Integer,
        ForeignKey("productrecord.recordid"),
        nullable=True,
    )
    TruckID = Column("truckid", Integer, ForeignKey("truck.truckid"), nullable=True)
    OriginWarehouseID = Column(
        "originwarehouseid",
        Integer,
        ForeignKey("warehouse.warehouseid"),
        nullable=True,
    )
    DestinationWarehouseID = Column(
        "destinationwarehouseid",
        Integer,
        ForeignKey("warehouse.warehouseid"),
        nullable=True,
    )
    Status = Column("status", String(20), nullable=False)
    Reason = Column("reason", String(20), nullable=True)
    RequestedDate = Column("requesteddate", TIMESTAMP, nullable=True)
    StartDate = Column("startdate", TIMESTAMP, nullable=True)
    CompletedDate = Column("completeddate", TIMESTAMP, nullable=True)
    EstimatedTime = Column("estimatedtime", Interval, nullable=True)
    ActualTime = Column("actualtime", Interval, nullable=True)
    Notes = Column("notes", String(500), nullable=True)

    def __repr__(self):
        return f"<WarehouseTransferModel(TransferID={self.TransferID}, Status='{self.Status}', Reason='{self.Reason}')>"
