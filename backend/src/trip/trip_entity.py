from dataclasses import dataclass
from typing import Optional
from enum import Enum
from datetime import datetime, timedelta
from sqlalchemy import Column, Integer, String, ForeignKey, Interval
from sqlalchemy.dialects.postgresql import TIMESTAMP
from geoalchemy2 import Geography
from src.database import Base
from src.base import Location


class TripStatus(str, Enum):
    WAITING = "Waiting"
    COLLECTING = "Collecting"
    LOADED = "Loaded"
    PAUSED = "Paused"
    DELIVERING = "Delivering"
    DELIVERED = "Delivered"


@dataclass
class Trip:
    trip_id: Optional[int]
    truck_id: Optional[int]
    order_id: Optional[int]
    origin: Optional[Location]
    destination: Optional[Location]
    status: TripStatus
    estimated_time: Optional[timedelta]
    actual_time: Optional[timedelta]
    start_date: Optional[datetime]
    end_date: Optional[datetime]

    def __post_init__(self):
        if isinstance(self.status, str):
            self.status = TripStatus(self.status)
        if self.status not in TripStatus:
            raise ValueError(
                f"Invalid status: {self.status}. Must be one of {list(TripStatus)}"
            )


class TripModel(Base):
    """SQLAlchemy Trip model for PostgreSQL with PostGIS"""

    __tablename__ = "trip"

    TripID = Column("tripid", Integer, primary_key=True, autoincrement=True)
    TruckID = Column("truckid", Integer, ForeignKey("truck.truckid"), nullable=True)
    OrderID = Column("orderid", Integer, ForeignKey("Order.orderid"), nullable=True)
    Origin = Column("origin", Geography("POINT", srid=4326), nullable=True)
    Destination = Column("destination", Geography("POINT", srid=4326), nullable=True)
    Status = Column("status", String(20), nullable=False)
    EstimatedTime = Column("estimatedtime", Interval, nullable=True)
    ActualTime = Column("actualtime", Interval, nullable=True)
    StartDate = Column("startdate", TIMESTAMP, nullable=True)
    EndDate = Column("enddate", TIMESTAMP, nullable=True)

    def __repr__(self):
        return f"<TripModel(TripID={self.TripID}, TruckID={self.TruckID}, OrderID={self.OrderID}, Status='{self.Status}')>"
