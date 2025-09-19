from dataclasses import dataclass
from typing import Optional
from enum import Enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, TIMESTAMP, ForeignKey
from src.database import Base


class OrderStatus(str, Enum):
    PENDING = "Pending"
    CONFIRMED = "Confirmed"
    IN_TRANSIT = "InTransit"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"


@dataclass
class Order:
    order_id: Optional[int]
    buyer_id: Optional[int]
    order_date: Optional[datetime]
    status: OrderStatus
    total_amount: Optional[int]

    def __post_init__(self):
        if isinstance(self.status, str):
            self.status = OrderStatus(self.status)
        if self.status not in OrderStatus:
            raise ValueError(
                f"Invalid status: {self.status}. Must be one of {list(OrderStatus)}"
            )


class OrderModel(Base):
    """SQLAlchemy Order model for PostgreSQL"""

    __tablename__ = "Order"

    OrderID = Column("orderid", Integer, primary_key=True, autoincrement=True)
    BuyerID = Column("buyerid", Integer, ForeignKey("User.userid"), nullable=True)
    OrderDate = Column("orderdate", TIMESTAMP, nullable=True)
    Status = Column("status", String(20), nullable=False)
    TotalAmount = Column("totalamount", Integer, nullable=True)

    def __repr__(self):
        return f"<OrderModel(OrderID={self.OrderID}, BuyerID={self.BuyerID}, Status='{self.Status}')>"
