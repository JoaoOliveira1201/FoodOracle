from typing import Optional
from src.truck.truck_repository import TruckRepository
from src.truck.truck_dto import (
    UpdateTruckStatusDto,
    TruckResponseDto,
    truck_to_response_dto,
)


class UpdateTruckStatusUseCase:
    def __init__(self, truck_repository: TruckRepository):
        self._truck_repository = truck_repository

    async def execute(
        self, truck_id: int, update_dto: UpdateTruckStatusDto
    ) -> Optional[TruckResponseDto]:
        """Update truck status and location"""
        truck = await self._truck_repository.update_status_and_location(
            truck_id=truck_id,
            status=update_dto.status,
            location=update_dto.current_location,
        )

        if not truck:
            return None

        return truck_to_response_dto(truck)
