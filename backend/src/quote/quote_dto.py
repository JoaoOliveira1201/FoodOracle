from pydantic import BaseModel
from typing import Optional, TYPE_CHECKING
from datetime import datetime
from src.quote.quote_entity import QuoteStatus

if TYPE_CHECKING:
    from src.quote.quote_entity import Quote


class CreateQuoteDto(BaseModel):
    supplier_id: Optional[int] = None
    product_id: Optional[int] = None
    status: QuoteStatus = QuoteStatus.PENDING


class UpdateQuoteStatusDto(BaseModel):
    status: QuoteStatus


class QuoteResponseDto(BaseModel):
    quote_id: int
    supplier_id: Optional[int]
    product_id: Optional[int]
    pdf_document_path: Optional[str]
    status: QuoteStatus
    submission_date: datetime

    class Config:
        from_attributes = True


class CreateQuoteResponseDto(BaseModel):
    quote_id: int
    message: str


class ApprovedSupplierDto(BaseModel):
    """DTO for approved supplier information"""

    supplier_id: int
    supplier_name: str
    supplier_contact: str
    approval_date: datetime

    class Config:
        from_attributes = True


class ApprovedSuppliersResponseDto(BaseModel):
    """Response DTO for approved suppliers for a product"""

    product_id: int
    approved_suppliers: list[ApprovedSupplierDto]
    total_approved: int

    class Config:
        from_attributes = True


def quote_to_response_dto(quote: "Quote") -> QuoteResponseDto:
    """Convert Quote entity to QuoteResponseDto"""
    return QuoteResponseDto(
        quote_id=quote.quote_id,
        supplier_id=quote.supplier_id,
        product_id=quote.product_id,
        pdf_document_path=quote.pdf_document_path,
        status=quote.status,
        submission_date=quote.submission_date,
    )
