from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from src.database import get_db_session
from src.product.product_repository import ProductRepository
from src.product_record.product_record_repository import ProductRecordRepository
from .src.bedrock import get_seasonal_suggestions
from .src.seasonal_analyzer import analyze_seasonal_data

router = APIRouter(prefix="/seasonal-suggestions", tags=["Seasonal Suggestions"])


class SeasonalSuggestionItem(BaseModel):
    title: str
    summary: str


class SeasonalSuggestionResponse(BaseModel):
    analysis_date: str
    season: str
    suggestions: List[SeasonalSuggestionItem]
    current_inventory_summary: Dict[str, Any]
    seasonal_trends: Dict[str, Any]


async def get_comprehensive_inventory_data(db: AsyncSession) -> Dict[str, Any]:
    """Fetch comprehensive inventory data for seasonal analysis"""

    # Initialize repositories
    product_repo = ProductRepository(db)
    product_record_repo = ProductRecordRepository(db)

    # Get all products
    products = await product_repo.get_all()

    # Get inventory summary for each product
    inventory_data = []
    for product in products:
        # Get product metrics
        metrics = await product_record_repo.get_product_metrics(product.product_id)

        # Get current stock (only in-stock records)
        all_records = await product_record_repo.get_by_product_id(product.product_id)
        current_stock = [
            record for record in all_records if record.status.value == "InStock"
        ]
        current_stock_kg = sum(record.quantity_kg or 0 for record in current_stock)

        inventory_data.append(
            {
                "product_id": product.product_id,
                "name": product.name,
                "base_price": product.base_price,
                "requires_refrigeration": product.requires_refrigeration,
                "shelf_life_days": product.shelf_life_days,
                "current_stock_kg": current_stock_kg,
                "total_sold_kg": metrics.get("total_sold_kg", 0),
                "total_discarded_kg": metrics.get("total_discarded_kg", 0),
                "total_donated_kg": metrics.get("total_donated_kg", 0),
                "inventory_turnover_rate": metrics.get("inventory_turnover_rate", 0),
                "loss_percentage": metrics.get("loss_percentage", 0),
                "average_days_to_sell": metrics.get("average_days_to_sell", 0),
            }
        )

    return {
        "products": inventory_data,
        "total_products": len(products),
        "analysis_timestamp": datetime.now().isoformat(),
    }


@router.post("/analyze", response_model=SeasonalSuggestionResponse)
async def analyze_seasonal_suggestions(db: AsyncSession = Depends(get_db_session)):
    """Analyze current inventory and provide seasonal suggestions for Portugal food products"""

    try:
        # Use provided date or current date
        analysis_date = datetime.now()

        # Get comprehensive inventory data
        inventory_data = await get_comprehensive_inventory_data(db)

        # Analyze seasonal patterns
        seasonal_analysis = analyze_seasonal_data(inventory_data, analysis_date)

        # Get AI-powered suggestions
        suggestions = await get_seasonal_suggestions(
            inventory_data=inventory_data,
            analysis_date=analysis_date,
            seasonal_context=seasonal_analysis,
        )

        # Convert suggestions to the new format
        formatted_suggestions = []
        for suggestion in suggestions:
            if (
                isinstance(suggestion, dict)
                and "title" in suggestion
                and "summary" in suggestion
            ):
                formatted_suggestions.append(
                    SeasonalSuggestionItem(
                        title=suggestion["title"], summary=suggestion["summary"]
                    )
                )
            else:
                # Fallback for old format
                formatted_suggestions.append(
                    SeasonalSuggestionItem(
                        title="Recommendation", summary=str(suggestion)
                    )
                )

        return SeasonalSuggestionResponse(
            analysis_date=analysis_date.isoformat(),
            season=seasonal_analysis["season"],
            suggestions=formatted_suggestions,
            current_inventory_summary=seasonal_analysis["inventory_summary"],
            seasonal_trends=seasonal_analysis["trends"],
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error analyzing seasonal suggestions: {str(e)}"
        )
