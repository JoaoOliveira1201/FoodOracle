from dataclasses import dataclass
from typing import Optional
from enum import Enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from src.database import Base


class QuoteStatus(str, Enum):
    PENDING = "Pending"
    APPROVED = "Approved"
    REJECTED = "Rejected"


@dataclass
class Quote:
    quote_id: Optional[int]
    supplier_id: Optional[int]
    product_id: Optional[int]
    pdf_document_path: Optional[str]
    status: QuoteStatus
    submission_date: Optional[datetime]

    def __post_init__(self):
        if isinstance(self.status, str):
            self.status = QuoteStatus(self.status)
        if self.status not in QuoteStatus:
            raise ValueError(
                f"Invalid status: {self.status}. Must be one of {list(QuoteStatus)}"
            )


class QuoteModel(Base):
    """SQLAlchemy Quote model for PostgreSQL"""

    __tablename__ = "quote"

    QuoteID = Column("quoteid", Integer, primary_key=True, autoincrement=True)
    SupplierID = Column("supplierid", Integer, ForeignKey("User.userid"), nullable=True)
    ProductID = Column(
        "productid", Integer, ForeignKey("product.productid"), nullable=True
    )
    PdfDocumentPath = Column("pdfdocumentpath", Text, nullable=True)
    Status = Column("status", String(20), nullable=False)
    SubmissionDate = Column(
        "submissiondate", DateTime, nullable=False, default=datetime.utcnow
    )

    def __repr__(self):
        return (
            f"<QuoteModel(QuoteID={self.QuoteID}, SupplierID={self.SupplierID}, "
            f"ProductID={self.ProductID}, Status='{self.Status}')>"
        )
