from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, extract
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from pydantic import BaseModel
from geoalchemy2.functions import ST_AsText

from src.database import get_db_session
from src.product.product_entity import ProductModel
from src.product_record.product_record_entity import (
    ProductRecordModel,
    ProductRecordStatus,
)
from src.order.order_entity import OrderModel, OrderStatus
from src.order_item.order_item_entity import OrderItemModel
from src.trip.trip_entity import TripModel, TripStatus
from src.warehouse.warehouse_entity import WarehouseModel
from src.quote.quote_entity import QuoteModel, QuoteStatus
from src.user.user_entity import UserModel
from src.warehouse_transfer.warehouse_transfer_entity import WarehouseTransferModel

router = APIRouter(prefix="/analytics", tags=["Analytics"])


class FinancialMetrics(BaseModel):
    total_revenue: float
    total_orders: int
    average_order_value: float
    completed_orders: int
    pending_orders: int
    cancelled_orders: int
    total_quotes_value: float
    approved_quotes_count: int
    rejected_quotes_count: int
    pending_quotes_count: int


class InventoryMetrics(BaseModel):
    total_in_stock_kg: float
    total_sold_kg: float
    total_discarded_kg: float
    total_donated_kg: float
    total_products: int
    products_requiring_refrigeration: int
    inventory_turnover_rate: float
    loss_percentage: float
    waste_percentage: float
    total_warehouses: int


class OperationalMetrics(BaseModel):
    total_trips: int
    completed_trips: int
    in_progress_trips: int
    pending_trips: int
    trip_completion_rate: float
    total_transfers: int
    total_suppliers: int
    total_buyers: int
    total_drivers: int


class ProductPerformance(BaseModel):
    product_id: int
    name: str
    total_sold_kg: float
    total_revenue: float
    total_discarded_kg: float
    total_donated_kg: float
    loss_rate: float


class TimeSeriesData(BaseModel):
    date: str
    revenue: float
    orders_count: int
    products_sold_kg: float
    products_discarded_kg: float


class WarehouseAnalytics(BaseModel):
    warehouse_id: int
    name: str
    location: Optional[str]
    total_stock_kg: float
    products_count: int
    utilization_percentage: float


class ComprehensiveAnalytics(BaseModel):
    financial: FinancialMetrics
    inventory: InventoryMetrics
    operational: OperationalMetrics
    top_products: List[ProductPerformance]
    warehouse_analytics: List[WarehouseAnalytics]
    time_series: List[TimeSeriesData]
    analysis_timestamp: str


@router.get("/comprehensive", response_model=ComprehensiveAnalytics)
async def get_comprehensive_analytics(
    days_back: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    db: AsyncSession = Depends(get_db_session),
):
    """Get comprehensive analytics data for the admin dashboard"""

    try:
        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days_back)

        # Financial Metrics
        financial_data = await _get_financial_metrics(db, start_date, end_date)

        # Inventory Metrics
        inventory_data = await _get_inventory_metrics(db)

        # Operational Metrics
        operational_data = await _get_operational_metrics(db, start_date, end_date)

        # Top Products Performance
        top_products = await _get_top_products_performance(db, limit=10)

        # Warehouse Analytics
        warehouse_analytics = await _get_warehouse_analytics(db)

        # Time Series Data
        time_series = await _get_time_series_data(db, start_date, end_date)

        return ComprehensiveAnalytics(
            financial=financial_data,
            inventory=inventory_data,
            operational=operational_data,
            top_products=top_products,
            warehouse_analytics=warehouse_analytics,
            time_series=time_series,
            analysis_timestamp=datetime.now().isoformat(),
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error generating analytics: {str(e)}"
        )


