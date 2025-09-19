from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from src.truck.truck_entity import TruckStatus, TruckType
from src.truck.truck_repository import TruckRepository
from src.user.user_repository import UserRepository
from src.truck.use_cases.create_truck_use_case import CreateTruckUseCase
from src.truck.use_cases.get_truck_use_case import GetTruckUseCase
from src.truck.use_cases.get_trucks_by_status_use_case import GetTrucksByStatusUseCase
from src.truck.use_cases.get_trucks_by_type_use_case import GetTrucksByTypeUseCase
from src.truck.use_cases.update_truck_status_use_case import UpdateTruckStatusUseCase
from src.truck.truck_dto import (
    CreateTruckDto,
    TruckResponseDto,
    CreateTruckResponseDto,
    UpdateTruckStatusDto,
    truck_to_response_dto,
)
from src.database import get_db_session

# Create router
router = APIRouter(prefix="/trucks", tags=["trucks"])


# Dependencies
def get_truck_repository(
    session: AsyncSession = Depends(get_db_session),
) -> TruckRepository:
    return TruckRepository(session)


def get_user_repository(
    session: AsyncSession = Depends(get_db_session),
) -> UserRepository:
    return UserRepository(session)


def get_create_truck_use_case(
    truck_repo: TruckRepository = Depends(get_truck_repository),
    user_repo: UserRepository = Depends(get_user_repository),
) -> CreateTruckUseCase:
    return CreateTruckUseCase(truck_repo, user_repo)


def get_get_truck_use_case(
    repo: TruckRepository = Depends(get_truck_repository),
) -> GetTruckUseCase:
    return GetTruckUseCase(repo)


def get_trucks_by_status_use_case(
    repo: TruckRepository = Depends(get_truck_repository),
) -> GetTrucksByStatusUseCase:
    return GetTrucksByStatusUseCase(repo)


def get_trucks_by_type_use_case(
    repo: TruckRepository = Depends(get_truck_repository),
) -> GetTrucksByTypeUseCase:
    return GetTrucksByTypeUseCase(repo)


def get_update_truck_status_use_case(
    repo: TruckRepository = Depends(get_truck_repository),
) -> UpdateTruckStatusUseCase:
    return UpdateTruckStatusUseCase(repo)


@router.post(
    "/", response_model=CreateTruckResponseDto, status_code=status.HTTP_201_CREATED
)
async def create_truck(
    truck_dto: CreateTruckDto,
    create_truck_use_case: CreateTruckUseCase = Depends(get_create_truck_use_case),
) -> CreateTruckResponseDto:
    """Create a new truck (only by truck drivers)"""
    try:
        return await create_truck_use_case.execute(truck_dto)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create truck: {str(e)}",
        )


@router.get("/{truck_id}", response_model=TruckResponseDto)
async def get_truck(
    truck_id: int, get_truck_use_case: GetTruckUseCase = Depends(get_get_truck_use_case)
) -> TruckResponseDto:
    """Get truck by ID"""
    truck = await get_truck_use_case.execute_by_id(truck_id)
    if not truck:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Truck with ID {truck_id} not found",
        )
    return truck


@router.get("/", response_model=List[TruckResponseDto])
async def get_all_trucks(
    get_truck_use_case: GetTruckUseCase = Depends(get_get_truck_use_case),
) -> List[TruckResponseDto]:
    """Get all trucks"""
    return await get_truck_use_case.execute_all()


@router.get("/status/{status}", response_model=List[TruckResponseDto])
async def get_trucks_by_status(
    status: TruckStatus,
    get_trucks_by_status_use_case: GetTrucksByStatusUseCase = Depends(
        get_trucks_by_status_use_case
    ),
) -> List[TruckResponseDto]:
    """Get trucks by status"""
    return await get_trucks_by_status_use_case.execute(status)


@router.get("/type/{truck_type}", response_model=List[TruckResponseDto])
async def get_trucks_by_type(
    truck_type: TruckType,
    get_trucks_by_type_use_case: GetTrucksByTypeUseCase = Depends(
        get_trucks_by_type_use_case
    ),
) -> List[TruckResponseDto]:
    """Get trucks by type"""
    return await get_trucks_by_type_use_case.execute(truck_type)


@router.get("/driver/{driver_id}", response_model=List[TruckResponseDto])
async def get_trucks_by_driver(
    driver_id: int,
    truck_repository: TruckRepository = Depends(get_truck_repository),
) -> List[TruckResponseDto]:
    """Get trucks assigned to a specific driver (should be at most one)"""
    try:
        trucks = await truck_repository.get_by_driver_id(driver_id)
        return [truck_to_response_dto(truck) for truck in trucks]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to get trucks for driver: {str(e)}",
        )


@router.patch("/{truck_id}/status", response_model=TruckResponseDto)
async def update_truck_status(
    truck_id: int,
    update_dto: UpdateTruckStatusDto,
    update_truck_status_use_case: UpdateTruckStatusUseCase = Depends(
        get_update_truck_status_use_case
    ),
) -> TruckResponseDto:
    """Update truck status and optionally location"""
    truck = await update_truck_status_use_case.execute(truck_id, update_dto)
    if not truck:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Truck with ID {truck_id} not found",
        )
    return truck
