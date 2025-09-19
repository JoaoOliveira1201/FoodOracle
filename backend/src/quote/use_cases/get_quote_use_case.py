from typing import List, Optional
from src.quote.quote_repository import QuoteRepository
from src.quote.quote_dto import QuoteResponseDto, quote_to_response_dto
from src.quote.quote_entity import QuoteStatus


class GetQuoteUseCase:
    def __init__(self, quote_repository: QuoteRepository):
        self._quote_repository = quote_repository

    async def execute_by_id(self, quote_id: int) -> Optional[QuoteResponseDto]:
        """Get quote by ID"""
        quote = await self._quote_repository.get_by_id(quote_id)
        if not quote:
            return None

        return quote_to_response_dto(quote)

    async def execute_all(self) -> List[QuoteResponseDto]:
        """Get all quotes"""
        quotes = await self._quote_repository.get_all()
        return [quote_to_response_dto(quote) for quote in quotes]

    async def execute_by_supplier_id(self, supplier_id: int) -> List[QuoteResponseDto]:
        """Get quotes by supplier ID"""
        quotes = await self._quote_repository.get_by_supplier_id(supplier_id)
        return [quote_to_response_dto(quote) for quote in quotes]

    async def execute_by_product_id(self, product_id: int) -> List[QuoteResponseDto]:
        """Get quotes by product ID"""
        quotes = await self._quote_repository.get_by_product_id(product_id)
        return [quote_to_response_dto(quote) for quote in quotes]

    async def execute_by_status(self, status: QuoteStatus) -> List[QuoteResponseDto]:
        """Get quotes by status"""
        quotes = await self._quote_repository.get_by_status(status)
        return [quote_to_response_dto(quote) for quote in quotes]

    async def execute_by_product_id_and_status(
        self, product_id: int, status: QuoteStatus
    ) -> List[QuoteResponseDto]:
        """Get quotes by product ID and status"""
        quotes = await self._quote_repository.get_by_product_id_and_status(
            product_id, status
        )
        return [quote_to_response_dto(quote) for quote in quotes]
