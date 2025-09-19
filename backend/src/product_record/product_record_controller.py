from fastapi import (
    APIRouter,
    HTTPException,
    status,
    Depends,
    Header,
    UploadFile,
    File,
    Form,
)
from fastapi.responses import StreamingResponse
from typing import List, Optional
import io
from sqlalchemy.ext.asyncio import AsyncSession
from src.product_record.product_record_entity import (
    QualityClassification,
    ProductRecordStatus,
)
from src.product_record.product_record_repository import ProductRecordRepository
from src.base.minio_service import get_product_record_minio_service
from src.user.user_repository import UserRepository
from src.product.product_repository import ProductRepository
from src.warehouse.warehouse_repository import WarehouseRepository
from src.product_record.use_cases.create_product_record_use_case import (
    CreateProductRecordUseCase,
)
from src.product_record.use_cases.get_product_record_use_case import (
    GetProductRecordUseCase,
)
from src.product_record.use_cases.get_product_record_image_url_use_case import (
    GetProductRecordImageUrlUseCase,
)
from src.product_record.use_cases.update_product_record_use_case import (
    UpdateProductRecordUseCase,
)
from src.product_record.use_cases.get_buyer_stock_use_case import (
    GetBuyerStockUseCase,
)
from src.product_record.use_cases.expire_products_use_case import (
    ExpireProductsUseCase,
)
from src.product_record.product_record_dto import (
    CreateProductRecordDto,
    UpdateProductRecordDto,
    ProductRecordResponseDto,
    CreateProductRecordResponseDto,
    ProductMetricsDto,
    SupplierStatisticsDto,
    BuyerStockResponseDto,
    product_record_to_response_dto,
)
from src.database import get_db_session

# Create router
router = APIRouter(prefix="/product-records", tags=["product-records"])


# Dependencies
def get_product_record_repository(
    session: AsyncSession = Depends(get_db_session),
) -> ProductRecordRepository:
    return ProductRecordRepository(session)


def get_user_repository(
    session: AsyncSession = Depends(get_db_session),
) -> UserRepository:
    return UserRepository(session)


def get_product_repository(
    session: AsyncSession = Depends(get_db_session),
) -> ProductRepository:
    return ProductRepository(session)


def get_warehouse_repository(
    session: AsyncSession = Depends(get_db_session),
) -> WarehouseRepository:
    return WarehouseRepository(session)


def get_minio_service():
    return get_product_record_minio_service()


def get_create_product_record_use_case(
    product_record_repo: ProductRecordRepository = Depends(
        get_product_record_repository
    ),
    user_repo: UserRepository = Depends(get_user_repository),
    product_repo: ProductRepository = Depends(get_product_repository),
    warehouse_repo: WarehouseRepository = Depends(get_warehouse_repository),
    minio_service=Depends(get_minio_service),
) -> CreateProductRecordUseCase:
    return CreateProductRecordUseCase(
        product_record_repo, user_repo, product_repo, warehouse_repo, minio_service
    )


def get_get_product_record_use_case(
    repo: ProductRecordRepository = Depends(get_product_record_repository),
) -> GetProductRecordUseCase:
    return GetProductRecordUseCase(repo)


def get_update_product_record_use_case(
    product_record_repo: ProductRecordRepository = Depends(
        get_product_record_repository
    ),
    user_repo: UserRepository = Depends(get_user_repository),
    warehouse_repo: WarehouseRepository = Depends(get_warehouse_repository),
    product_repo: ProductRepository = Depends(get_product_repository),
) -> UpdateProductRecordUseCase:
    return UpdateProductRecordUseCase(
        product_record_repo, user_repo, warehouse_repo, product_repo
    )


def get_get_product_record_image_url_use_case(
    product_record_repo: ProductRecordRepository = Depends(
        get_product_record_repository
    ),
    minio_service=Depends(get_minio_service),
) -> GetProductRecordImageUrlUseCase:
    return GetProductRecordImageUrlUseCase(product_record_repo, minio_service)


def get_buyer_stock_use_case(
    product_record_repo: ProductRecordRepository = Depends(
        get_product_record_repository
    ),
) -> GetBuyerStockUseCase:
    return GetBuyerStockUseCase(product_record_repo)


def get_expire_products_use_case() -> ExpireProductsUseCase:
    return ExpireProductsUseCase()


