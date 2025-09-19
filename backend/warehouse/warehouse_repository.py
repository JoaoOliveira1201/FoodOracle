from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from geoalchemy2.functions import ST_DWithin, ST_Distance
from sqlalchemy import func, text
from src.warehouse.warehouse_entity import Warehouse, WarehouseModel
from src.base import Location
from src.product_record.product_record_entity import ProductRecordModel
from src.product.product_entity import ProductModel


class WarehouseRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, warehouse: Warehouse) -> Warehouse:
        """Create a new warehouse"""
        try:
            warehouse_model = WarehouseModel(
                Name=warehouse.name,
                Location=warehouse.location.to_postgis_geography(),
                NormalCapacityKg=warehouse.normal_capacity_kg,
                RefrigeratedCapacityKg=warehouse.refrigerated_capacity_kg,
            )

            self.session.add(warehouse_model)
            await self.session.flush()

            created_warehouse = self._model_to_entity(
                warehouse_model, warehouse.name, warehouse.location
            )
            return created_warehouse

        except SQLAlchemyError as e:
            await self.session.rollback()
            raise Exception(f"Failed to create warehouse: {str(e)}")

    async def get_by_id(self, warehouse_id: int) -> Optional[Warehouse]:
        """Get warehouse by ID"""
        try:
            result = await self.session.execute(
                select(
                    WarehouseModel,
                    func.ST_X(text("location::geometry")).label("longitude"),
                    func.ST_Y(text("location::geometry")).label("latitude"),
                ).where(WarehouseModel.WarehouseID == warehouse_id)
            )
            row = result.first()

            if not row:
                return None

            return self._row_to_entity(row)

        except SQLAlchemyError as e:
            raise Exception(f"Failed to get warehouse by ID: {str(e)}")

    async def get_all(self) -> List[Warehouse]:
        """Get all warehouses"""
        try:
            result = await self.session.execute(
                select(
                    WarehouseModel,
                    func.ST_X(text("location::geometry")).label("longitude"),
                    func.ST_Y(text("location::geometry")).label("latitude"),
                )
            )
            rows = result.all()

            return [self._row_to_entity(row) for row in rows]

        except SQLAlchemyError as e:
            raise Exception(f"Failed to get all warehouses: {str(e)}")

    async def get_warehouses_within_distance(
        self, center: Location, distance_meters: float
    ) -> List[Warehouse]:
        """Get warehouses within a certain distance from a center point"""
        try:
            result = await self.session.execute(
                select(
                    WarehouseModel,
                    func.ST_X(text("location::geometry")).label("longitude"),
                    func.ST_Y(text("location::geometry")).label("latitude"),
                ).where(
                    ST_DWithin(
                        WarehouseModel.Location,
                        center.to_postgis_geography(),
                        distance_meters,
                    )
                )
            )
            rows = result.all()

            return [self._row_to_entity(row) for row in rows]

        except SQLAlchemyError as e:
            raise Exception(f"Failed to get warehouses within distance: {str(e)}")

    def _row_to_entity(self, row) -> Warehouse:
        """Convert SQLAlchemy row to domain entity"""
        warehouse_model = row[0]
        location = Location.from_db_row(row)

        return Warehouse(
            warehouse_id=warehouse_model.WarehouseID,
            name=warehouse_model.Name,
            location=location,
            normal_capacity_kg=warehouse_model.NormalCapacityKg,
            refrigerated_capacity_kg=warehouse_model.RefrigeratedCapacityKg,
        )

    async def find_nearest_suitable_warehouse(
        self,
        supplier_location: Location,
        requires_refrigeration: bool,
        quantity_kg: int,
    ) -> Optional[Warehouse]:
        """Find the nearest warehouse with enough capacity for the product."""
        try:
            # Query warehouses ordered by distance with current usage
            query = text("""
                WITH warehouse_usage AS (
                    SELECT 
                        w.warehouseid,
                        w.name,
                        w.location,
                        w.normalcapacitykg,
                        w.refrigeratedcapacitykg,
                        COALESCE(SUM(CASE WHEN NOT p.requiresrefrigeration THEN pr.quantitykg ELSE 0 END), 0) as normal_used,
                        COALESCE(SUM(CASE WHEN p.requiresrefrigeration THEN pr.quantitykg ELSE 0 END), 0) as refrigerated_used,
                        ST_Distance(w.location, ST_GeogFromText(:supplier_location)) as distance
                    FROM warehouse w
                    LEFT JOIN productrecord pr ON w.warehouseid = pr.warehouseid AND pr.status = 'InStock'
                    LEFT JOIN product p ON pr.productid = p.productid
                    GROUP BY w.warehouseid, w.name, w.location, w.normalcapacitykg, w.refrigeratedcapacitykg
                )
                SELECT 
                    warehouseid,
                    name,
                    ST_X(location::geometry) as longitude,
                    ST_Y(location::geometry) as latitude,
                    normalcapacitykg,
                    refrigeratedcapacitykg,
                    normal_used,
                    refrigerated_used,
                    distance
                FROM warehouse_usage
                WHERE (:requires_refrigeration = false OR (refrigeratedcapacitykg > 0 AND refrigeratedcapacitykg - refrigerated_used >= :quantity_kg))
                AND (:requires_refrigeration = true OR normalcapacitykg - normal_used >= :quantity_kg)
                ORDER BY distance
                LIMIT 1
            """)

            result = await self.session.execute(
                query,
                {
                    "supplier_location": supplier_location.to_wkt(),
                    "requires_refrigeration": requires_refrigeration,
                    "quantity_kg": quantity_kg,
                },
            )
            row = result.first()

            if not row:
                return None

            location = Location(latitude=row.latitude, longitude=row.longitude)
            return Warehouse(
                warehouse_id=row.warehouseid,
                name=row.name,  # This needs to be added to the query
                location=location,
                normal_capacity_kg=row.normalcapacitykg,
                refrigerated_capacity_kg=row.refrigeratedcapacitykg,
            )

        except SQLAlchemyError as e:
            raise Exception(f"Failed to find suitable warehouse: {str(e)}")

    async def get_products_in_storage(self, warehouse_id: int) -> List[Dict[str, Any]]:
        """Get all products currently in storage at a specific warehouse"""
        try:
            result = await self.session.execute(
                select(
                    ProductRecordModel.RecordID,
                    ProductRecordModel.ProductID,
                    ProductRecordModel.QuantityKg,
                    ProductRecordModel.QualityClassification,
                    ProductRecordModel.Status,
                    ProductRecordModel.RegistrationDate,
                    ProductModel.Name,
                    ProductModel.RequiresRefrigeration,
                    ProductModel.BasePrice,
                    ProductModel.ShelfLifeDays,
                    ProductModel.DeadlineToDiscount,
                )
                .join(
                    ProductModel, ProductRecordModel.ProductID == ProductModel.ProductID
                )
                .where(
                    ProductRecordModel.WarehouseID == warehouse_id,
                    ProductRecordModel.Status == "InStock",
                )
            )
            rows = result.all()

            products_in_storage = []
            for row in rows:
                products_in_storage.append(
                    {
                        "record_id": row.RecordID,
                        "product_id": row.ProductID,
                        "product_name": row.Name,
                        "quantity_kg": row.QuantityKg,
                        "quality_classification": row.QualityClassification,
                        "status": row.Status,
                        "registration_date": row.RegistrationDate,
                        "requires_refrigeration": row.RequiresRefrigeration,
                        "base_price": row.BasePrice,
                        "shelf_life_days": row.ShelfLifeDays,
                        "deadline_to_discount": row.DeadlineToDiscount,
                    }
                )

            return products_in_storage

        except SQLAlchemyError as e:
            raise Exception(f"Failed to get products in storage: {str(e)}")

    def _model_to_entity(
        self, warehouse_model: WarehouseModel, name: str, location: Location
    ) -> Warehouse:
        """Convert SQLAlchemy model to domain entity"""
        return Warehouse(
            warehouse_id=warehouse_model.WarehouseID,
            name=name,
            location=location,
            normal_capacity_kg=warehouse_model.NormalCapacityKg,
            refrigerated_capacity_kg=warehouse_model.RefrigeratedCapacityKg,
        )
