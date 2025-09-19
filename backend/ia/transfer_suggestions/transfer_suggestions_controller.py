from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from typing import Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
import asyncio
from datetime import datetime

from src.database import get_db_session
from .src.transfer_service import TransferSuggestionsService
from .src.config import DEFAULT_MAX_TRUCKS_TO_USE, CONFIDENCE_THRESHOLD

router = APIRouter(prefix="/transfer-suggestions", tags=["Transfer Suggestions"])


class TransferSuggestionRequest(BaseModel):
    max_trucks_to_use: int = Field(
        default=DEFAULT_MAX_TRUCKS_TO_USE,
        ge=1,
        le=50,
        description="Maximum number of trucks to use in optimization",
    )
    confidence_threshold: float = Field(
        default=CONFIDENCE_THRESHOLD,
        ge=0.0,
        le=1.0,
        description="Minimum confidence score for transfer suggestions (0.0 to 1.0)",
    )


class TransferRecord(BaseModel):
    transfer_id: str
    product_id: int
    product_name: str
    product_record_id: int
    origin_warehouse_id: int
    origin_warehouse_name: str
    destination_warehouse_id: int
    destination_warehouse_name: str
    quantity_kg: float
    supplier_id: int
    quality_classification: str
    registration_date: datetime
    assigned_truck_id: Optional[int] = None
    truck_capacity_kg: Optional[float] = None
    route_total_load_kg: Optional[float] = None
    generated_timestamp: datetime
    status: str


class ProductSummary(BaseModel):
    product_id: int
    total_quantity_kg: float
    number_of_transfers: int
    trucks_required: int


class RouteSummary(BaseModel):
    origin_warehouse_id: int
    destination_warehouse_id: int
    assigned_truck_id: Optional[int]
    route_total_kg: float
    number_of_records: int
    number_of_products: int


class TransferSuggestionResponse(BaseModel):
    success: bool
    message: str
    execution_time_seconds: float
    parameters: TransferSuggestionRequest
    results: Optional[Dict] = None
    transfer_records: List[TransferRecord] = []
    product_summary: List[ProductSummary] = []
    route_summary: List[RouteSummary] = []
    error: Optional[str] = None


@router.post("/generate", response_model=TransferSuggestionResponse)
async def generate_transfer_suggestions(
    request: TransferSuggestionRequest,
    db: AsyncSession = Depends(get_db_session),
):
    """
    Generate AI-powered transfer suggestions for product redistribution across warehouses

    This endpoint analyzes demand patterns using clustering and forecasting to suggest
    optimal product record transfers between warehouses, with truck route optimization.
    """
    start_time = datetime.now()

    try:
        # Initialize the transfer suggestions service
        service = TransferSuggestionsService(
            db=db,
            max_trucks_to_use=request.max_trucks_to_use,
            confidence_threshold=request.confidence_threshold,
        )

        # Run the analysis in a thread pool to avoid blocking
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, service.generate_transfer_suggestions)

        execution_time = (datetime.now() - start_time).total_seconds()

        if result["success"]:
            return TransferSuggestionResponse(
                success=True,
                message=f"Successfully generated {len(result['transfer_records'])} transfer suggestions for {len(result['product_summary'])} products",
                execution_time_seconds=execution_time,
                parameters=request,
                results=result["results"],
                transfer_records=result["transfer_records"],
                product_summary=result["product_summary"],
                route_summary=result["route_summary"],
            )
        else:
            return TransferSuggestionResponse(
                success=False,
                message=result["message"],
                execution_time_seconds=execution_time,
                parameters=request,
                error=result.get("error"),
            )

    except Exception as e:
        execution_time = (datetime.now() - start_time).total_seconds()
        raise HTTPException(
            status_code=500, detail=f"Error generating transfer suggestions: {str(e)}"
        )
