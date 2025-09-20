from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db_session
from .src.donation_service import DonationService
from .src.openai_service import OpenAILocationService

router = APIRouter(prefix="/donation-suggestions", tags=["Donation Suggestions"])


class DonationSuggestion(BaseModel):
    record_id: int
    product_name: str
    quantity_kg: int
    warehouse_name: str
    warehouse_location: Dict[str, float]
    expiration_date: str
    days_until_expiration: int
    suggested_donation_locations: List[Dict[str, Any]]


class DonationResponse(BaseModel):
    total_products_expiring: int
    top_10_by_weight: List[DonationSuggestion]
    message: str


class LocationInfoRequest(BaseModel):
    location_name: str
    location_address: str = None


class LocationInfoResponse(BaseModel):
    location_name: str
    phone: str
    schedule: str
    address: str
    website: str
    additional_info: str
    error: bool = False

    class Config:
        extra = "ignore"  # Ignore extra fields


@router.get("/expiring-products", response_model=DonationResponse)
async def get_donation_suggestions(db: AsyncSession = Depends(get_db_session)):
    """
    Get donation suggestions for products expiring in the next 3 days.
    Returns top 10 products by weight with suggested nearby donation locations.
    """
    try:
        donation_service = DonationService(db)

        # Get products expiring in the next 3 days
        expiring_products = await donation_service.get_products_expiring_soon(days=3)

        if not expiring_products:
            return DonationResponse(
                total_products_expiring=0,
                top_10_by_weight=[],
                message="No products are expiring in the next 3 days.",
            )

        # Get top 10 by weight
        top_10_products = sorted(
            expiring_products, key=lambda x: x["quantity_kg"], reverse=True
        )[:10]

        # Get donation suggestions for each product
        donation_suggestions = []
        for product in top_10_products:
            suggestions = await donation_service.get_donation_suggestions_for_location(
                product["warehouse_location"], product["warehouse_address"]
            )

            donation_suggestions.append(
                DonationSuggestion(
                    record_id=product["record_id"],
                    product_name=product["product_name"],
                    quantity_kg=product["quantity_kg"],
                    warehouse_name=product["warehouse_name"],
                    warehouse_location=product["warehouse_location"],
                    expiration_date=product["expiration_date"],
                    days_until_expiration=product["days_until_expiration"],
                    suggested_donation_locations=suggestions,
                )
            )

        return DonationResponse(
            total_products_expiring=len(expiring_products),
            top_10_by_weight=donation_suggestions,
            message=f"Found {len(expiring_products)} products expiring in the next 3 days. Showing top 10 by weight.",
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error getting donation suggestions: {str(e)}"
        )


@router.post("/location-info", response_model=LocationInfoResponse)
async def get_location_info(request: LocationInfoRequest):
    """
    Get detailed information about a donation location using OpenAI web search.
    Returns contact information, schedule, and other relevant details.
    """
    try:
        # Initialize OpenAI service
        openai_service = OpenAILocationService()

        # Get location information
        location_info = await openai_service.get_location_info(
            request.location_name,
            request.location_address
        )

        # Clean the location_info dictionary to remove any keys with leading underscores
        cleaned_info = {k: v for k, v in location_info.items() if not k.startswith('_')}

        return LocationInfoResponse(**cleaned_info)

    except ValueError as ve:
        # Handle API key or configuration errors
        raise HTTPException(
            status_code=500,
            detail=f"Configuration error: {str(ve)}"
        )
    except Exception as e:
        # Handle other errors
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching location information: {str(e)}"
        )


@router.get("/status")
def get_status():
    """Get the status of the donation suggestions service"""
    return {
        "status": "active",
        "description": "Donation suggestions service for expiring products",
        "features": [
            "Find products expiring in next 3 days",
            "Sort by weight (top 10)",
            "AI-powered location suggestions for donations",
            "Get detailed location information via OpenAI",
        ],
    }
