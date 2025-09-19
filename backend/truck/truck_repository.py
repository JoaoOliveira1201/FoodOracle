from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.exc import SQLAlchemyError
from geoalchemy2.functions import ST_DWithin
from sqlalchemy import func, text
from src.truck.truck_entity import Truck, TruckStatus, TruckType, TruckModel
from src.base import Location


class TruckRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, truck: Truck) -> Truck:
        """Create a new truck"""
        try:
            truck_model = TruckModel(
                TruckDriverID=truck.truck_driver_id,
                CurrentLocation=truck.current_location.to_postgis_geography()
                if truck.current_location
                else None,
                Status=truck.status.value,
                Type=truck.type.value,
                LoadCapacityKg=truck.load_capacity_kg,
            )

            self.session.add(truck_model)
            await self.session.flush()

            created_truck = self._model_to_entity(truck_model, truck.current_location)
            return created_truck

        except SQLAlchemyError as e:
            await self.session.rollback()
            raise Exception(f"Failed to create truck: {str(e)}")

    async def get_by_id(self, truck_id: int) -> Optional[Truck]:
        """Get truck by ID"""
        try:
            result = await self.session.execute(
                select(
                    TruckModel,
                    func.ST_X(text("currentlocation::geometry")).label("longitude"),
                    func.ST_Y(text("currentlocation::geometry")).label("latitude"),
                ).where(TruckModel.TruckID == truck_id)
            )
            row = result.first()

            if not row:
                return None

            return self._row_to_entity(row)

        except SQLAlchemyError as e:
            raise Exception(f"Failed to get truck by ID: {str(e)}")

    async def get_all(self) -> List[Truck]:
        """Get all trucks"""
        try:
            result = await self.session.execute(
                select(
                    TruckModel,
                    func.ST_X(text("currentlocation::geometry")).label("longitude"),
                    func.ST_Y(text("currentlocation::geometry")).label("latitude"),
                )
            )
            rows = result.all()

            return [self._row_to_entity(row) for row in rows]

        except SQLAlchemyError as e:
            raise Exception(f"Failed to get all trucks: {str(e)}")

    async def get_by_status(self, status: TruckStatus) -> List[Truck]:
        """Get trucks by status"""
        try:
            result = await self.session.execute(
                select(
                    TruckModel,
                    func.ST_X(text("currentlocation::geometry")).label("longitude"),
                    func.ST_Y(text("currentlocation::geometry")).label("latitude"),
                ).where(TruckModel.Status == status.value)
            )
            rows = result.all()

            return [self._row_to_entity(row) for row in rows]

        except SQLAlchemyError as e:
            raise Exception(f"Failed to get trucks by status: {str(e)}")

    async def get_by_type(self, truck_type: TruckType) -> List[Truck]:
        """Get trucks by type"""
        try:
            result = await self.session.execute(
                select(
                    TruckModel,
                    func.ST_X(text("currentlocation::geometry")).label("longitude"),
                    func.ST_Y(text("currentlocation::geometry")).label("latitude"),
                ).where(TruckModel.Type == truck_type.value)
            )
            rows = result.all()

            return [self._row_to_entity(row) for row in rows]

        except SQLAlchemyError as e:
            raise Exception(f"Failed to get trucks by type: {str(e)}")

    async def get_by_driver_id(self, driver_id: int) -> List[Truck]:
        """Get trucks assigned to a specific driver"""
        try:
            result = await self.session.execute(
                select(
                    TruckModel,
                    func.ST_X(text("currentlocation::geometry")).label("longitude"),
                    func.ST_Y(text("currentlocation::geometry")).label("latitude"),
                ).where(TruckModel.TruckDriverID == driver_id)
            )
            rows = result.all()

            return [self._row_to_entity(row) for row in rows]

        except SQLAlchemyError as e:
            raise Exception(f"Failed to get trucks by driver ID: {str(e)}")

    async def get_trucks_within_distance(
        self, center: Location, distance_meters: float
    ) -> List[Truck]:
        """Get trucks within a certain distance from a center point"""
        try:
            result = await self.session.execute(
                select(
                    TruckModel,
                    func.ST_X(text("currentlocation::geometry")).label("longitude"),
                    func.ST_Y(text("currentlocation::geometry")).label("latitude"),
                ).where(
                    ST_DWithin(
                        TruckModel.CurrentLocation,
                        center.to_postgis_geography(),
                        distance_meters,
                    )
                )
            )
            rows = result.all()

            return [self._row_to_entity(row) for row in rows]

        except SQLAlchemyError as e:
            raise Exception(f"Failed to get trucks within distance: {str(e)}")

    async def update_status_and_location(
        self, truck_id: int, status: TruckStatus, location: Optional[Location] = None
    ) -> Optional[Truck]:
        """Update truck status and optionally location"""
        try:
            # Prepare update values
            update_values = {"Status": status.value}
            if location is not None:
                update_values["CurrentLocation"] = location.to_postgis_geography()

            # Execute update
            await self.session.execute(
                update(TruckModel)
                .where(TruckModel.TruckID == truck_id)
                .values(**update_values)
            )

            # Return updated truck
            return await self.get_by_id(truck_id)

        except SQLAlchemyError as e:
            await self.session.rollback()
            raise Exception(f"Failed to update truck status: {str(e)}")

    def _row_to_entity(self, row) -> Truck:
        """Convert SQLAlchemy row to domain entity"""
        truck_model = row[0]
        location = Location.from_db_row(row)

        return Truck(
            truck_id=truck_model.TruckID,
            truck_driver_id=truck_model.TruckDriverID,
            current_location=location,
            status=TruckStatus(truck_model.Status),
            type=TruckType(truck_model.Type),
            load_capacity_kg=truck_model.LoadCapacityKg,
        )

    def _model_to_entity(
        self, truck_model: TruckModel, location: Optional[Location] = None
    ) -> Truck:
        """Convert SQLAlchemy model to domain entity"""
        return Truck(
            truck_id=truck_model.TruckID,
            truck_driver_id=truck_model.TruckDriverID,
            current_location=location,
            status=TruckStatus(truck_model.Status),
            type=TruckType(truck_model.Type),
            load_capacity_kg=truck_model.LoadCapacityKg,
        )
