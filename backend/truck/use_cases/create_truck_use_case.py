from src.truck.truck_entity import Truck
from src.truck.truck_repository import TruckRepository
from src.truck.truck_dto import CreateTruckDto, CreateTruckResponseDto
from src.user.user_repository import UserRepository
from src.user.user_entity import UserRole


class CreateTruckUseCase:
    def __init__(
        self, truck_repository: TruckRepository, user_repository: UserRepository
    ):
        self._truck_repository = truck_repository
        self._user_repository = user_repository

    async def execute(self, create_truck_dto: CreateTruckDto) -> CreateTruckResponseDto:
        """Create a new truck"""

        driver = await self._user_repository.get_by_id(create_truck_dto.truck_driver_id)
        if not driver:
            raise ValueError(
                f"Driver with ID {create_truck_dto.truck_driver_id} not found"
            )

        existing_trucks = await self._truck_repository.get_by_driver_id(
            create_truck_dto.truck_driver_id
        )
        if existing_trucks:
            raise ValueError("Driver already has a truck assigned")

        truck = Truck(
            truck_id=None,
            truck_driver_id=create_truck_dto.truck_driver_id,
            current_location=create_truck_dto.current_location,
            status=create_truck_dto.status,
            type=create_truck_dto.type,
            load_capacity_kg=create_truck_dto.load_capacity_kg,
        )

        created_truck = await self._truck_repository.create(truck)

        return CreateTruckResponseDto(
            truck_id=created_truck.truck_id, message="Truck created successfully"
        )
