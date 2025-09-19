from typing import List, Optional
from src.user.user_repository import UserRepository
from src.user.user_dto import UserResponseDto, user_to_response_dto


class GetUserUseCase:
    def __init__(self, user_repository: UserRepository):
        self._user_repository = user_repository

    async def execute_by_id(self, user_id: int) -> Optional[UserResponseDto]:
        """Get user by ID"""
        user = await self._user_repository.get_by_id(user_id)
        if not user:
            return None
        return user_to_response_dto(user)

    async def execute_all(self) -> List[UserResponseDto]:
        """Get all users"""
        users = await self._user_repository.get_all()
        return [user_to_response_dto(user) for user in users]
