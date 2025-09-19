from src.quote.quote_repository import QuoteRepository
from src.base.minio_service import MinioService


class DeleteQuoteUseCase:
    def __init__(self, quote_repository: QuoteRepository, minio_service: MinioService):
        self._quote_repository = quote_repository
        self._minio_service = minio_service

    async def execute(self, quote_id: int) -> bool:
        """Delete a quote and its associated file"""
        quote = await self._quote_repository.get_by_id(quote_id)
        if not quote:
            return False

        # Delete file from Minio if exists
        if quote.pdf_document_path:
            self._minio_service.delete_file(quote.pdf_document_path)

        # Delete quote from database
        return await self._quote_repository.delete(quote_id)
