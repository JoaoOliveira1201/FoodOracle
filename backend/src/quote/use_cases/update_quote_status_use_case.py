from typing import Optional
from src.quote.quote_repository import QuoteRepository
from src.quote.quote_dto import (
    UpdateQuoteStatusDto,
    QuoteResponseDto,
    quote_to_response_dto,
)


class UpdateQuoteStatusUseCase:
    def __init__(self, quote_repository: QuoteRepository):
        self._quote_repository = quote_repository

    async def execute(
        self, quote_id: int, update_dto: UpdateQuoteStatusDto
    ) -> Optional[QuoteResponseDto]:
        """Update quote status"""
        quote = await self._quote_repository.get_by_id(quote_id)
        if not quote:
            return None

        quote.status = update_dto.status
        updated_quote = await self._quote_repository.update(quote)

        return quote_to_response_dto(updated_quote)
