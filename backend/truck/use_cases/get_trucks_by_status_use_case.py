from typing import List
from src.truck.truck_entity import TruckStatus
from src.truck.truck_repository import TruckRepository
from src.truck.truck_dto import TruckResponseDto, truck_to_response_dto


class GetTrucksByStatusUseCase:
    def __init__(self, truck_repository: TruckRepository):
        self._truck_repository = truck_repository

    async def execute(self, status: TruckStatus) -> List[TruckResponseDto]:
        """Get trucks by status"""
        trucks = await self._truck_repository.get_by_status(status)
        return [truck_to_response_dto(truck) for truck in trucks]
