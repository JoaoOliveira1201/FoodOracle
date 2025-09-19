from typing import Optional
from src.user.user_repository import UserRepository
from src.user.user_dto import LoginRequestDto, LoginResponseDto


class LoginUserUseCase:
    def __init__(self, user_repository: UserRepository):
        self.user_repository = user_repository

    async def execute(self, login_dto: LoginRequestDto) -> Optional[LoginResponseDto]:
        """
        Authenticate user with email and password
        Returns user_id and role if successful, None if authentication fails
        """
        user = await self.user_repository.get_by_email_and_password(
            login_dto.email, login_dto.password
        )

        if not user:
            return None

        return LoginResponseDto(
            user_id=user.user_id,
            role=user.role,
            name=user.name,
            message="Login successful",
        )
