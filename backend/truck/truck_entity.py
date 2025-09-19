from dataclasses import dataclass
from typing import Optional
from enum import Enum
from sqlalchemy import Column, Integer, String, ForeignKey
from geoalchemy2 import Geography
from src.database import Base
from src.base import Location


class TruckStatus(str, Enum):
    AVAILABLE = "Available"
    IN_SERVICE = "InService"


class TruckType(str, Enum):
    REFRIGERATED = "Refrigerated"
    NORMAL = "Normal"


@dataclass
class Truck:
    truck_id: Optional[int]
    truck_driver_id: Optional[int]
    current_location: Optional[Location]
    status: TruckStatus
    type: TruckType
    load_capacity_kg: Optional[int]

    def __post_init__(self):
        if isinstance(self.status, str):
            self.status = TruckStatus(self.status)
        if isinstance(self.type, str):
            self.type = TruckType(self.type)

        # Validate that the status is one of the allowed values
        if self.status not in TruckStatus:
            raise ValueError(
                f"Invalid status: {self.status}. Must be one of {list(TruckStatus)}"
            )

        # Validate that the type is one of the allowed values
        if self.type not in TruckType:
            raise ValueError(
                f"Invalid type: {self.type}. Must be one of {list(TruckType)}"
            )


class TruckModel(Base):
    """SQLAlchemy Truck model for PostgreSQL with PostGIS"""

    __tablename__ = "truck"

    # Columns matching the database schema
    TruckID = Column("truckid", Integer, primary_key=True, autoincrement=True)
    TruckDriverID = Column(
        "truckdriverid", Integer, ForeignKey("User.userid"), nullable=True
    )
    CurrentLocation = Column(
        "currentlocation", Geography("POINT", srid=4326), nullable=True
    )
    Status = Column("status", String(20), nullable=False)
    Type = Column("type", String(20), nullable=False)
    LoadCapacityKg = Column("loadcapacitykg", Integer, nullable=True)

    def __repr__(self):
        return f"<TruckModel(TruckID={self.TruckID}, Status='{self.Status}', Type='{self.Type}')>"
