from src.user.user_entity import User, UserRole
from src.base import Location
from src.user.user_repository import UserRepository
from src.user.user_dto import CreateUserDto, CreateUserResponseDto


class CreateUserUseCase:
    def __init__(self, user_repository: UserRepository):
        self._user_repository = user_repository

    async def execute(self, create_user_dto: CreateUserDto) -> CreateUserResponseDto:
        """Create a new user"""
        # Set location to None for administrators and truck drivers
        location = (
            None
            if create_user_dto.role in [UserRole.ADMINISTRATOR, UserRole.TRUCK_DRIVER]
            else create_user_dto.location
        )

        user = User(
            user_id=None,
            name=create_user_dto.name,
            contact_info=create_user_dto.contact_info,
            location=location,
            password_string=create_user_dto.password_string,
            role=create_user_dto.role,
        )

        created_user = await self._user_repository.create(user)

        return CreateUserResponseDto(
            user_id=created_user.user_id, message="User created successfully"
        )
