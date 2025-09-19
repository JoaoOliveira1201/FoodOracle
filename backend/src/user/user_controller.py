from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from src.user.user_entity import UserRole
from src.user.user_repository import UserRepository
from src.user.use_cases.create_user_use_case import CreateUserUseCase
from src.user.use_cases.get_user_use_case import GetUserUseCase
from src.user.use_cases.get_users_by_role_use_case import GetUsersByRoleUseCase
from src.user.use_cases.login_user_use_case import LoginUserUseCase
from src.user.user_dto import (
    CreateUserDto,
    UserResponseDto,
    CreateUserResponseDto,
    LoginRequestDto,
    LoginResponseDto,
)
from src.database import get_db_session

router = APIRouter(prefix="/users", tags=["users"])


def get_user_repository(
    session: AsyncSession = Depends(get_db_session),
) -> UserRepository:
    return UserRepository(session)


def get_create_user_use_case(
    repo: UserRepository = Depends(get_user_repository),
) -> CreateUserUseCase:
    return CreateUserUseCase(repo)


def get_get_user_use_case(
    repo: UserRepository = Depends(get_user_repository),
) -> GetUserUseCase:
    return GetUserUseCase(repo)


def get_users_by_role_use_case(
    repo: UserRepository = Depends(get_user_repository),
) -> GetUsersByRoleUseCase:
    return GetUsersByRoleUseCase(repo)


def get_login_user_use_case(
    repo: UserRepository = Depends(get_user_repository),
) -> LoginUserUseCase:
    return LoginUserUseCase(repo)


@router.post(
    "/", response_model=CreateUserResponseDto, status_code=status.HTTP_201_CREATED
)
async def create_user(
    user_dto: CreateUserDto,
    create_user_use_case: CreateUserUseCase = Depends(get_create_user_use_case),
) -> CreateUserResponseDto:
    """Create a new user"""
    try:
        return await create_user_use_case.execute(user_dto)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create user: {str(e)}",
        )


@router.get("/{user_id}", response_model=UserResponseDto)
async def get_user(
    user_id: int, get_user_use_case: GetUserUseCase = Depends(get_get_user_use_case)
) -> UserResponseDto:
    """Get user by ID"""
    user = await get_user_use_case.execute_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found",
        )
    return user


@router.get("/", response_model=List[UserResponseDto])
async def get_all_users(
    get_user_use_case: GetUserUseCase = Depends(get_get_user_use_case),
) -> List[UserResponseDto]:
    """Get all users"""
    return await get_user_use_case.execute_all()


@router.get("/role/{role}", response_model=List[UserResponseDto])
async def get_users_by_role(
    role: UserRole,
    get_users_by_role_use_case: GetUsersByRoleUseCase = Depends(
        get_users_by_role_use_case
    ),
) -> List[UserResponseDto]:
    """Get users by role"""
    return await get_users_by_role_use_case.execute(role)


@router.post("/login", response_model=LoginResponseDto)
async def login(
    login_dto: LoginRequestDto,
    login_use_case: LoginUserUseCase = Depends(get_login_user_use_case),
) -> LoginResponseDto:
    """Login user with email and password"""
    result = await login_use_case.execute(login_dto)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    return result
