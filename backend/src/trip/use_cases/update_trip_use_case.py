from typing import Optional
from datetime import datetime
from src.trip.trip_entity import Trip, TripStatus
from src.trip.trip_repository import TripRepository
from src.trip.trip_dto import UpdateTripDto, TripResponseDto, trip_to_response_dto
from src.order.order_repository import OrderRepository
from src.order.order_entity import OrderStatus
from src.truck.truck_repository import TruckRepository
from src.truck.truck_entity import TruckStatus


class UpdateTripUseCase:
    def __init__(
        self,
        trip_repository: TripRepository,
        order_repository: OrderRepository,
        truck_repository: TruckRepository,
    ):
        self._trip_repository = trip_repository
        self._order_repository = order_repository
        self._truck_repository = truck_repository

    async def execute(
        self, trip_id: int, update_trip_dto: UpdateTripDto
    ) -> Optional[TripResponseDto]:
        """Update an existing trip with business logic"""
        # First, get the existing trip
        existing_trip = await self._trip_repository.get_by_id(trip_id)
        if not existing_trip:
            return None

        # Handle status change logic
        old_status = existing_trip.status
        new_status = update_trip_dto.status or existing_trip.status

        # Set end_date automatically when status becomes DELIVERED
        end_date = update_trip_dto.end_date
        if (
            new_status == TripStatus.DELIVERED
            and old_status != TripStatus.DELIVERED
            and end_date is None
        ):
            end_date = datetime.utcnow()

        # Set start_date automatically when status changes to COLLECTING or LOADED
        start_date = update_trip_dto.start_date
        if (
            new_status
            in [TripStatus.COLLECTING, TripStatus.LOADED, TripStatus.DELIVERING]
            and old_status == TripStatus.WAITING
            and start_date is None
        ):
            start_date = datetime.utcnow()

        # Create updated trip with new values or keep existing ones
        updated_trip = Trip(
            trip_id=existing_trip.trip_id,
            truck_id=update_trip_dto.truck_id
            if update_trip_dto.truck_id is not None
            else existing_trip.truck_id,
            order_id=update_trip_dto.order_id
            if update_trip_dto.order_id is not None
            else existing_trip.order_id,
            origin=update_trip_dto.origin
            if update_trip_dto.origin is not None
            else existing_trip.origin,
            destination=update_trip_dto.destination
            if update_trip_dto.destination is not None
            else existing_trip.destination,
            status=new_status,
            estimated_time=update_trip_dto.estimated_time
            if update_trip_dto.estimated_time is not None
            else existing_trip.estimated_time,
            actual_time=update_trip_dto.actual_time
            if update_trip_dto.actual_time is not None
            else existing_trip.actual_time,
            start_date=start_date or existing_trip.start_date,
            end_date=end_date or existing_trip.end_date,
        )

        # Update the trip
        result = await self._trip_repository.update(trip_id, updated_trip)
        if not result:
            return None

        # Handle post-update business logic
        await self._handle_trip_status_changes(result, old_status)

        return trip_to_response_dto(result)

    async def _handle_trip_status_changes(
        self, trip: Trip, old_status: TripStatus
    ) -> None:
        """Handle business logic when trip status changes"""
        # When trip is delivered, mark associated order as completed
        if trip.status == TripStatus.DELIVERED and old_status != TripStatus.DELIVERED:
            if trip.order_id:
                await self._mark_order_as_completed(trip.order_id)

            # Set truck back to available if it's assigned
            if trip.truck_id:
                await self._truck_repository.update_status_and_location(
                    trip.truck_id, TruckStatus.AVAILABLE
                )

    async def _mark_order_as_completed(self, order_id: int) -> None:
        """Mark an order as completed"""
        existing_order = await self._order_repository.get_by_id(order_id)
        if existing_order:
            # Create updated order with COMPLETED status
            from src.order.order_entity import Order

            completed_order = Order(
                order_id=existing_order.order_id,
                buyer_id=existing_order.buyer_id,
                order_date=existing_order.order_date,
                status=OrderStatus.COMPLETED,
                total_amount=existing_order.total_amount,
            )
            await self._order_repository.update(order_id, completed_order)
