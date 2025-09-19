from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import base64
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db_session
from src.product.product_repository import ProductRepository
from .src.bedrock_client import classify_image_with_bedrock
from .src.config import QUALITY_SYSTEM_PROMPT

router = APIRouter(prefix="/quality-control", tags=["Quality Control"])


class ClassificationResponse(BaseModel):
    product_id: int
    product_name: str
    classification: str
    raw_response: Optional[str] = None
    error: Optional[str] = None


def get_image_format(content_type: str) -> str:
    """Determine image format from content type"""
    if content_type == "image/jpeg":
        return "jpeg"
    elif content_type == "image/png":
        return "png"
    elif content_type == "image/gif":
        return "gif"
    elif content_type == "image/webp":
        return "webp"
    else:
        # Default to jpeg if format is unknown
        return "jpeg"


@router.post("/classify", response_model=ClassificationResponse)
async def classify_product_quality(
    product_id: int = Form(...),
    image: UploadFile = File(...),
    db: AsyncSession = Depends(get_db_session),
):
    """
    Classify the quality of a product based on an uploaded image and product ID
    """
    try:
        # Get product information from database
        product_repo = ProductRepository(db)
        product = await product_repo.get_by_id(product_id)

        if not product:
            raise HTTPException(
                status_code=404, detail=f"Product with ID {product_id} not found"
            )

        # Read and encode image as base64
        image_bytes = await image.read()
        image_b64 = base64.b64encode(image_bytes).decode("utf-8")

        # Determine image format
        image_format = get_image_format(image.content_type)

        # Classify using Bedrock Nova
        result = classify_image_with_bedrock(
            product_name=product.name,
            image_b64=image_b64,
            image_format=image_format,
            system_prompt=QUALITY_SYSTEM_PROMPT,
        )

        # Build response
        if "error" in result:
            return ClassificationResponse(
                product_id=product_id,
                product_name=product.name,
                classification="ERROR",
                error=result["error"],
            )
        else:
            return ClassificationResponse(
                product_id=product_id,
                product_name=product.name,
                classification=result.get("classification", "UNKNOWN"),
                raw_response=result.get("raw_response"),
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error processing classification: {str(e)}"
        )
