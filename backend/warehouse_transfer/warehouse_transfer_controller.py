from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from src.database.connection import get_db_session
from src.warehouse_transfer.warehouse_transfer_dto import (
    CreateWarehouseTransferDto,
    UpdateWarehouseTransferDto,
    WarehouseTransferResponseDto,
    CreateWarehouseTransferResponseDto,
)
from src.warehouse_transfer.use_cases.create_warehouse_transfer_use_case import (
    CreateWarehouseTransferUseCase,
)
from src.warehouse_transfer.use_cases.update_warehouse_transfer_use_case import (
    UpdateWarehouseTransferUseCase,
)
from src.warehouse_transfer.warehouse_transfer_repository import (
    WarehouseTransferRepository,
)
from src.truck.truck_repository import TruckRepository
from src.product_record.product_record_repository import ProductRecordRepository
from src.warehouse.warehouse_repository import WarehouseRepository

router = APIRouter(prefix="/warehouse-transfers", tags=["warehouse-transfers"])


@router.post("/", response_model=CreateWarehouseTransferResponseDto)
async def create_warehouse_transfer(
    transfer_dto: CreateWarehouseTransferDto,
    session: AsyncSession = Depends(get_db_session),
):
    """Create a new warehouse transfer"""
    try:
        transfer_repository = WarehouseTransferRepository(session)
        truck_repository = TruckRepository(session)
        warehouse_repository = WarehouseRepository(session)

        use_case = CreateWarehouseTransferUseCase(
            transfer_repository=transfer_repository,
            truck_repository=truck_repository,
            warehouse_repository=warehouse_repository,
        )

        result = await use_case.execute(transfer_dto)
        await session.commit()
        return result

    except ValueError as e:
        await session.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=500, detail=f"Failed to create warehouse transfer: {str(e)}"
        )


@router.get("/", response_model=List[WarehouseTransferResponseDto])
async def get_all_warehouse_transfers(session: AsyncSession = Depends(get_db_session)):
    """Get all warehouse transfers"""
    try:
        repository = WarehouseTransferRepository(session)
        transfers = await repository.get_all()

        from src.warehouse_transfer.warehouse_transfer_dto import (
            warehouse_transfer_to_response_dto,
        )

        return [warehouse_transfer_to_response_dto(transfer) for transfer in transfers]

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get warehouse transfers: {str(e)}"
        )


@router.get("/{transfer_id}", response_model=WarehouseTransferResponseDto)
async def get_warehouse_transfer_by_id(
    transfer_id: int, session: AsyncSession = Depends(get_db_session)
):
    """Get warehouse transfer by ID"""
    try:
        repository = WarehouseTransferRepository(session)
        transfer = await repository.get_by_id(transfer_id)

        if not transfer:
            raise HTTPException(status_code=404, detail="Warehouse transfer not found")

        from src.warehouse_transfer.warehouse_transfer_dto import (
            warehouse_transfer_to_response_dto,
        )

        return warehouse_transfer_to_response_dto(transfer)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get warehouse transfer: {str(e)}"
        )


@router.put("/{transfer_id}", response_model=WarehouseTransferResponseDto)
async def update_warehouse_transfer(
    transfer_id: int,
    update_dto: UpdateWarehouseTransferDto,
    session: AsyncSession = Depends(get_db_session),
):
    """Update warehouse transfer status and details"""
    try:
        transfer_repository = WarehouseTransferRepository(session)
        truck_repository = TruckRepository(session)
        product_record_repository = ProductRecordRepository(session)

        use_case = UpdateWarehouseTransferUseCase(
            transfer_repository=transfer_repository,
            truck_repository=truck_repository,
            product_record_repository=product_record_repository,
        )

        result = await use_case.execute(transfer_id, update_dto)

        if not result:
            raise HTTPException(status_code=404, detail="Warehouse transfer not found")

        await session.commit()
        return result

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=500, detail=f"Failed to update warehouse transfer: {str(e)}"
        )


@router.get(
    "/warehouse/{warehouse_id}/outgoing",
    response_model=List[WarehouseTransferResponseDto],
)
async def get_outgoing_transfers_for_warehouse(
    warehouse_id: int, session: AsyncSession = Depends(get_db_session)
):
    """Get all outgoing transfers from a warehouse"""
    try:
        repository = WarehouseTransferRepository(session)
        transfers = await repository.get_by_warehouse(warehouse_id, is_origin=True)

        from src.warehouse_transfer.warehouse_transfer_dto import (
            warehouse_transfer_to_response_dto,
        )

        return [warehouse_transfer_to_response_dto(transfer) for transfer in transfers]

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get outgoing transfers: {str(e)}"
        )


@router.get(
    "/warehouse/{warehouse_id}/incoming",
    response_model=List[WarehouseTransferResponseDto],
)
async def get_incoming_transfers_for_warehouse(
    warehouse_id: int, session: AsyncSession = Depends(get_db_session)
):
    """Get all incoming transfers to a warehouse"""
    try:
        repository = WarehouseTransferRepository(session)
        transfers = await repository.get_by_warehouse(warehouse_id, is_origin=False)

        from src.warehouse_transfer.warehouse_transfer_dto import (
            warehouse_transfer_to_response_dto,
        )

        return [warehouse_transfer_to_response_dto(transfer) for transfer in transfers]

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get incoming transfers: {str(e)}"
        )


@router.get("/truck/{truck_id}", response_model=List[WarehouseTransferResponseDto])
async def get_transfers_for_truck(
    truck_id: int, session: AsyncSession = Depends(get_db_session)
):
    """Get all transfers assigned to a truck"""
    try:
        repository = WarehouseTransferRepository(session)
        transfers = await repository.get_by_truck_id(truck_id)

        from src.warehouse_transfer.warehouse_transfer_dto import (
            warehouse_transfer_to_response_dto,
        )

        return [warehouse_transfer_to_response_dto(transfer) for transfer in transfers]

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get transfers for truck: {str(e)}"
        )
