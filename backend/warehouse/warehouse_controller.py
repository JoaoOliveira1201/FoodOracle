from fastapi import APIRouter, HTTPException, status, Depends, Header
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from src.warehouse.warehouse_repository import WarehouseRepository
from src.user.user_repository import UserRepository
from src.warehouse.use_cases.create_warehouse_use_case import CreateWarehouseUseCase
from src.warehouse.use_cases.get_warehouse_use_case import GetWarehouseUseCase
from src.warehouse.warehouse_dto import (
    CreateWarehouseDto,
    WarehouseResponseDto,
    CreateWarehouseResponseDto,
    warehouse_to_response_dto,
)
from src.database import get_db_session

# Create router
router = APIRouter(prefix="/warehouses", tags=["warehouses"])


# Dependencies
def get_warehouse_repository(
    session: AsyncSession = Depends(get_db_session),
) -> WarehouseRepository:
    return WarehouseRepository(session)


def get_user_repository(
    session: AsyncSession = Depends(get_db_session),
) -> UserRepository:
    return UserRepository(session)


def get_create_warehouse_use_case(
    warehouse_repo: WarehouseRepository = Depends(get_warehouse_repository),
    user_repo: UserRepository = Depends(get_user_repository),
) -> CreateWarehouseUseCase:
    return CreateWarehouseUseCase(warehouse_repo, user_repo)


def get_get_warehouse_use_case(
    repo: WarehouseRepository = Depends(get_warehouse_repository),
) -> GetWarehouseUseCase:
    return GetWarehouseUseCase(repo)


@router.post(
    "/", response_model=CreateWarehouseResponseDto, status_code=status.HTTP_201_CREATED
)
async def create_warehouse(
    warehouse_dto: CreateWarehouseDto,
    create_warehouse_use_case: CreateWarehouseUseCase = Depends(
        get_create_warehouse_use_case
    ),
) -> CreateWarehouseResponseDto:
    """Create a new warehouse"""
    try:
        return await create_warehouse_use_case.execute(warehouse_dto)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create warehouse: {str(e)}",
        )


@router.get("/{warehouse_id}", response_model=WarehouseResponseDto)
async def get_warehouse(
    warehouse_id: int,
    get_warehouse_use_case: GetWarehouseUseCase = Depends(get_get_warehouse_use_case),
) -> WarehouseResponseDto:
    """Get warehouse by ID"""
    warehouse = await get_warehouse_use_case.execute_by_id(warehouse_id)
    if not warehouse:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Warehouse with ID {warehouse_id} not found",
        )
    return warehouse


@router.get("/", response_model=List[WarehouseResponseDto])
async def get_all_warehouses(
    get_warehouse_use_case: GetWarehouseUseCase = Depends(get_get_warehouse_use_case),
) -> List[WarehouseResponseDto]:
    """Get all warehouses"""
    return await get_warehouse_use_case.execute_all()