async def _get_financial_metrics(
    db: AsyncSession, start_date: datetime, end_date: datetime
) -> FinancialMetrics:
    """Calculate financial metrics"""

    # Order metrics
    order_query = select(
        func.coalesce(func.sum(OrderModel.TotalAmount), 0).label("total_revenue"),
        func.count(OrderModel.OrderID).label("total_orders"),
        func.count()
        .filter(OrderModel.Status == OrderStatus.COMPLETED.value)
        .label("completed_orders"),
        func.count()
        .filter(OrderModel.Status == OrderStatus.PENDING.value)
        .label("pending_orders"),
        func.count()
        .filter(OrderModel.Status == OrderStatus.CANCELLED.value)
        .label("cancelled_orders"),
    ).where(and_(OrderModel.OrderDate >= start_date, OrderModel.OrderDate <= end_date))

    order_result = await db.execute(order_query)
    order_data = order_result.first()

    # Quote metrics
    quote_query = select(
        func.count()
        .filter(QuoteModel.Status == QuoteStatus.APPROVED.value)
        .label("approved_quotes"),
        func.count()
        .filter(QuoteModel.Status == QuoteStatus.REJECTED.value)
        .label("rejected_quotes"),
        func.count()
        .filter(QuoteModel.Status == QuoteStatus.PENDING.value)
        .label("pending_quotes"),
    ).where(
        and_(
            QuoteModel.SubmissionDate >= start_date,
            QuoteModel.SubmissionDate <= end_date,
        )
    )

    quote_result = await db.execute(quote_query)
    quote_data = quote_result.first()

    # Calculate average order value
    avg_order_value = (
        (order_data.total_revenue / order_data.total_orders)
        if order_data.total_orders > 0
        else 0
    )

    return FinancialMetrics(
        total_revenue=float(order_data.total_revenue or 0),
        total_orders=int(order_data.total_orders or 0),
        average_order_value=float(avg_order_value),
        completed_orders=int(order_data.completed_orders or 0),
        pending_orders=int(order_data.pending_orders or 0),
        cancelled_orders=int(order_data.cancelled_orders or 0),
        total_quotes_value=0.0,  # Would need product prices to calculate
        approved_quotes_count=int(quote_data.approved_quotes or 0),
        rejected_quotes_count=int(quote_data.rejected_quotes or 0),
        pending_quotes_count=int(quote_data.pending_quotes or 0),
    )


async def _get_inventory_metrics(db: AsyncSession) -> InventoryMetrics:
    """Calculate inventory metrics"""

    # Product record metrics by status
    inventory_query = select(
        func.coalesce(
            func.sum(ProductRecordModel.QuantityKg).filter(
                ProductRecordModel.Status == ProductRecordStatus.IN_STOCK.value
            ),
            0,
        ).label("in_stock"),
        func.coalesce(
            func.sum(ProductRecordModel.QuantityKg).filter(
                ProductRecordModel.Status == ProductRecordStatus.SOLD.value
            ),
            0,
        ).label("sold"),
        func.coalesce(
            func.sum(ProductRecordModel.QuantityKg).filter(
                ProductRecordModel.Status == ProductRecordStatus.DISCARDED.value
            ),
            0,
        ).label("discarded"),
        func.coalesce(
            func.sum(ProductRecordModel.QuantityKg).filter(
                ProductRecordModel.Status == ProductRecordStatus.DONATED.value
            ),
            0,
        ).label("donated"),
    )

    inventory_result = await db.execute(inventory_query)
    inventory_data = inventory_result.first()

    # Product counts
    product_counts_query = select(
        func.count(ProductModel.ProductID).label("total_products"),
        func.count()
        .filter(ProductModel.RequiresRefrigeration == True)
        .label("refrigeration_products"),
    )

    product_counts_result = await db.execute(product_counts_query)
    product_counts = product_counts_result.first()

    # Warehouse count
    warehouse_count_query = select(func.count(WarehouseModel.WarehouseID))
    warehouse_count_result = await db.execute(warehouse_count_query)
    total_warehouses = warehouse_count_result.scalar()

    # Calculate metrics
    total_sold = float(inventory_data.sold or 0)
    total_discarded = float(inventory_data.discarded or 0)
    total_donated = float(inventory_data.donated or 0)
    total_processed = total_sold + total_discarded + total_donated

    inventory_turnover_rate = (
        (total_sold / float(inventory_data.in_stock or 1)) * 100
        if inventory_data.in_stock
        else 0
    )
    loss_percentage = (
        ((total_discarded + total_donated) / total_processed * 100)
        if total_processed > 0
        else 0
    )
    waste_percentage = (
        (total_discarded / total_processed * 100) if total_processed > 0 else 0
    )

    return InventoryMetrics(
        total_in_stock_kg=float(inventory_data.in_stock or 0),
        total_sold_kg=total_sold,
        total_discarded_kg=total_discarded,
        total_donated_kg=total_donated,
        total_products=int(product_counts.total_products or 0),
        products_requiring_refrigeration=int(
            product_counts.refrigeration_products or 0
        ),
        inventory_turnover_rate=float(inventory_turnover_rate),
        loss_percentage=float(loss_percentage),
        waste_percentage=float(waste_percentage),
        total_warehouses=int(total_warehouses or 0),
    )


