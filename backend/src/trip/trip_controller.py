from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from src.trip.trip_entity import TripStatus
from src.trip.trip_repository import TripRepository
from src.order.order_repository import OrderRepository
from src.truck.truck_repository import TruckRepository
from src.trip.use_cases.create_trip_use_case import CreateTripUseCase
from src.trip.use_cases.get_trip_use_case import GetTripUseCase
from src.trip.use_cases.update_trip_use_case import UpdateTripUseCase
from src.trip.trip_dto import (
    CreateTripDto,
    UpdateTripDto,
    TripResponseDto,
    CreateTripResponseDto,
)
from src.user.user_entity import UserRole
from src.database import get_db_session

router = APIRouter(prefix="/trips", tags=["trips"])


def get_trip_repository(
    session: AsyncSession = Depends(get_db_session),
) -> TripRepository:
    return TripRepository(session)


def get_order_repository(
    session: AsyncSession = Depends(get_db_session),
) -> OrderRepository:
    return OrderRepository(session)


def get_truck_repository(
    session: AsyncSession = Depends(get_db_session),
) -> TruckRepository:
    return TruckRepository(session)


def get_create_trip_use_case(
    repo: TripRepository = Depends(get_trip_repository),
) -> CreateTripUseCase:
    return CreateTripUseCase(repo)


def get_get_trip_use_case(
    repo: TripRepository = Depends(get_trip_repository),
) -> GetTripUseCase:
    return GetTripUseCase(repo)


def get_update_trip_use_case(
    trip_repo: TripRepository = Depends(get_trip_repository),
    order_repo: OrderRepository = Depends(get_order_repository),
    truck_repo: TruckRepository = Depends(get_truck_repository),
) -> UpdateTripUseCase:
    return UpdateTripUseCase(trip_repo, order_repo, truck_repo)


@router.post(
    "/", response_model=CreateTripResponseDto, status_code=status.HTTP_201_CREATED
)
async def create_trip(
    trip_dto: CreateTripDto,
    create_trip_use_case: CreateTripUseCase = Depends(get_create_trip_use_case),
) -> CreateTripResponseDto:
    """Create a new trip"""

    try:
        return await create_trip_use_case.execute(trip_dto)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create trip: {str(e)}",
        )


@router.get("/{trip_id}", response_model=TripResponseDto)
async def get_trip(
    trip_id: int,
    get_trip_use_case: GetTripUseCase = Depends(get_get_trip_use_case),
) -> TripResponseDto:
    """Get trip by ID - Everyone can read trips"""
    trip = await get_trip_use_case.execute_by_id(trip_id)
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Trip with ID {trip_id} not found",
        )
    return trip


@router.get("/", response_model=List[TripResponseDto])
async def get_all_trips(
    get_trip_use_case: GetTripUseCase = Depends(get_get_trip_use_case),
) -> List[TripResponseDto]:
    """Get all trips - Everyone can read trips"""
    return await get_trip_use_case.execute_all()


@router.get("/truck/{truck_id}", response_model=List[TripResponseDto])
async def get_trips_by_truck(
    truck_id: int,
    get_trip_use_case: GetTripUseCase = Depends(get_get_trip_use_case),
) -> List[TripResponseDto]:
    """Get trips by truck ID - Everyone can read trips"""
    return await get_trip_use_case.execute_by_truck_id(truck_id)


@router.get("/truck/{truck_id}/with-names")
async def get_trips_by_truck_with_names(
    truck_id: int,
    trip_repository: TripRepository = Depends(get_trip_repository),
):
    """Get trips by truck ID with warehouse names and user names"""
    try:
        return await trip_repository.get_by_truck_id_with_names(truck_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get trips: {str(e)}",
        )


@router.get("/order/{order_id}", response_model=List[TripResponseDto])
async def get_trips_by_order(
    order_id: int,
    get_trip_use_case: GetTripUseCase = Depends(get_get_trip_use_case),
) -> List[TripResponseDto]:
    """Get trips by order ID - Everyone can read trips"""
    return await get_trip_use_case.execute_by_order_id(order_id)


@router.get("/status/{status}", response_model=List[TripResponseDto])
async def get_trips_by_status(
    status: TripStatus,
    get_trip_use_case: GetTripUseCase = Depends(get_get_trip_use_case),
) -> List[TripResponseDto]:
    """Get trips by status - Everyone can read trips"""
    return await get_trip_use_case.execute_by_status(status)


@router.put("/{trip_id}", response_model=TripResponseDto)
async def update_trip(
    trip_id: int,
    update_dto: UpdateTripDto,
    update_trip_use_case: UpdateTripUseCase = Depends(get_update_trip_use_case),
) -> TripResponseDto:
    """Update a trip"""

    try:
        updated_trip = await update_trip_use_case.execute(trip_id, update_dto)
        if not updated_trip:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Trip with ID {trip_id} not found",
            )
        return updated_trip
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update trip: {str(e)}",
        )
