from typing import List, Optional
from src.truck.truck_repository import TruckRepository
from src.truck.truck_dto import TruckResponseDto, truck_to_response_dto


class GetTruckUseCase:
    def __init__(self, truck_repository: TruckRepository):
        self._truck_repository = truck_repository

    async def execute_by_id(self, truck_id: int) -> Optional[TruckResponseDto]:
        """Get truck by ID"""
        truck = await self._truck_repository.get_by_id(truck_id)
        if not truck:
            return None
        return truck_to_response_dto(truck)

    async def execute_all(self) -> List[TruckResponseDto]:
        """Get all trucks"""
        trucks = await self._truck_repository.get_all()
        return [truck_to_response_dto(truck) for truck in trucks]
