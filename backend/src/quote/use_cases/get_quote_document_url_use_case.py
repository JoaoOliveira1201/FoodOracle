from typing import Optional
from datetime import timedelta
from src.quote.quote_repository import QuoteRepository
from src.base.minio_service import MinioService


class GetQuoteDocumentUrlUseCase:
    def __init__(self, quote_repository: QuoteRepository, minio_service: MinioService):
        self._quote_repository = quote_repository
        self._minio_service = minio_service

    async def execute(self, quote_id: int, expires_hours: int = 24) -> Optional[str]:
        """Get a presigned URL for the quote document"""
        quote = await self._quote_repository.get_by_id(quote_id)
        if not quote or not quote.pdf_document_path:
            return None

        # Check if file exists in Minio
        if not self._minio_service.file_exists(quote.pdf_document_path):
            return None

        # Get presigned URL
        expires = timedelta(hours=expires_hours)
        return self._minio_service.get_file_url(quote.pdf_document_path, expires)
