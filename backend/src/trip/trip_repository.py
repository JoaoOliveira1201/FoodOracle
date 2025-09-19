from typing import List, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import joinedload
from src.trip.trip_entity import Trip, TripStatus, TripModel
from src.warehouse.warehouse_entity import WarehouseModel
from src.user.user_entity import UserModel
from src.order.order_entity import OrderModel
from src.base import Location


class TripRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    # --------------------------------------------------------------------------------------------------------------------------------------------------
    # --------------------------------------------------------------------------------------------------------------------------------------------------
    # --------------------------------------------------------------------------------------------------------------------------------------------------

    async def create(self, trip: Trip) -> Trip:
        """Create a new trip"""
        try:
            trip_model = TripModel(
                TruckID=trip.truck_id,
                OrderID=trip.order_id,
                Origin=trip.origin.to_postgis_geography() if trip.origin else None,
                Destination=trip.destination.to_postgis_geography()
                if trip.destination
                else None,
                Status=trip.status.value,
                EstimatedTime=trip.estimated_time,
                ActualTime=trip.actual_time,
                StartDate=trip.start_date,
                EndDate=trip.end_date,
            )

            self.session.add(trip_model)
            await self.session.flush()

            created_trip = self._model_to_entity(
                trip_model, trip.origin, trip.destination
            )
            return created_trip

        except SQLAlchemyError as e:
            await self.session.rollback()
            raise Exception(f"Failed to create trip: {str(e)}")

    # --------------------------------------------------------------------------------------------------------------------------------------------------

    async def get_by_id(self, trip_id: int) -> Optional[Trip]:
        """Get trip by ID"""
        try:
            result = await self.session.execute(
                select(
                    TripModel,
                    func.ST_X(text("origin::geometry")).label("origin_longitude"),
                    func.ST_Y(text("origin::geometry")).label("origin_latitude"),
                    func.ST_X(text("destination::geometry")).label(
                        "destination_longitude"
                    ),
                    func.ST_Y(text("destination::geometry")).label(
                        "destination_latitude"
                    ),
                ).where(TripModel.TripID == trip_id)
            )
            row = result.first()

            if not row:
                return None

            return self._row_to_entity(row)

        except SQLAlchemyError as e:
            raise Exception(f"Failed to get trip by ID: {str(e)}")

    # --------------------------------------------------------------------------------------------------------------------------------------------------

    async def get_all(self) -> List[Trip]:
        """Get all trips"""
        try:
            result = await self.session.execute(
                select(
                    TripModel,
                    func.ST_X(text("origin::geometry")).label("origin_longitude"),
                    func.ST_Y(text("origin::geometry")).label("origin_latitude"),
                    func.ST_X(text("destination::geometry")).label(
                        "destination_longitude"
                    ),
                    func.ST_Y(text("destination::geometry")).label(
                        "destination_latitude"
                    ),
                )
            )
            rows = result.all()

            return [self._row_to_entity(row) for row in rows]

        except SQLAlchemyError as e:
            raise Exception(f"Failed to get all trips: {str(e)}")

    # --------------------------------------------------------------------------------------------------------------------------------------------------

    async def get_by_truck_id(self, truck_id: int) -> List[Trip]:
        """Get trips by truck ID"""
        try:
            result = await self.session.execute(
                select(
                    TripModel,
                    func.ST_X(text("origin::geometry")).label("origin_longitude"),
                    func.ST_Y(text("origin::geometry")).label("origin_latitude"),
                    func.ST_X(text("destination::geometry")).label(
                        "destination_longitude"
                    ),
                    func.ST_Y(text("destination::geometry")).label(
                        "destination_latitude"
                    ),
                ).where(TripModel.TruckID == truck_id)
            )
            rows = result.all()

            return [self._row_to_entity(row) for row in rows]

        except SQLAlchemyError as e:
            raise Exception(f"Failed to get trips by truck ID: {str(e)}")

    # --------------------------------------------------------------------------------------------------------------------------------------------------

    async def get_by_order_id(self, order_id: int) -> List[Trip]:
        """Get trips by order ID"""
        try:
            result = await self.session.execute(
                select(
                    TripModel,
                    func.ST_X(text("origin::geometry")).label("origin_longitude"),
                    func.ST_Y(text("origin::geometry")).label("origin_latitude"),
                    func.ST_X(text("destination::geometry")).label(
                        "destination_longitude"
                    ),
                    func.ST_Y(text("destination::geometry")).label(
                        "destination_latitude"
                    ),
                ).where(TripModel.OrderID == order_id)
            )
            rows = result.all()

            return [self._row_to_entity(row) for row in rows]

        except SQLAlchemyError as e:
            raise Exception(f"Failed to get trips by order ID: {str(e)}")

    # --------------------------------------------------------------------------------------------------------------------------------------------------

    async def get_by_status(self, status: TripStatus) -> List[Trip]:
        """Get trips by status"""
        try:
            result = await self.session.execute(
                select(
                    TripModel,
                    func.ST_X(text("origin::geometry")).label("origin_longitude"),
                    func.ST_Y(text("origin::geometry")).label("origin_latitude"),
                    func.ST_X(text("destination::geometry")).label(
                        "destination_longitude"
                    ),
                    func.ST_Y(text("destination::geometry")).label(
                        "destination_latitude"
                    ),
                ).where(TripModel.Status == status.value)
            )
            rows = result.all()

            return [self._row_to_entity(row) for row in rows]

        except SQLAlchemyError as e:
            raise Exception(f"Failed to get trips by status: {str(e)}")

    # --------------------------------------------------------------------------------------------------------------------------------------------------

    async def get_by_truck_id_with_names(self, truck_id: int) -> List[dict]:
        """Get trips by truck ID with warehouse names and user names"""
        try:
            # Complex query to get trip data with warehouse names and user names
            result = await self.session.execute(
                select(
                    TripModel,
                    func.ST_X(text("origin::geometry")).label("origin_longitude"),
                    func.ST_Y(text("origin::geometry")).label("origin_latitude"),
                    func.ST_X(text("destination::geometry")).label(
                        "destination_longitude"
                    ),
                    func.ST_Y(text("destination::geometry")).label(
                        "destination_latitude"
                    ),
                    WarehouseModel.Name.label("origin_warehouse_name"),
                    UserModel.Name.label("destination_user_name"),
                )
                .outerjoin(OrderModel, TripModel.OrderID == OrderModel.OrderID)
                .outerjoin(UserModel, OrderModel.BuyerID == UserModel.UserID)
                .outerjoin(
                    WarehouseModel,
                    func.ST_DWithin(
                        TripModel.Origin,
                        WarehouseModel.Location,
                        1000,  # Within 1000 meters (1km) of warehouse location
                    ),
                )
                .where(TripModel.TruckID == truck_id)
            )
            rows = result.all()

            trips_data = []
            for row in rows:
                trip_model = row[0]

                # Extract origin location
                origin = None
                if row.origin_longitude is not None and row.origin_latitude is not None:
                    origin = Location(
                        longitude=float(row.origin_longitude),
                        latitude=float(row.origin_latitude),
                    )

                # Extract destination location
                destination = None
                if (
                    row.destination_longitude is not None
                    and row.destination_latitude is not None
                ):
                    destination = Location(
                        longitude=float(row.destination_longitude),
                        latitude=float(row.destination_latitude),
                    )

                trip_data = {
                    "trip_id": trip_model.TripID,
                    "truck_id": trip_model.TruckID,
                    "order_id": trip_model.OrderID,
                    "origin": origin,
                    "destination": destination,
                    "status": trip_model.Status,
                    "estimated_time": str(trip_model.EstimatedTime)
                    if trip_model.EstimatedTime
                    else None,
                    "actual_time": str(trip_model.ActualTime)
                    if trip_model.ActualTime
                    else None,
                    "start_date": trip_model.StartDate,
                    "end_date": trip_model.EndDate,
                    "origin_warehouse_name": row.origin_warehouse_name,
                    "destination_user_name": row.destination_user_name,
                }
                trips_data.append(trip_data)

            return trips_data

        except SQLAlchemyError as e:
            raise Exception(f"Failed to get trips by truck ID with names: {str(e)}")

    # --------------------------------------------------------------------------------------------------------------------------------------------------

    async def update(self, trip_id: int, trip: Trip) -> Optional[Trip]:
        """Update an existing trip"""
        try:
            update_values = {
                "TruckID": trip.truck_id,
                "OrderID": trip.order_id,
                "Status": trip.status.value,
                "EstimatedTime": trip.estimated_time,
                "ActualTime": trip.actual_time,
                "StartDate": trip.start_date,
                "EndDate": trip.end_date,
            }

            if trip.origin is not None:
                update_values["Origin"] = trip.origin.to_postgis_geography()
            if trip.destination is not None:
                update_values["Destination"] = trip.destination.to_postgis_geography()

            stmt = (
                update(TripModel)
                .where(TripModel.TripID == trip_id)
                .values(**update_values)
                .returning(TripModel)
            )

            result = await self.session.execute(stmt)
            updated_model = result.scalar_one_or_none()

            if updated_model is None:
                return None

            return self._model_to_entity(updated_model, trip.origin, trip.destination)

        except SQLAlchemyError as e:
            await self.session.rollback()
            raise Exception(f"Failed to update trip: {str(e)}")

    # --------------------------------------------------------------------------------------------------------------------------------------------------
    # Helper Methods
    # --------------------------------------------------------------------------------------------------------------------------------------------------

    def _row_to_entity(self, row) -> Trip:
        """Convert SQLAlchemy row to Trip entity"""
        trip_model = row[0]

        # Extract origin location
        origin = None
        if row.origin_longitude is not None and row.origin_latitude is not None:
            origin = Location(
                longitude=float(row.origin_longitude),
                latitude=float(row.origin_latitude),
            )

        # Extract destination location
        destination = None
        if (
            row.destination_longitude is not None
            and row.destination_latitude is not None
        ):
            destination = Location(
                longitude=float(row.destination_longitude),
                latitude=float(row.destination_latitude),
            )

        return Trip(
            trip_id=trip_model.TripID,
            truck_id=trip_model.TruckID,
            order_id=trip_model.OrderID,
            origin=origin,
            destination=destination,
            status=TripStatus(trip_model.Status),
            estimated_time=trip_model.EstimatedTime,
            actual_time=trip_model.ActualTime,
            start_date=trip_model.StartDate,
            end_date=trip_model.EndDate,
        )

    def _model_to_entity(
        self,
        model: TripModel,
        origin: Optional[Location] = None,
        destination: Optional[Location] = None,
    ) -> Trip:
        """Convert TripModel to Trip entity"""
        return Trip(
            trip_id=model.TripID,
            truck_id=model.TruckID,
            order_id=model.OrderID,
            origin=origin,
            destination=destination,
            status=TripStatus(model.Status),
            estimated_time=model.EstimatedTime,
            actual_time=model.ActualTime,
            start_date=model.StartDate,
            end_date=model.EndDate,
        )
