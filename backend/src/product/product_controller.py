from fastapi import APIRouter, HTTPException, status, Depends, Header
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from src.product.product_repository import ProductRepository
from src.user.user_repository import UserRepository
from src.product.use_cases.create_product_use_case import CreateProductUseCase
from src.product.use_cases.get_product_use_case import GetProductUseCase
from src.product.use_cases.update_product_use_case import UpdateProductUseCase
from src.product.use_cases.delete_product_use_case import DeleteProductUseCase
from src.product.product_dto import (
    CreateProductDto,
    UpdateProductDto,
    ProductResponseDto,
    CreateProductResponseDto,
    product_to_response_dto,
)
from src.database import get_db_session

# Create router
router = APIRouter(prefix="/products", tags=["products"])


# Dependencies
def get_product_repository(
    session: AsyncSession = Depends(get_db_session),
) -> ProductRepository:
    return ProductRepository(session)


def get_user_repository(
    session: AsyncSession = Depends(get_db_session),
) -> UserRepository:
    return UserRepository(session)


def get_create_product_use_case(
    product_repo: ProductRepository = Depends(get_product_repository),
    user_repo: UserRepository = Depends(get_user_repository),
) -> CreateProductUseCase:
    return CreateProductUseCase(product_repo, user_repo)


def get_get_product_use_case(
    repo: ProductRepository = Depends(get_product_repository),
) -> GetProductUseCase:
    return GetProductUseCase(repo)


def get_update_product_use_case(
    product_repo: ProductRepository = Depends(get_product_repository),
    user_repo: UserRepository = Depends(get_user_repository),
) -> UpdateProductUseCase:
    return UpdateProductUseCase(product_repo, user_repo)


def get_delete_product_use_case(
    product_repo: ProductRepository = Depends(get_product_repository),
    user_repo: UserRepository = Depends(get_user_repository),
) -> DeleteProductUseCase:
    return DeleteProductUseCase(product_repo, user_repo)


@router.post(
    "/", response_model=CreateProductResponseDto, status_code=status.HTTP_201_CREATED
)
async def create_product(
    product_dto: CreateProductDto,
    create_product_use_case: CreateProductUseCase = Depends(
        get_create_product_use_case
    ),
) -> CreateProductResponseDto:
    """Create a new product"""
    try:
        return await create_product_use_case.execute(product_dto)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create product: {str(e)}",
        )


@router.get("/{product_id}", response_model=ProductResponseDto)
async def get_product(
    product_id: int,
    get_product_use_case: GetProductUseCase = Depends(get_get_product_use_case),
) -> ProductResponseDto:
    """Get product by ID"""
    product = await get_product_use_case.execute_by_id(product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found",
        )
    return product


@router.get("/", response_model=List[ProductResponseDto])
async def get_all_products(
    get_product_use_case: GetProductUseCase = Depends(get_get_product_use_case),
) -> List[ProductResponseDto]:
    """Get all products"""
    return await get_product_use_case.execute_all()


@router.get(
    "/refrigeration/{requires_refrigeration}", response_model=List[ProductResponseDto]
)
async def get_products_by_refrigeration_requirement(
    requires_refrigeration: bool,
    get_product_use_case: GetProductUseCase = Depends(get_get_product_use_case),
) -> List[ProductResponseDto]:
    """Get products by refrigeration requirement"""
    return await get_product_use_case.execute_by_refrigeration_requirement(
        requires_refrigeration
    )


@router.put("/{product_id}", response_model=ProductResponseDto)
async def update_product(
    product_id: int,
    update_dto: UpdateProductDto,
    update_product_use_case: UpdateProductUseCase = Depends(
        get_update_product_use_case
    ),
) -> ProductResponseDto:
    """Update a product"""
    try:
        product = await update_product_use_case.execute(product_id, update_dto)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {product_id} not found",
            )
        return product
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update product: {str(e)}",
        )


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: int,
    delete_product_use_case: DeleteProductUseCase = Depends(
        get_delete_product_use_case
    ),
):
    """Delete a product"""
    try:
        success = await delete_product_use_case.execute(product_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {product_id} not found",
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to delete product: {str(e)}",
        )
