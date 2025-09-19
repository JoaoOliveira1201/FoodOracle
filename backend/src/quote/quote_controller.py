from fastapi import (
    APIRouter,
    HTTPException,
    status,
    Depends,
    UploadFile,
    File,
    Query,
    Form,
)
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from src.quote.quote_entity import QuoteStatus
from src.quote.quote_repository import QuoteRepository
from src.base.minio_service import get_quote_minio_service, MinioService
from src.quote.use_cases.create_quote_use_case import CreateQuoteUseCase
from src.quote.use_cases.get_quote_use_case import GetQuoteUseCase
from src.quote.use_cases.update_quote_status_use_case import UpdateQuoteStatusUseCase
from src.quote.use_cases.delete_quote_use_case import DeleteQuoteUseCase
from src.quote.use_cases.get_quote_document_url_use_case import (
    GetQuoteDocumentUrlUseCase,
)
from src.quote.quote_dto import (
    CreateQuoteDto,
    QuoteResponseDto,
    CreateQuoteResponseDto,
    UpdateQuoteStatusDto,
    ApprovedSupplierDto,
    ApprovedSuppliersResponseDto,
)
from src.database import get_db_session

router = APIRouter(prefix="/quotes", tags=["quotes"])


def get_quote_repository(
    session: AsyncSession = Depends(get_db_session),
) -> QuoteRepository:
    return QuoteRepository(session)


def get_minio_service():
    return get_quote_minio_service()


def get_create_quote_use_case(
    repo: QuoteRepository = Depends(get_quote_repository),
    minio_service: MinioService = Depends(get_minio_service),
) -> CreateQuoteUseCase:
    return CreateQuoteUseCase(repo, minio_service)


def get_get_quote_use_case(
    repo: QuoteRepository = Depends(get_quote_repository),
) -> GetQuoteUseCase:
    return GetQuoteUseCase(repo)


def get_update_quote_status_use_case(
    repo: QuoteRepository = Depends(get_quote_repository),
) -> UpdateQuoteStatusUseCase:
    return UpdateQuoteStatusUseCase(repo)


def get_delete_quote_use_case(
    repo: QuoteRepository = Depends(get_quote_repository),
    minio_service: MinioService = Depends(get_minio_service),
) -> DeleteQuoteUseCase:
    return DeleteQuoteUseCase(repo, minio_service)


def get_get_quote_document_url_use_case(
    repo: QuoteRepository = Depends(get_quote_repository),
    minio_service: MinioService = Depends(get_minio_service),
) -> GetQuoteDocumentUrlUseCase:
    return GetQuoteDocumentUrlUseCase(repo, minio_service)


@router.post(
    "/", response_model=CreateQuoteResponseDto, status_code=status.HTTP_201_CREATED
)
async def create_quote(
    supplier_id: Optional[int] = Form(None),
    product_id: Optional[int] = Form(None),
    status: QuoteStatus = Form(QuoteStatus.PENDING),
    file: Optional[UploadFile] = File(None),
    create_quote_use_case: CreateQuoteUseCase = Depends(get_create_quote_use_case),
) -> CreateQuoteResponseDto:
    """Create a new quote with optional PDF document"""
    try:
        quote_dto = CreateQuoteDto(
            supplier_id=supplier_id, product_id=product_id, status=status
        )
        return await create_quote_use_case.execute(quote_dto, file)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create quote: {str(e)}",
        )


@router.get("/{quote_id}", response_model=QuoteResponseDto)
async def get_quote(
    quote_id: int, get_quote_use_case: GetQuoteUseCase = Depends(get_get_quote_use_case)
) -> QuoteResponseDto:
    """Get quote by ID"""
    quote = await get_quote_use_case.execute_by_id(quote_id)
    if not quote:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Quote with ID {quote_id} not found",
        )
    return quote