@router.post(
    "/",
    response_model=CreateProductRecordResponseDto,
    status_code=status.HTTP_201_CREATED,
)
async def create_product_record(
    product_id: int = Form(...),
    warehouse_id: Optional[int] = Form(None),
    quantity_kg: Optional[int] = Form(None),
    quality_classification: Optional[QualityClassification] = Form(None),
    status: ProductRecordStatus = Form(ProductRecordStatus.IN_STOCK),
    supplier_user_id: int = Form(...),
    image_file: Optional[UploadFile] = File(None),
    create_product_record_use_case: CreateProductRecordUseCase = Depends(
        get_create_product_record_use_case
    ),
) -> CreateProductRecordResponseDto:
    """Create a new product record with optional image"""
    try:
        product_record_dto = CreateProductRecordDto(
            product_id=product_id,
            warehouse_id=warehouse_id,
            quantity_kg=quantity_kg,
            quality_classification=quality_classification,
            status=status,
        )
        return await create_product_record_use_case.execute(
            product_record_dto, supplier_user_id, image_file
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create product record: {str(e)}",
        )


@router.get("/{record_id}", response_model=ProductRecordResponseDto)
async def get_product_record(
    record_id: int,
    get_product_record_use_case: GetProductRecordUseCase = Depends(
        get_get_product_record_use_case
    ),
) -> ProductRecordResponseDto:
    """Get product record by ID"""
    product_record = await get_product_record_use_case.execute_by_id(record_id)
    if not product_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product record with ID {record_id} not found",
        )
    return product_record


@router.get("/", response_model=List[ProductRecordResponseDto])
async def get_all_product_records(
    get_product_record_use_case: GetProductRecordUseCase = Depends(
        get_get_product_record_use_case
    ),
) -> List[ProductRecordResponseDto]:
    """Get all product records"""
    return await get_product_record_use_case.execute_all()


@router.get("/supplier/{supplier_id}", response_model=List[ProductRecordResponseDto])
async def get_product_records_by_supplier(
    supplier_id: int,
    get_product_record_use_case: GetProductRecordUseCase = Depends(
        get_get_product_record_use_case
    ),
) -> List[ProductRecordResponseDto]:
    """Get product records by supplier ID"""
    return await get_product_record_use_case.execute_by_supplier_id(supplier_id)


@router.get("/product/{product_id}", response_model=List[ProductRecordResponseDto])
async def get_product_records_by_product(
    product_id: int,
    get_product_record_use_case: GetProductRecordUseCase = Depends(
        get_get_product_record_use_case
    ),
) -> List[ProductRecordResponseDto]:
    """Get product records by product ID"""
    return await get_product_record_use_case.execute_by_product_id(product_id)


@router.get("/warehouse/{warehouse_id}", response_model=List[ProductRecordResponseDto])
async def get_product_records_by_warehouse(
    warehouse_id: int,
    get_product_record_use_case: GetProductRecordUseCase = Depends(
        get_get_product_record_use_case
    ),
) -> List[ProductRecordResponseDto]:
    """Get product records by warehouse ID"""
    return await get_product_record_use_case.execute_by_warehouse_id(warehouse_id)


@router.get("/status/{status}", response_model=List[ProductRecordResponseDto])
async def get_product_records_by_status(
    status: ProductRecordStatus,
    get_product_record_use_case: GetProductRecordUseCase = Depends(
        get_get_product_record_use_case
    ),
) -> List[ProductRecordResponseDto]:
    """Get product records by status"""
    return await get_product_record_use_case.execute_by_status(status)


@router.get(
    "/quality/{quality_classification}", response_model=List[ProductRecordResponseDto]
)
async def get_product_records_by_quality_classification(
    quality_classification: QualityClassification,
    get_product_record_use_case: GetProductRecordUseCase = Depends(
        get_get_product_record_use_case
    ),
) -> List[ProductRecordResponseDto]:
    """Get product records by quality classification"""
    return await get_product_record_use_case.execute_by_quality_classification(
        quality_classification
    )


@router.put("/{record_id}", response_model=ProductRecordResponseDto)
async def update_product_record(
    record_id: int,
    update_dto: UpdateProductRecordDto,
    update_product_record_use_case: UpdateProductRecordUseCase = Depends(
        get_update_product_record_use_case
    ),
) -> ProductRecordResponseDto:
    """Update a product record"""
    try:
        product_record = await update_product_record_use_case.execute(
            record_id, update_dto
        )
        if not product_record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product record with ID {record_id} not found",
            )
        return product_record
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update product record: {str(e)}",
        )