async def _get_operational_metrics(
    db: AsyncSession, start_date: datetime, end_date: datetime
) -> OperationalMetrics:
    """Calculate operational metrics"""

    # Trip metrics
    trip_query = select(
        func.count(TripModel.TripID).label("total_trips"),
        func.count()
        .filter(TripModel.Status == TripStatus.DELIVERED.value)
        .label("completed_trips"),
        func.count()
        .filter(
            TripModel.Status.in_(
                [
                    TripStatus.COLLECTING.value,
                    TripStatus.LOADED.value,
                    TripStatus.DELIVERING.value,
                ]
            )
        )
        .label("in_progress_trips"),
        func.count()
        .filter(TripModel.Status == TripStatus.WAITING.value)
        .label("pending_trips"),
    ).where(and_(TripModel.StartDate >= start_date, TripModel.StartDate <= end_date))

    trip_result = await db.execute(trip_query)
    trip_data = trip_result.first()

    # Transfer count
    transfer_count_query = select(func.count(WarehouseTransferModel.TransferID))
    transfer_count_result = await db.execute(transfer_count_query)
    total_transfers = transfer_count_result.scalar()

    # User counts by role
    user_counts_query = select(
        func.count().filter(UserModel.Role == "Supplier").label("suppliers"),
        func.count().filter(UserModel.Role == "Buyer").label("buyers"),
        func.count().filter(UserModel.Role == "TruckDriver").label("drivers"),
    )

    user_counts_result = await db.execute(user_counts_query)
    user_counts = user_counts_result.first()

    # Calculate trip completion rate
    completion_rate = (
        (trip_data.completed_trips / trip_data.total_trips * 100)
        if trip_data.total_trips > 0
        else 0
    )

    return OperationalMetrics(
        total_trips=int(trip_data.total_trips or 0),
        completed_trips=int(trip_data.completed_trips or 0),
        in_progress_trips=int(trip_data.in_progress_trips or 0),
        pending_trips=int(trip_data.pending_trips or 0),
        trip_completion_rate=float(completion_rate),
        total_transfers=int(total_transfers or 0),
        total_suppliers=int(user_counts.suppliers or 0),
        total_buyers=int(user_counts.buyers or 0),
        total_drivers=int(user_counts.drivers or 0),
    )


async def _get_top_products_performance(
    db: AsyncSession, limit: int = 10
) -> List[ProductPerformance]:
    """Get top performing products"""

    query = (
        select(
            ProductModel.ProductID,
            ProductModel.Name,
            func.coalesce(
                func.sum(ProductRecordModel.QuantityKg).filter(
                    ProductRecordModel.Status == ProductRecordStatus.SOLD.value
                ),
                0,
            ).label("sold_kg"),
            func.coalesce(
                func.sum(ProductRecordModel.QuantityKg).filter(
                    ProductRecordModel.Status == ProductRecordStatus.DISCARDED.value
                ),
                0,
            ).label("discarded_kg"),
            func.coalesce(
                func.sum(ProductRecordModel.QuantityKg).filter(
                    ProductRecordModel.Status == ProductRecordStatus.DONATED.value
                ),
                0,
            ).label("donated_kg"),
        )
        .select_from(
            ProductModel.__table__.join(
                ProductRecordModel,
                ProductModel.ProductID == ProductRecordModel.ProductID,
            )
        )
        .group_by(ProductModel.ProductID, ProductModel.Name)
        .order_by(
            func.sum(ProductRecordModel.QuantityKg)
            .filter(ProductRecordModel.Status == ProductRecordStatus.SOLD.value)
            .desc()
        )
        .limit(limit)
    )

    result = await db.execute(query)
    products_data = result.all()

    products = []
    for row in products_data:
        total_processed = float(row.sold_kg + row.discarded_kg + row.donated_kg)
        loss_rate = (
            ((row.discarded_kg + row.donated_kg) / total_processed * 100)
            if total_processed > 0
            else 0
        )

        # Estimate revenue (would need actual pricing data for accuracy)
        estimated_revenue = float(row.sold_kg * 10)  # Placeholder calculation

        products.append(
            ProductPerformance(
                product_id=row.ProductID,
                name=row.Name,
                total_sold_kg=float(row.sold_kg),
                total_revenue=estimated_revenue,
                total_discarded_kg=float(row.discarded_kg),
                total_donated_kg=float(row.donated_kg),
                loss_rate=float(loss_rate),
            )
        )

    return products


