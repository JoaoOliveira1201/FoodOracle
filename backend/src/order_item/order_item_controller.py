from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from src.order_item.order_item_repository import OrderItemRepository
from src.order_item.use_cases.create_order_item_use_case import CreateOrderItemUseCase
from src.order_item.use_cases.get_order_item_use_case import GetOrderItemUseCase
from src.order_item.order_item_dto import (
    CreateOrderItemDto,
    OrderItemResponseDto,
    CreateOrderItemResponseDto,
)
from src.product_record.product_record_repository import ProductRecordRepository
from src.user.user_entity import UserRole
from src.database import get_db_session

router = APIRouter(prefix="/order-items", tags=["order-items"])


def get_order_item_repository(
    session: AsyncSession = Depends(get_db_session),
) -> OrderItemRepository:
    return OrderItemRepository(session)


def get_product_record_repository(
    session: AsyncSession = Depends(get_db_session),
) -> ProductRecordRepository:
    return ProductRecordRepository(session)


def get_create_order_item_use_case(
    order_item_repo: OrderItemRepository = Depends(get_order_item_repository),
    product_record_repo: ProductRecordRepository = Depends(
        get_product_record_repository
    ),
) -> CreateOrderItemUseCase:
    return CreateOrderItemUseCase(order_item_repo, product_record_repo)


def get_get_order_item_use_case(
    repo: OrderItemRepository = Depends(get_order_item_repository),
) -> GetOrderItemUseCase:
    return GetOrderItemUseCase(repo)


@router.post(
    "/", response_model=CreateOrderItemResponseDto, status_code=status.HTTP_201_CREATED
)
async def create_order_item(
    order_item_dto: CreateOrderItemDto,
    create_order_item_use_case: CreateOrderItemUseCase = Depends(
        get_create_order_item_use_case
    ),
) -> CreateOrderItemResponseDto:
    """Create a new order item"""

    try:
        return await create_order_item_use_case.execute(order_item_dto)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create order item: {str(e)}",
        )


@router.get("/{order_item_id}", response_model=OrderItemResponseDto)
async def get_order_item(
    order_item_id: int,
    get_order_item_use_case: GetOrderItemUseCase = Depends(get_get_order_item_use_case),
) -> OrderItemResponseDto:
    """Get order item by ID - Everyone can read order items"""
    order_item = await get_order_item_use_case.execute_by_id(order_item_id)
    if not order_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order item with ID {order_item_id} not found",
        )
    return order_item


@router.get("/", response_model=List[OrderItemResponseDto])
async def get_all_order_items(
    get_order_item_use_case: GetOrderItemUseCase = Depends(get_get_order_item_use_case),
) -> List[OrderItemResponseDto]:
    """Get all order items - Everyone can read order items"""
    return await get_order_item_use_case.execute_all()


@router.get("/order/{order_id}", response_model=List[OrderItemResponseDto])
async def get_order_items_by_order(
    order_id: int,
    get_order_item_use_case: GetOrderItemUseCase = Depends(get_get_order_item_use_case),
) -> List[OrderItemResponseDto]:
    """Get order items by order ID - Everyone can read order items"""
    return await get_order_item_use_case.execute_by_order_id(order_id)


@router.get("/record/{record_id}", response_model=List[OrderItemResponseDto])
async def get_order_items_by_record(
    record_id: int,
    get_order_item_use_case: GetOrderItemUseCase = Depends(get_get_order_item_use_case),
) -> List[OrderItemResponseDto]:
    """Get order items by record ID - Everyone can read order items"""
    return await get_order_item_use_case.execute_by_record_id(record_id)
