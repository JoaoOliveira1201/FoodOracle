from dataclasses import dataclass
from typing import Optional
from enum import Enum
from sqlalchemy import Column, Integer, String, Text
from geoalchemy2 import Geography
from src.database import Base
from src.base import Location


class UserRole(str, Enum):
    ADMINISTRATOR = "Administrator"
    SUPPLIER = "Supplier"
    BUYER = "Buyer"
    TRUCK_DRIVER = "TruckDriver"


@dataclass
class User:
    user_id: Optional[int]
    name: str
    contact_info: Optional[str]
    location: Optional[Location]
    password_string: str
    role: UserRole

    def __post_init__(self):
        if isinstance(self.role, str):
            self.role = UserRole(self.role)
        if self.role not in UserRole:
            raise ValueError(
                f"Invalid role: {self.role}. Must be one of {list(UserRole)}"
            )


class UserModel(Base):
    """SQLAlchemy User model for PostgreSQL with PostGIS"""

    __tablename__ = "User"

    UserID = Column("userid", Integer, primary_key=True, autoincrement=True)
    Name = Column("name", String(100), nullable=False)
    ContactInfo = Column("contactinfo", Text, nullable=True)
    Location = Column("location", Geography("POINT", srid=4326), nullable=True)
    Address = Column("address", Text, nullable=True)
    PasswordString = Column("passwordstring", Text, nullable=False)
    Role = Column("role", String(20), nullable=False)

    def __repr__(self):
        return (
            f"<UserModel(UserID={self.UserID}, Name='{self.Name}', Role='{self.Role}')>"
        )
