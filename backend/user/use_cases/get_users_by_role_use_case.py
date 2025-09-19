from typing import List
from src.user.user_entity import UserRole
from src.user.user_repository import UserRepository
from src.user.user_dto import UserResponseDto, user_to_response_dto


class GetUsersByRoleUseCase:
    def __init__(self, user_repository: UserRepository):
        self._user_repository = user_repository

    async def execute(self, role: UserRole) -> List[UserResponseDto]:
        """Get users by role"""
        users = await self._user_repository.get_by_role(role)
        return [user_to_response_dto(user) for user in users]
