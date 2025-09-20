from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from src.quote.quote_entity import Quote, QuoteStatus, QuoteModel
from src.user.user_entity import UserModel
from datetime import datetime


class QuoteRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    # --------------------------------------------------------------------------------------------------------------------------------------------------
    # --------------------------------------------------------------------------------------------------------------------------------------------------
    # --------------------------------------------------------------------------------------------------------------------------------------------------

    async def create(self, quote: Quote) -> Quote:
        """Create a new quote"""
        try:
            quote_model = QuoteModel(
                SupplierID=quote.supplier_id,
                ProductID=quote.product_id,
                PdfDocumentPath=quote.pdf_document_path,
                Status=quote.status.value,
                SubmissionDate=quote.submission_date or datetime.utcnow(),
            )

            self.session.add(quote_model)
            await self.session.flush()

            created_quote = self._model_to_entity(quote_model)
            return created_quote

        except SQLAlchemyError as e:
            await self.session.rollback()
            raise Exception(f"Failed to create quote: {str(e)}")

    # --------------------------------------------------------------------------------------------------------------------------------------------------
    # --------------------------------------------------------------------------------------------------------------------------------------------------
    # --------------------------------------------------------------------------------------------------------------------------------------------------

    async def get_by_id(self, quote_id: int) -> Optional[Quote]:
        """Get quote by ID"""
        try:
            result = await self.session.execute(
                select(QuoteModel).where(QuoteModel.QuoteID == quote_id)
            )
            quote_model = result.scalar_one_or_none()

            if not quote_model:
                return None

            return self._model_to_entity(quote_model)

        except SQLAlchemyError as e:
            raise Exception(f"Failed to get quote by ID: {str(e)}")

    # --------------------------------------------------------------------------------------------------------------------------------------------------
    # --------------------------------------------------------------------------------------------------------------------------------------------------
    # --------------------------------------------------------------------------------------------------------------------------------------------------

    async def get_all(self) -> List[Quote]:
        """Get all quotes"""
        try:
            result = await self.session.execute(select(QuoteModel))
            quote_models = result.scalars().all()

            return [self._model_to_entity(model) for model in quote_models]

        except SQLAlchemyError as e:
            raise Exception(f"Failed to get all quotes: {str(e)}")

    # --------------------------------------------------------------------------------------------------------------------------------------------------
    # --------------------------------------------------------------------------------------------------------------------------------------------------
    # --------------------------------------------------------------------------------------------------------------------------------------------------

    async def get_by_supplier_id(self, supplier_id: int) -> List[Quote]:
        """Get quotes by supplier ID"""
        try:
            result = await self.session.execute(
                select(QuoteModel).where(QuoteModel.SupplierID == supplier_id)
            )
            quote_models = result.scalars().all()

            return [self._model_to_entity(model) for model in quote_models]

        except SQLAlchemyError as e:
            raise Exception(f"Failed to get quotes by supplier ID: {str(e)}")

    # --------------------------------------------------------------------------------------------------------------------------------------------------
    # --------------------------------------------------------------------------------------------------------------------------------------------------
    # --------------------------------------------------------------------------------------------------------------------------------------------------

    async def get_by_product_id(self, product_id: int) -> List[Quote]:
        """Get quotes by product ID"""
        try:
            result = await self.session.execute(
                select(QuoteModel).where(QuoteModel.ProductID == product_id)
            )
            quote_models = result.scalars().all()

            return [self._model_to_entity(model) for model in quote_models]

        except SQLAlchemyError as e:
            raise Exception(f"Failed to get quotes by product ID: {str(e)}")

    # --------------------------------------------------------------------------------------------------------------------------------------------------
    # --------------------------------------------------------------------------------------------------------------------------------------------------
    # --------------------------------------------------------------------------------------------------------------------------------------------------

    async def get_pending_by_product_id(self, product_id: int) -> List[Quote]:
        """Get pending quotes by product ID"""
        try:
            result = await self.session.execute(
                select(QuoteModel).where(
                    QuoteModel.ProductID == product_id,
                    QuoteModel.Status == QuoteStatus.PENDING.value,
                )
            )
            quote_models = result.scalars().all()

            return [self._model_to_entity(model) for model in quote_models]

        except SQLAlchemyError as e:
            raise Exception(f"Failed to get pending quotes by product ID: {str(e)}")

    async def get_pending_by_product_id_with_supplier_names(
        self, product_id: int
    ) -> List[tuple]:
        """Get pending quotes by product ID with supplier names"""
        try:
            result = await self.session.execute(
                select(
                    QuoteModel,
                    UserModel.Name.label("supplier_name"),
                )
                .outerjoin(UserModel, QuoteModel.SupplierID == UserModel.UserID)
                .where(
                    QuoteModel.ProductID == product_id,
                    QuoteModel.Status == QuoteStatus.PENDING.value,
                )
            )
            rows = result.all()

            return [
                (self._model_to_entity(row.QuoteModel), row.supplier_name)
                for row in rows
            ]

        except SQLAlchemyError as e:
            raise Exception(
                f"Failed to get pending quotes with supplier names by product ID: {str(e)}"
            )

    async def get_pending_by_product_id_with_supplier_details(
        self, product_id: int
    ) -> List[tuple]:
        """Get pending quotes by product ID with supplier names and tier information"""
        from src.product_record.product_record_repository import ProductRecordRepository

        try:
            result = await self.session.execute(
                select(
                    QuoteModel,
                    UserModel.Name.label("supplier_name"),
                )
                .outerjoin(UserModel, QuoteModel.SupplierID == UserModel.UserID)
                .where(
                    QuoteModel.ProductID == product_id,
                    QuoteModel.Status == QuoteStatus.PENDING.value,
                )
            )
            rows = result.all()

            # Get supplier tiers for all suppliers
            product_record_repo = ProductRecordRepository(self.session)
            supplier_details = []

            for row in rows:
                quote = self._model_to_entity(row.QuoteModel)
                supplier_name = row.supplier_name

                # Get supplier tier
                supplier_tier = "Basic"  # Default
                if quote.supplier_id:
                    try:
                        stats = await product_record_repo.get_supplier_statistics(quote.supplier_id)
                        supplier_tier = stats.get("supplier_tier", "Basic")
                    except Exception:
                        # If we can't get supplier stats, default to Basic
                        pass

                supplier_details.append((quote, supplier_name, supplier_tier))

            return supplier_details

        except SQLAlchemyError as e:
            raise Exception(
                f"Failed to get pending quotes with supplier details by product ID: {str(e)}"
            )

    # --------------------------------------------------------------------------------------------------------------------------------------------------
    # --------------------------------------------------------------------------------------------------------------------------------------------------
    # --------------------------------------------------------------------------------------------------------------------------------------------------

    async def get_by_product_id_and_status(
        self, product_id: int, status: QuoteStatus
    ) -> List[Quote]:
        """Get quotes by product ID and status"""
        try:
            result = await self.session.execute(
                select(QuoteModel).where(
                    QuoteModel.ProductID == product_id,
                    QuoteModel.Status == status.value,
                )
            )
            quote_models = result.scalars().all()

            return [self._model_to_entity(model) for model in quote_models]

        except SQLAlchemyError as e:
            raise Exception(f"Failed to get quotes by product ID and status: {str(e)}")

    # --------------------------------------------------------------------------------------------------------------------------------------------------
    # --------------------------------------------------------------------------------------------------------------------------------------------------
    # --------------------------------------------------------------------------------------------------------------------------------------------------

    async def get_by_status(self, status: QuoteStatus) -> List[Quote]:
        """Get quotes by status"""
        try:
            result = await self.session.execute(
                select(QuoteModel).where(QuoteModel.Status == status.value)
            )
            quote_models = result.scalars().all()

            return [self._model_to_entity(model) for model in quote_models]

        except SQLAlchemyError as e:
            raise Exception(f"Failed to get quotes by status: {str(e)}")

    # --------------------------------------------------------------------------------------------------------------------------------------------------
    # --------------------------------------------------------------------------------------------------------------------------------------------------
    # --------------------------------------------------------------------------------------------------------------------------------------------------

    async def update(self, quote: Quote) -> Quote:
        """Update a quote"""
        try:
            result = await self.session.execute(
                select(QuoteModel).where(QuoteModel.QuoteID == quote.quote_id)
            )
            quote_model = result.scalar_one_or_none()

            if not quote_model:
                raise Exception(f"Quote with ID {quote.quote_id} not found")

            quote_model.SupplierID = quote.supplier_id
            quote_model.ProductID = quote.product_id
            quote_model.PdfDocumentPath = quote.pdf_document_path
            quote_model.Status = quote.status.value

            await self.session.flush()

            return self._model_to_entity(quote_model)

        except SQLAlchemyError as e:
            await self.session.rollback()
            raise Exception(f"Failed to update quote: {str(e)}")

    # --------------------------------------------------------------------------------------------------------------------------------------------------
    # --------------------------------------------------------------------------------------------------------------------------------------------------
    # --------------------------------------------------------------------------------------------------------------------------------------------------

    async def delete(self, quote_id: int) -> bool:
        """Delete a quote"""
        try:
            result = await self.session.execute(
                select(QuoteModel).where(QuoteModel.QuoteID == quote_id)
            )
            quote_model = result.scalar_one_or_none()

            if not quote_model:
                return False

            await self.session.delete(quote_model)
            await self.session.flush()

            return True

        except SQLAlchemyError as e:
            await self.session.rollback()
            raise Exception(f"Failed to delete quote: {str(e)}")

    # --------------------------------------------------------------------------------------------------------------------------------------------------
    # --------------------------------------------------------------------------------------------------------------------------------------------------
    # --------------------------------------------------------------------------------------------------------------------------------------------------

    async def get_approved_suppliers_for_product(self, product_id: int) -> List[dict]:
        """Get approved suppliers for a specific product with supplier details"""
        try:
            result = await self.session.execute(
                select(
                    QuoteModel.SupplierID,
                    UserModel.Name.label("supplier_name"),
                    UserModel.ContactInfo.label("supplier_contact"),
                    QuoteModel.SubmissionDate,
                )
                .join(UserModel, QuoteModel.SupplierID == UserModel.UserID)
                .where(
                    QuoteModel.ProductID == product_id,
                    QuoteModel.Status == QuoteStatus.APPROVED.value,
                )
                .distinct(QuoteModel.SupplierID)
                .order_by(QuoteModel.SupplierID, QuoteModel.SubmissionDate.desc())
            )

            rows = result.all()
            return [
                {
                    "supplier_id": row.SupplierID,
                    "supplier_name": row.supplier_name,
                    "supplier_contact": row.supplier_contact,
                    "approval_date": row.SubmissionDate,
                }
                for row in rows
            ]

        except SQLAlchemyError as e:
            raise Exception(f"Failed to get approved suppliers for product: {str(e)}")

    # --------------------------------------------------------------------------------------------------------------------------------------------------
    # --------------------------------------------------------------------------------------------------------------------------------------------------
    # --------------------------------------------------------------------------------------------------------------------------------------------------

    def _model_to_entity(self, quote_model: QuoteModel) -> Quote:
        """Convert SQLAlchemy model to domain entity"""
        return Quote(
            quote_id=quote_model.QuoteID,
            supplier_id=quote_model.SupplierID,
            product_id=quote_model.ProductID,
            pdf_document_path=quote_model.PdfDocumentPath,
            status=QuoteStatus(quote_model.Status),
            submission_date=quote_model.SubmissionDate,
        )