@router.get("/", response_model=List[QuoteResponseDto])
async def get_quotes(
    supplier_id: Optional[int] = Query(None),
    product_id: Optional[int] = Query(None),
    status: Optional[QuoteStatus] = Query(None),
    get_quote_use_case: GetQuoteUseCase = Depends(get_get_quote_use_case),
) -> List[QuoteResponseDto]:
    """Get quotes with optional filters"""
    if supplier_id:
        return await get_quote_use_case.execute_by_supplier_id(supplier_id)
    elif product_id and status:
        return await get_quote_use_case.execute_by_product_id_and_status(
            product_id, status
        )
    elif product_id:
        return await get_quote_use_case.execute_by_product_id(product_id)
    elif status:
        return await get_quote_use_case.execute_by_status(status)
    else:
        return await get_quote_use_case.execute_all()


@router.patch("/{quote_id}/status", response_model=QuoteResponseDto)
async def update_quote_status(
    quote_id: int,
    update_dto: UpdateQuoteStatusDto,
    update_quote_status_use_case: UpdateQuoteStatusUseCase = Depends(
        get_update_quote_status_use_case
    ),
) -> QuoteResponseDto:
    """Update quote status"""
    try:
        updated_quote = await update_quote_status_use_case.execute(quote_id, update_dto)
        if not updated_quote:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Quote with ID {quote_id} not found",
            )
        return updated_quote
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update quote status: {str(e)}",
        )


@router.get("/{quote_id}/document/url")
async def get_quote_document_url(
    quote_id: int,
    expires_hours: int = Query(default=24, ge=1, le=168),  # 1 hour to 1 week
    get_quote_document_url_use_case: GetQuoteDocumentUrlUseCase = Depends(
        get_get_quote_document_url_use_case
    ),
) -> dict:
    """Get presigned URL for quote document"""
    try:
        url = await get_quote_document_url_use_case.execute(quote_id, expires_hours)
        if not url:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Quote document not found for quote ID {quote_id}",
            )
        return {"download_url": url, "expires_in_hours": expires_hours}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get document URL: {str(e)}",
        )


@router.get("/{quote_id}/document")
async def get_quote_document(
    quote_id: int,
    quote_repository: QuoteRepository = Depends(get_quote_repository),
    minio_service: MinioService = Depends(get_minio_service),
):
    """Directly serve the quote document"""
    try:
        # Get the quote
        quote = await quote_repository.get_by_id(quote_id)
        if not quote or not quote.pdf_document_path:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Quote document not found for quote ID {quote_id}",
            )

        # Check if PDF exists in MinIO
        if not minio_service.file_exists(quote.pdf_document_path):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document file not found in storage for quote ID {quote_id}",
            )

        # Get the PDF data from MinIO
        try:
            response = minio_service.client.get_object(
                minio_service.bucket_name, quote.pdf_document_path
            )

            # Read the PDF data
            pdf_data = response.read()

            # Return the PDF with proper headers
            from fastapi.responses import Response

            return Response(
                content=pdf_data,
                media_type="application/pdf",
                headers={
                    "Content-Disposition": f"attachment; filename=quote_{quote_id}.pdf"
                },
            )

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to retrieve document from storage: {str(e)}",
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get document: {str(e)}",
        )


@router.delete("/{quote_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_quote(
    quote_id: int,
    delete_quote_use_case: DeleteQuoteUseCase = Depends(get_delete_quote_use_case),
):
    """Delete a quote"""
    try:
        deleted = await delete_quote_use_case.execute(quote_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Quote with ID {quote_id} not found",
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete quote: {str(e)}",
        )


@router.get(
    "/product/{product_id}/approved-suppliers",
    response_model=ApprovedSuppliersResponseDto,
)
async def get_approved_suppliers_for_product(
    product_id: int,
    quote_repository: QuoteRepository = Depends(get_quote_repository),
):
    """Get approved suppliers for a specific product"""
    try:
        approved_suppliers_data = (
            await quote_repository.get_approved_suppliers_for_product(product_id)
        )

        approved_suppliers = [
            ApprovedSupplierDto(
                supplier_id=supplier["supplier_id"],
                supplier_name=supplier["supplier_name"],
                supplier_contact=supplier["supplier_contact"],
                approval_date=supplier["approval_date"],
            )
            for supplier in approved_suppliers_data
        ]

        return ApprovedSuppliersResponseDto(
            product_id=product_id,
            approved_suppliers=approved_suppliers,
            total_approved=len(approved_suppliers),
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get approved suppliers: {str(e)}",
        )
