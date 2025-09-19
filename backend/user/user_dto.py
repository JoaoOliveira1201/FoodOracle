from pydantic import BaseModel
from typing import Optional, TYPE_CHECKING
from src.user.user_entity import UserRole
from src.base import Location

if TYPE_CHECKING:
    from src.user.user_entity import User


class CreateUserDto(BaseModel):
    name: str
    contact_info: Optional[str] = None
    location: Optional[Location] = None
    password_string: str
    role: UserRole


class UserResponseDto(BaseModel):
    user_id: int
    name: str
    contact_info: Optional[str]
    location: Optional[Location]
    role: UserRole

    class Config:
        from_attributes = True


class CreateUserResponseDto(BaseModel):
    user_id: int
    message: str


class LoginRequestDto(BaseModel):
    email: str
    password: str


class LoginResponseDto(BaseModel):
    user_id: int
    role: UserRole
    name: str
    message: str


def user_to_response_dto(user: "User") -> UserResponseDto:
    """Convert User entity to UserResponseDto"""
    return UserResponseDto(
        user_id=user.user_id,
        name=user.name,
        contact_info=user.contact_info,
        location=user.location,
        role=user.role,
    )
