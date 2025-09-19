from typing import List, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.exc import SQLAlchemyError
from src.warehouse_transfer.warehouse_transfer_entity import (
    WarehouseTransfer,
    TransferStatus,
    TransferReason,
    WarehouseTransferModel,
)


class WarehouseTransferRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, transfer: WarehouseTransfer) -> WarehouseTransfer:
        """Create a new warehouse transfer"""
        try:
            transfer_model = WarehouseTransferModel(
                RecordID=transfer.record_id,
                OriginWarehouseID=transfer.origin_warehouse_id,
                DestinationWarehouseID=transfer.destination_warehouse_id,
                TruckID=transfer.truck_id,
                Reason=transfer.reason.value if transfer.reason else None,
                Status=transfer.status.value,
                EstimatedTime=transfer.estimated_time,
                ActualTime=transfer.actual_time,
                RequestedDate=transfer.requested_date or datetime.utcnow(),
                StartDate=transfer.start_date,
                CompletedDate=transfer.completed_date,
                Notes=transfer.notes,
            )

            self.session.add(transfer_model)
            await self.session.flush()

            created_transfer = self._model_to_entity(transfer_model)
            return created_transfer

        except SQLAlchemyError as e:
            await self.session.rollback()
            raise Exception(f"Failed to create warehouse transfer: {str(e)}")

    async def get_by_id(self, transfer_id: int) -> Optional[WarehouseTransfer]:
        """Get warehouse transfer by ID"""
        try:
            result = await self.session.execute(
                select(WarehouseTransferModel).where(
                    WarehouseTransferModel.TransferID == transfer_id
                )
            )
            transfer_model = result.scalar_one_or_none()

            if not transfer_model:
                return None

            return self._model_to_entity(transfer_model)

        except SQLAlchemyError as e:
            raise Exception(f"Failed to get warehouse transfer by ID: {str(e)}")

    async def get_all(self) -> List[WarehouseTransfer]:
        """Get all warehouse transfers"""
        try:
            result = await self.session.execute(select(WarehouseTransferModel))
            transfer_models = result.scalars().all()

            return [self._model_to_entity(model) for model in transfer_models]

        except SQLAlchemyError as e:
            raise Exception(f"Failed to get all warehouse transfers: {str(e)}")

    async def get_by_status(self, status: TransferStatus) -> List[WarehouseTransfer]:
        """Get warehouse transfers by status"""
        try:
            result = await self.session.execute(
                select(WarehouseTransferModel).where(
                    WarehouseTransferModel.Status == status.value
                )
            )
            transfer_models = result.scalars().all()

            return [self._model_to_entity(model) for model in transfer_models]

        except SQLAlchemyError as e:
            raise Exception(f"Failed to get warehouse transfers by status: {str(e)}")

    async def get_by_warehouse(
        self, warehouse_id: int, is_origin: bool = True
    ) -> List[WarehouseTransfer]:
        """Get warehouse transfers by origin or destination warehouse"""
        try:
            if is_origin:
                condition = WarehouseTransferModel.OriginWarehouseID == warehouse_id
            else:
                condition = (
                    WarehouseTransferModel.DestinationWarehouseID == warehouse_id
                )

            result = await self.session.execute(
                select(WarehouseTransferModel).where(condition)
            )
            transfer_models = result.scalars().all()

            return [self._model_to_entity(model) for model in transfer_models]

        except SQLAlchemyError as e:
            raise Exception(f"Failed to get warehouse transfers by warehouse: {str(e)}")

    async def get_by_truck_id(self, truck_id: int) -> List[WarehouseTransfer]:
        """Get warehouse transfers by truck ID"""
        try:
            result = await self.session.execute(
                select(WarehouseTransferModel).where(
                    WarehouseTransferModel.TruckID == truck_id
                )
            )
            transfer_models = result.scalars().all()

            return [self._model_to_entity(model) for model in transfer_models]

        except SQLAlchemyError as e:
            raise Exception(f"Failed to get warehouse transfers by truck ID: {str(e)}")

    async def update(
        self, transfer_id: int, transfer: WarehouseTransfer
    ) -> Optional[WarehouseTransfer]:
        """Update an existing warehouse transfer"""
        try:
            stmt = (
                update(WarehouseTransferModel)
                .where(WarehouseTransferModel.TransferID == transfer_id)
                .values(
                    TruckID=transfer.truck_id,
                    Status=transfer.status.value,
                    EstimatedTime=transfer.estimated_time,
                    ActualTime=transfer.actual_time,
                    StartDate=transfer.start_date,
                    CompletedDate=transfer.completed_date,
                    Notes=transfer.notes,
                )
                .returning(WarehouseTransferModel)
            )

            result = await self.session.execute(stmt)
            updated_model = result.scalar_one_or_none()

            if updated_model is None:
                return None

            return self._model_to_entity(updated_model)

        except SQLAlchemyError as e:
            await self.session.rollback()
            raise Exception(f"Failed to update warehouse transfer: {str(e)}")

    def _model_to_entity(self, model: WarehouseTransferModel) -> WarehouseTransfer:
        """Convert SQLAlchemy model to domain entity"""
        return WarehouseTransfer(
            transfer_id=model.TransferID,
            record_id=model.RecordID,
            origin_warehouse_id=model.OriginWarehouseID,
            destination_warehouse_id=model.DestinationWarehouseID,
            truck_id=model.TruckID,
            reason=TransferReason(model.Reason) if model.Reason else None,
            status=TransferStatus(model.Status),
            estimated_time=model.EstimatedTime,
            actual_time=model.ActualTime,
            requested_date=model.RequestedDate,
            start_date=model.StartDate,
            completed_date=model.CompletedDate,
            notes=model.Notes,
        )
