from typing import Optional
from fastapi import UploadFile
from src.quote.quote_entity import Quote, QuoteStatus
from src.quote.quote_repository import QuoteRepository
from src.quote.quote_dto import CreateQuoteDto, CreateQuoteResponseDto
from src.base.minio_service import MinioService, FileType
from datetime import datetime


class CreateQuoteUseCase:
    def __init__(self, quote_repository: QuoteRepository, minio_service: MinioService):
        self._quote_repository = quote_repository
        self._minio_service = minio_service

    async def execute(
        self, create_quote_dto: CreateQuoteDto, file: Optional[UploadFile] = None
    ) -> CreateQuoteResponseDto:
        """Create a new quote with optional PDF document"""
        # File validation is handled by MinioService with FileType.PDF

        # First create the quote without the file path
        quote = Quote(
            quote_id=None,
            supplier_id=create_quote_dto.supplier_id,
            product_id=create_quote_dto.product_id,
            pdf_document_path=None,
            status=create_quote_dto.status,
            submission_date=datetime.utcnow(),
        )

        created_quote = await self._quote_repository.create(quote)

        # Upload file if provided and update quote
        if file and file.size and file.size > 0:
            try:
                file_path = await self._minio_service.upload_file(
                    file, f"quote_{created_quote.quote_id}", FileType.PDF
                )
                created_quote.pdf_document_path = file_path
                created_quote = await self._quote_repository.update(created_quote)
            except Exception as e:
                # If file upload fails, delete the created quote to maintain consistency
                await self._quote_repository.delete(created_quote.quote_id)
                raise Exception(f"Failed to upload document: {str(e)}")

        return CreateQuoteResponseDto(
            quote_id=created_quote.quote_id,
            message="Quote created successfully"
            + (" with document" if created_quote.pdf_document_path else ""),
        )