async def _get_warehouse_analytics(db: AsyncSession) -> List[WarehouseAnalytics]:
    """Get warehouse performance analytics"""

    query = (
        select(
            WarehouseModel.WarehouseID,
            WarehouseModel.Name,
            ST_AsText(WarehouseModel.Location).label("location_text"),
            WarehouseModel.NormalCapacityKg,
            WarehouseModel.RefrigeratedCapacityKg,
            func.coalesce(func.sum(ProductRecordModel.QuantityKg), 0).label(
                "total_stock"
            ),
            func.count(ProductRecordModel.RecordID).label("products_count"),
        )
        .select_from(
            WarehouseModel.__table__.outerjoin(
                ProductRecordModel,
                and_(
                    WarehouseModel.WarehouseID == ProductRecordModel.WarehouseID,
                    ProductRecordModel.Status == ProductRecordStatus.IN_STOCK.value,
                ),
            )
        )
        .group_by(
            WarehouseModel.WarehouseID, WarehouseModel.Name, WarehouseModel.Location,
            WarehouseModel.NormalCapacityKg, WarehouseModel.RefrigeratedCapacityKg
        )
    )

    result = await db.execute(query)
    warehouses_data = result.all()

    warehouses = []
    for row in warehouses_data:
        # Calculate utilization based on actual warehouse capacity
        total_capacity = float(row.NormalCapacityKg or 0) + float(row.RefrigeratedCapacityKg or 0)
        utilization = (
            min(100.0, float(row.total_stock / total_capacity * 100))
            if row.total_stock and total_capacity > 0
            else 0.0
        )

        # Convert PostGIS point to readable location string
        location_str = None
        if row.location_text:
            try:
                # Parse POINT(longitude latitude) format
                if row.location_text.startswith(
                    "POINT("
                ) and row.location_text.endswith(")"):
                    coords = row.location_text[6:-1].split(" ")
                    if len(coords) == 2:
                        longitude, latitude = coords
                        location_str = f"{float(latitude):.4f}, {float(longitude):.4f}"
            except (ValueError, IndexError):
                location_str = "Unknown location"

        warehouses.append(
            WarehouseAnalytics(
                warehouse_id=row.WarehouseID,
                name=row.Name,
                location=location_str,
                total_stock_kg=float(row.total_stock or 0),
                products_count=int(row.products_count or 0),
                utilization_percentage=utilization,
            )
        )

    return warehouses


async def _get_time_series_data(
    db: AsyncSession, start_date: datetime, end_date: datetime
) -> List[TimeSeriesData]:
    """Get time series data for charts"""

    # Daily aggregation
    query = (
        select(
            func.date(OrderModel.OrderDate).label("date"),
            func.coalesce(func.sum(OrderModel.TotalAmount), 0).label("revenue"),
            func.count(OrderModel.OrderID).label("orders_count"),
        )
        .where(
            and_(OrderModel.OrderDate >= start_date, OrderModel.OrderDate <= end_date)
        )
        .group_by(func.date(OrderModel.OrderDate))
        .order_by(func.date(OrderModel.OrderDate))
    )

    result = await db.execute(query)
    daily_data = result.all()

    # Get product records data
    product_query = (
        select(
            func.date(ProductRecordModel.RegistrationDate).label("date"),
            func.coalesce(
                func.sum(ProductRecordModel.QuantityKg).filter(
                    ProductRecordModel.Status == ProductRecordStatus.SOLD.value
                ),
                0,
            ).label("sold_kg"),
            func.coalesce(
                func.sum(ProductRecordModel.QuantityKg).filter(
                    ProductRecordModel.Status == ProductRecordStatus.DISCARDED.value
                ),
                0,
            ).label("discarded_kg"),
        )
        .where(
            and_(
                ProductRecordModel.RegistrationDate >= start_date,
                ProductRecordModel.RegistrationDate <= end_date,
            )
        )
        .group_by(func.date(ProductRecordModel.RegistrationDate))
    )

    product_result = await db.execute(product_query)
    product_data = {row.date: row for row in product_result.all()}

    time_series = []
    for row in daily_data:
        product_info = product_data.get(row.date)

        time_series.append(
            TimeSeriesData(
                date=row.date.isoformat() if row.date else "",
                revenue=float(row.revenue or 0),
                orders_count=int(row.orders_count or 0),
                products_sold_kg=float(product_info.sold_kg if product_info else 0),
                products_discarded_kg=float(
                    product_info.discarded_kg if product_info else 0
                ),
            )
        )

    return time_series
