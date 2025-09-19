from dataclasses import dataclass
from typing import Optional
from sqlalchemy import Column, Integer, ForeignKey
from src.database import Base


@dataclass
class OrderItem:
    order_item_id: Optional[int]
    order_id: Optional[int]
    record_id: Optional[int]
    price_at_purchase: Optional[int]


class OrderItemModel(Base):
    """SQLAlchemy OrderItem model for PostgreSQL"""

    __tablename__ = "orderitem"

    OrderItemID = Column("orderitemid", Integer, primary_key=True, autoincrement=True)
    OrderID = Column(
        "orderid",
        Integer,
        ForeignKey("Order.orderid", ondelete="CASCADE"),
        nullable=True,
    )
    RecordID = Column(
        "recordid",
        Integer,
        ForeignKey("productrecord.recordid", ondelete="SET NULL"),
        nullable=True,
    )
    PriceAtPurchase = Column("priceatpurchase", Integer, nullable=True)

    def __repr__(self):
        return f"<OrderItemModel(OrderItemID={self.OrderItemID}, OrderID={self.OrderID}, RecordID={self.RecordID})>"
