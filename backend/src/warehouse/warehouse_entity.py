from dataclasses import dataclass
from typing import Optional
from sqlalchemy import Column, Integer, String
from geoalchemy2 import Geography
from src.database import Base
from src.base import Location


@dataclass
class Warehouse:
    warehouse_id: Optional[int]
    name: str
    location: Location
    normal_capacity_kg: Optional[int]
    refrigerated_capacity_kg: Optional[int]


class WarehouseModel(Base):
    """SQLAlchemy Warehouse model for PostgreSQL with PostGIS"""

    __tablename__ = "warehouse"

    # Columns matching the database schema
    WarehouseID = Column("warehouseid", Integer, primary_key=True, autoincrement=True)
    Name = Column("name", String(100), nullable=False)
    Location = Column("location", Geography("POINT", srid=4326), nullable=False)
    NormalCapacityKg = Column("normalcapacitykg", Integer, nullable=True)
    RefrigeratedCapacityKg = Column("refrigeratedcapacitykg", Integer, nullable=True)

    def __repr__(self):
        return f"<WarehouseModel(WarehouseID={self.WarehouseID}, Name={self.Name}, NormalCapacity={self.NormalCapacityKg}, RefrigeratedCapacity={self.RefrigeratedCapacityKg})>"
