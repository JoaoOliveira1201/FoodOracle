from typing import List
from src.truck.truck_entity import TruckType
from src.truck.truck_repository import TruckRepository
from src.truck.truck_dto import TruckResponseDto, truck_to_response_dto


class GetTrucksByTypeUseCase:
    def __init__(self, truck_repository: TruckRepository):
        self._truck_repository = truck_repository

    async def execute(self, truck_type: TruckType) -> List[TruckResponseDto]:
        """Get trucks by type"""
        trucks = await self._truck_repository.get_by_type(truck_type)
        return [truck_to_response_dto(truck) for truck in trucks]
