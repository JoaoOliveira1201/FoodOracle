from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from src.order.order_entity import OrderStatus
from src.order.order_repository import OrderRepository
from src.order.use_cases.create_order_use_case import CreateOrderUseCase
from src.order.use_cases.get_order_use_case import GetOrderUseCase
from src.order.use_cases.update_order_use_case import UpdateOrderUseCase
from src.order.order_dto import (
    CreateOrderDto,
    UpdateOrderDto,
    OrderResponseDto,
    CreateOrderResponseDto,
)
from src.user.user_entity import UserRole
from src.product_record.product_record_repository import ProductRecordRepository
from src.trip.trip_repository import TripRepository
from src.truck.truck_repository import TruckRepository
from src.warehouse.warehouse_repository import WarehouseRepository
from src.user.user_repository import UserRepository
from src.database import get_db_session

router = APIRouter(prefix="/orders", tags=["orders"])


def get_order_repository(
    session: AsyncSession = Depends(get_db_session),
) -> OrderRepository:
    return OrderRepository(session)


def get_create_order_use_case(
    session: AsyncSession = Depends(get_db_session),
) -> CreateOrderUseCase:
    order_repo = OrderRepository(session)
    trip_repo = TripRepository(session)
    truck_repo = TruckRepository(session)
    warehouse_repo = WarehouseRepository(session)
    user_repo = UserRepository(session)
    product_record_repo = ProductRecordRepository(session)

    return CreateOrderUseCase(
        order_repo,
        trip_repo,
        truck_repo,
        warehouse_repo,
        user_repo,
        product_record_repo,
    )


def get_get_order_use_case(
    repo: OrderRepository = Depends(get_order_repository),
) -> GetOrderUseCase:
    return GetOrderUseCase(repo)


def get_update_order_use_case(
    repo: OrderRepository = Depends(get_order_repository),
) -> UpdateOrderUseCase:
    return UpdateOrderUseCase(repo)


@router.post(
    "/", response_model=CreateOrderResponseDto, status_code=status.HTTP_201_CREATED
)
async def create_order(
    order_dto: CreateOrderDto,
    create_order_use_case: CreateOrderUseCase = Depends(get_create_order_use_case),
) -> CreateOrderResponseDto:
    """Create a new order"""

    try:
        return await create_order_use_case.execute(order_dto)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create order: {str(e)}",
        )


@router.get("/{order_id}", response_model=OrderResponseDto)
async def get_order(
    order_id: int,
    get_order_use_case: GetOrderUseCase = Depends(get_get_order_use_case),
) -> OrderResponseDto:
    """Get order by ID - Everyone can read orders"""
    order = await get_order_use_case.execute_by_id(order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found",
        )
    return order


@router.get("/", response_model=List[OrderResponseDto])
async def get_all_orders(
    get_order_use_case: GetOrderUseCase = Depends(get_get_order_use_case),
) -> List[OrderResponseDto]:
    """Get all orders - Everyone can read orders"""
    return await get_order_use_case.execute_all()


@router.get("/buyer/{buyer_id}", response_model=List[OrderResponseDto])
async def get_orders_by_buyer(
    buyer_id: int,
    get_order_use_case: GetOrderUseCase = Depends(get_get_order_use_case),
) -> List[OrderResponseDto]:
    """Get orders by buyer ID - Everyone can read orders"""
    return await get_order_use_case.execute_by_buyer_id(buyer_id)


@router.get("/status/{status}", response_model=List[OrderResponseDto])
async def get_orders_by_status(
    status: OrderStatus,
    get_order_use_case: GetOrderUseCase = Depends(get_get_order_use_case),
) -> List[OrderResponseDto]:
    """Get orders by status - Everyone can read orders"""
    return await get_order_use_case.execute_by_status(status)


@router.put("/{order_id}", response_model=OrderResponseDto)
async def update_order(
    order_id: int,
    update_dto: UpdateOrderDto,
    update_order_use_case: UpdateOrderUseCase = Depends(get_update_order_use_case),
) -> OrderResponseDto:
    """Update an order"""

    try:
        updated_order = await update_order_use_case.execute(order_id, update_dto)
        if not updated_order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order with ID {order_id} not found",
            )
        return updated_order
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update order: {str(e)}",
        )