@router.get("/{record_id}/image/url")
async def get_product_record_image_url(
    record_id: int,
    expires_hours: int = 24,
    get_product_record_image_url_use_case: GetProductRecordImageUrlUseCase = Depends(
        get_get_product_record_image_url_use_case
    ),
) -> dict:
    """Get presigned URL for product record image"""
    try:
        url = await get_product_record_image_url_use_case.execute(
            record_id, expires_hours
        )
        if not url:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product record image not found for record ID {record_id}",
            )
        return {"image_url": url, "expires_in_hours": expires_hours}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get image URL: {str(e)}",
        )


@router.get("/{record_id}/image")
async def get_product_record_image(
    record_id: int,
    product_record_repo: ProductRecordRepository = Depends(
        get_product_record_repository
    ),
    minio_service=Depends(get_minio_service),
):
    """Directly serve the product record image"""
    try:
        # Get the product record
        product_record = await product_record_repo.get_by_id(record_id)
        if not product_record or not product_record.image_path:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product record image not found for record ID {record_id}",
            )

        # Check if image exists in MinIO
        if not minio_service.file_exists(product_record.image_path):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Image file not found in storage for record ID {record_id}",
            )

        # Get the image data from MinIO
        try:
            response = minio_service.client.get_object(
                minio_service.bucket_name, product_record.image_path
            )

            # Read the image data
            image_data = response.read()

            # Determine content type based on file extension
            file_extension = product_record.image_path.lower().split(".")[-1]
            content_type_map = {
                "jpg": "image/jpeg",
                "jpeg": "image/jpeg",
                "png": "image/png",
                "gif": "image/gif",
                "webp": "image/webp",
            }
            content_type = content_type_map.get(file_extension, "image/jpeg")

            # Return the image as a streaming response
            return StreamingResponse(
                io.BytesIO(image_data),
                media_type=content_type,
                headers={"Cache-Control": "public, max-age=3600"},  # Cache for 1 hour
            )

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to retrieve image from storage: {str(e)}",
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get image: {str(e)}",
        )


@router.get("/product/{product_id}/metrics", response_model=ProductMetricsDto)
async def get_product_metrics(
    product_id: int,
    session: AsyncSession = Depends(get_db_session),
    product_record_repository: ProductRecordRepository = Depends(
        get_product_record_repository
    ),
):
    """Get comprehensive metrics for a specific product"""
    try:
        metrics = await product_record_repository.get_product_metrics(product_id)
        return ProductMetricsDto(**metrics)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get product metrics: {str(e)}",
        )


@router.get("/supplier/{supplier_id}/statistics", response_model=SupplierStatisticsDto)
async def get_supplier_statistics(
    supplier_id: int,
    session: AsyncSession = Depends(get_db_session),
    product_record_repository: ProductRecordRepository = Depends(
        get_product_record_repository
    ),
):
    """Get comprehensive statistics for a specific supplier"""
    try:
        statistics = await product_record_repository.get_supplier_statistics(
            supplier_id
        )
        return SupplierStatisticsDto(**statistics)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get supplier statistics: {str(e)}",
        )


@router.get("/buyer/available-items", response_model=BuyerStockResponseDto)
async def get_buyer_available_items(
    warehouse_id: Optional[int] = None,
    buyer_stock_use_case: GetBuyerStockUseCase = Depends(get_buyer_stock_use_case),
):
    """Get available items for buyers with calculated pricing and discounts"""
    try:
        return await buyer_stock_use_case.execute(warehouse_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get buyer available items: {str(e)}",
        )


@router.post("/expire-products")
async def expire_old_products(
    expire_products_use_case: ExpireProductsUseCase = Depends(
        get_expire_products_use_case
    ),
):
    """Manually trigger expiration of products that have exceeded their shelf life"""
    try:
        result = expire_products_use_case.execute()
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to expire products: {str(e)}",
        )


@router.get("/near-expiration")
async def get_products_near_expiration(
    days_threshold: int = 3,
    expire_products_use_case: ExpireProductsUseCase = Depends(
        get_expire_products_use_case
    ),
):
    """Get products that are near expiration within the specified threshold"""
    try:
        products = expire_products_use_case.get_products_near_expiration(days_threshold)
        return {"threshold_days": days_threshold, "products_near_expiration": products}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get products near expiration: {str(e)}",
        )
