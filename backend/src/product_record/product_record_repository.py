from typing import List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func
from sqlalchemy.orm import joinedload
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime
from src.product_record.product_record_entity import (
    ProductRecord,
    ProductRecordModel,
    QualityClassification,
    ProductRecordStatus,
)
from src.product.product_entity import ProductModel
from src.user.user_entity import UserModel
from src.warehouse.warehouse_entity import WarehouseModel


class ProductRecordRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, product_record: ProductRecord) -> ProductRecord:
        """Create a new product record"""
        try:
            product_record_model = ProductRecordModel(
                ProductID=product_record.product_id,
                SupplierID=product_record.supplier_id,
                WarehouseID=product_record.warehouse_id,
                QuantityKg=product_record.quantity_kg,
                QualityClassification=product_record.quality_classification.value
                if product_record.quality_classification
                else None,
                Status=product_record.status.value,
                ImagePath=product_record.image_path,
                RegistrationDate=product_record.registration_date or datetime.utcnow(),
                SaleDate=product_record.sale_date,
            )

            self.session.add(product_record_model)
            await self.session.flush()

            created_product_record = self._model_to_entity(product_record_model)
            return created_product_record

        except SQLAlchemyError as e:
            await self.session.rollback()
            raise Exception(f"Failed to create product record: {str(e)}")

    async def get_by_id(self, record_id: int) -> Optional[ProductRecord]:
        """Get product record by ID"""
        try:
            result = await self.session.execute(
                select(ProductRecordModel).where(
                    ProductRecordModel.RecordID == record_id
                )
            )
            product_record_model = result.scalar_one_or_none()

            if not product_record_model:
                return None

            return self._model_to_entity(product_record_model)

        except SQLAlchemyError as e:
            raise Exception(f"Failed to get product record by ID: {str(e)}")

    async def get_by_id_with_names(
        self, record_id: int
    ) -> Optional[Tuple[ProductRecord, Optional[str], Optional[str]]]:
        """Get product record by ID with supplier and warehouse names"""
        try:
            result = await self.session.execute(
                select(
                    ProductRecordModel,
                    UserModel.Name.label("supplier_name"),
                    WarehouseModel.Name.label("warehouse_name"),
                )
                .outerjoin(UserModel, ProductRecordModel.SupplierID == UserModel.UserID)
                .outerjoin(
                    WarehouseModel,
                    ProductRecordModel.WarehouseID == WarehouseModel.WarehouseID,
                )
                .where(ProductRecordModel.RecordID == record_id)
            )
            row = result.first()

            if not row:
                return None

            product_record = self._model_to_entity(row.ProductRecordModel)
            return product_record, row.supplier_name, row.warehouse_name

        except SQLAlchemyError as e:
            raise Exception(f"Failed to get product record by ID with names: {str(e)}")

    async def get_all(self) -> List[ProductRecord]:
        """Get all product records"""
        try:
            result = await self.session.execute(select(ProductRecordModel))
            product_record_models = result.scalars().all()

            return [self._model_to_entity(model) for model in product_record_models]

        except SQLAlchemyError as e:
            raise Exception(f"Failed to get all product records: {str(e)}")

    async def get_all_with_names(
        self,
    ) -> List[Tuple[ProductRecord, Optional[str], Optional[str]]]:
        """Get all product records with supplier and warehouse names"""
        try:
            result = await self.session.execute(
                select(
                    ProductRecordModel,
                    UserModel.Name.label("supplier_name"),
                    WarehouseModel.Name.label("warehouse_name"),
                )
                .outerjoin(UserModel, ProductRecordModel.SupplierID == UserModel.UserID)
                .outerjoin(
                    WarehouseModel,
                    ProductRecordModel.WarehouseID == WarehouseModel.WarehouseID,
                )
            )
            rows = result.all()

            return [
                (
                    self._model_to_entity(row.ProductRecordModel),
                    row.supplier_name,
                    row.warehouse_name,
                )
                for row in rows
            ]

        except SQLAlchemyError as e:
            raise Exception(f"Failed to get all product records with names: {str(e)}")

    async def get_by_supplier_id(self, supplier_id: int) -> List[ProductRecord]:
        """Get product records by supplier ID"""
        try:
            result = await self.session.execute(
                select(ProductRecordModel).where(
                    ProductRecordModel.SupplierID == supplier_id
                )
            )
            product_record_models = result.scalars().all()

            return [self._model_to_entity(model) for model in product_record_models]

        except SQLAlchemyError as e:
            raise Exception(f"Failed to get product records by supplier ID: {str(e)}")

    async def get_by_supplier_id_with_names(
        self, supplier_id: int
    ) -> List[Tuple[ProductRecord, Optional[str], Optional[str]]]:
        """Get product records by supplier ID with supplier and warehouse names"""
        try:
            result = await self.session.execute(
                select(
                    ProductRecordModel,
                    UserModel.Name.label("supplier_name"),
                    WarehouseModel.Name.label("warehouse_name"),
                )
                .outerjoin(UserModel, ProductRecordModel.SupplierID == UserModel.UserID)
                .outerjoin(
                    WarehouseModel,
                    ProductRecordModel.WarehouseID == WarehouseModel.WarehouseID,
                )
                .where(ProductRecordModel.SupplierID == supplier_id)
            )
            rows = result.all()

            return [
                (
                    self._model_to_entity(row.ProductRecordModel),
                    row.supplier_name,
                    row.warehouse_name,
                )
                for row in rows
            ]

        except SQLAlchemyError as e:
            raise Exception(
                f"Failed to get product records by supplier ID with names: {str(e)}"
            )

    async def get_by_product_id(self, product_id: int) -> List[ProductRecord]:
        """Get product records by product ID"""
        try:
            result = await self.session.execute(
                select(ProductRecordModel).where(
                    ProductRecordModel.ProductID == product_id
                )
            )
            product_record_models = result.scalars().all()

            return [self._model_to_entity(model) for model in product_record_models]

        except SQLAlchemyError as e:
            raise Exception(f"Failed to get product records by product ID: {str(e)}")

    async def get_by_product_id_with_names(
        self, product_id: int
    ) -> List[Tuple[ProductRecord, Optional[str], Optional[str]]]:
        """Get product records by product ID with supplier and warehouse names"""
        try:
            result = await self.session.execute(
                select(
                    ProductRecordModel,
                    UserModel.Name.label("supplier_name"),
                    WarehouseModel.Name.label("warehouse_name"),
                )
                .outerjoin(UserModel, ProductRecordModel.SupplierID == UserModel.UserID)
                .outerjoin(
                    WarehouseModel,
                    ProductRecordModel.WarehouseID == WarehouseModel.WarehouseID,
                )
                .where(ProductRecordModel.ProductID == product_id)
            )
            rows = result.all()

            return [
                (
                    self._model_to_entity(row.ProductRecordModel),
                    row.supplier_name,
                    row.warehouse_name,
                )
                for row in rows
            ]

        except SQLAlchemyError as e:
            raise Exception(
                f"Failed to get product records by product ID with names: {str(e)}"
            )

    async def get_by_warehouse_id(self, warehouse_id: int) -> List[ProductRecord]:
        """Get product records by warehouse ID"""
        try:
            result = await self.session.execute(
                select(ProductRecordModel).where(
                    ProductRecordModel.WarehouseID == warehouse_id
                )
            )
            product_record_models = result.scalars().all()

            return [self._model_to_entity(model) for model in product_record_models]

        except SQLAlchemyError as e:
            raise Exception(f"Failed to get product records by warehouse ID: {str(e)}")

    async def get_by_warehouse_id_with_names(
        self, warehouse_id: int
    ) -> List[Tuple[ProductRecord, Optional[str], Optional[str]]]:
        """Get product records by warehouse ID with supplier and warehouse names"""
        try:
            result = await self.session.execute(
                select(
                    ProductRecordModel,
                    UserModel.Name.label("supplier_name"),
                    WarehouseModel.Name.label("warehouse_name"),
                )
                .outerjoin(UserModel, ProductRecordModel.SupplierID == UserModel.UserID)
                .outerjoin(
                    WarehouseModel,
                    ProductRecordModel.WarehouseID == WarehouseModel.WarehouseID,
                )
                .where(ProductRecordModel.WarehouseID == warehouse_id)
            )
            rows = result.all()

            return [
                (
                    self._model_to_entity(row.ProductRecordModel),
                    row.supplier_name,
                    row.warehouse_name,
                )
                for row in rows
            ]

        except SQLAlchemyError as e:
            raise Exception(
                f"Failed to get product records by warehouse ID with names: {str(e)}"
            )

    async def get_by_status(self, status: ProductRecordStatus) -> List[ProductRecord]:
        """Get product records by status"""
        try:
            result = await self.session.execute(
                select(ProductRecordModel).where(
                    ProductRecordModel.Status == status.value
                )
            )
            product_record_models = result.scalars().all()

            return [self._model_to_entity(model) for model in product_record_models]

        except SQLAlchemyError as e:
            raise Exception(f"Failed to get product records by status: {str(e)}")

    async def get_by_status_with_names(
        self, status: ProductRecordStatus
    ) -> List[Tuple[ProductRecord, Optional[str], Optional[str]]]:
        """Get product records by status with supplier and warehouse names"""
        try:
            result = await self.session.execute(
                select(
                    ProductRecordModel,
                    UserModel.Name.label("supplier_name"),
                    WarehouseModel.Name.label("warehouse_name"),
                )
                .outerjoin(UserModel, ProductRecordModel.SupplierID == UserModel.UserID)
                .outerjoin(
                    WarehouseModel,
                    ProductRecordModel.WarehouseID == WarehouseModel.WarehouseID,
                )
                .where(ProductRecordModel.Status == status.value)
            )
            rows = result.all()

            return [
                (
                    self._model_to_entity(row.ProductRecordModel),
                    row.supplier_name,
                    row.warehouse_name,
                )
                for row in rows
            ]

        except SQLAlchemyError as e:
            raise Exception(
                f"Failed to get product records by status with names: {str(e)}"
            )

    async def get_by_quality_classification(
        self, quality_classification: QualityClassification
    ) -> List[ProductRecord]:
        """Get product records by quality classification"""
        try:
            result = await self.session.execute(
                select(ProductRecordModel).where(
                    ProductRecordModel.QualityClassification
                    == quality_classification.value
                )
            )
            product_record_models = result.scalars().all()

            return [self._model_to_entity(model) for model in product_record_models]

        except SQLAlchemyError as e:
            raise Exception(
                f"Failed to get product records by quality classification: {str(e)}"
            )

    async def get_by_quality_classification_with_names(
        self, quality_classification: QualityClassification
    ) -> List[Tuple[ProductRecord, Optional[str], Optional[str]]]:
        """Get product records by quality classification with supplier and warehouse names"""
        try:
            result = await self.session.execute(
                select(
                    ProductRecordModel,
                    UserModel.Name.label("supplier_name"),
                    WarehouseModel.Name.label("warehouse_name"),
                )
                .outerjoin(UserModel, ProductRecordModel.SupplierID == UserModel.UserID)
                .outerjoin(
                    WarehouseModel,
                    ProductRecordModel.WarehouseID == WarehouseModel.WarehouseID,
                )
                .where(
                    ProductRecordModel.QualityClassification
                    == quality_classification.value
                )
            )
            rows = result.all()

            return [
                (
                    self._model_to_entity(row.ProductRecordModel),
                    row.supplier_name,
                    row.warehouse_name,
                )
                for row in rows
            ]

        except SQLAlchemyError as e:
            raise Exception(
                f"Failed to get product records by quality classification with names: {str(e)}"
            )

    async def update(
        self, record_id: int, update_data: dict
    ) -> Optional[ProductRecord]:
        """Update product record by ID"""
        try:
            # Remove None values from update data
            update_data_filtered = {
                k: v for k, v in update_data.items() if v is not None
            }

            if not update_data_filtered:
                return await self.get_by_id(record_id)

            # Execute update
            await self.session.execute(
                update(ProductRecordModel)
                .where(ProductRecordModel.RecordID == record_id)
                .values(**update_data_filtered)
            )

            # Return updated product record
            return await self.get_by_id(record_id)

        except SQLAlchemyError as e:
            await self.session.rollback()
            raise Exception(f"Failed to update product record: {str(e)}")

    async def delete(self, record_id: int) -> bool:
        """Delete product record by ID"""
        try:
            result = await self.session.execute(
                select(ProductRecordModel).where(
                    ProductRecordModel.RecordID == record_id
                )
            )
            product_record_model = result.scalar_one_or_none()

            if not product_record_model:
                return False

            await self.session.delete(product_record_model)
            await self.session.flush()

            return True

        except SQLAlchemyError as e:
            await self.session.rollback()
            raise Exception(f"Failed to delete product record: {str(e)}")

    async def get_available_stock_with_products(
        self,
    ) -> List[Tuple[ProductRecordModel, ProductModel]]:
        """Get all available stock records with product details"""
        try:
            result = await self.session.execute(
                select(ProductRecordModel, ProductModel)
                .join(
                    ProductModel, ProductRecordModel.ProductID == ProductModel.ProductID
                )
                .where(ProductRecordModel.Status == ProductRecordStatus.IN_STOCK.value)
                .order_by(ProductModel.Name, ProductRecordModel.RegistrationDate)
            )
            return result.all()

        except SQLAlchemyError as e:
            raise Exception(f"Failed to get available stock with products: {str(e)}")

    async def get_available_stock_summary(self) -> List[dict]:
        """Get available stock summary grouped by product"""
        try:
            result = await self.session.execute(
                select(
                    ProductModel.ProductID,
                    ProductModel.Name,
                    ProductModel.BasePrice,
                    ProductModel.DiscountPercentage,
                    ProductModel.RequiresRefrigeration,
                    ProductModel.ShelfLifeDays,
                    ProductModel.DeadlineToDiscount,
                    func.sum(ProductRecordModel.QuantityKg).label("total_quantity_kg"),
                    func.count(ProductRecordModel.RecordID).label("total_records"),
                    func.array_agg(ProductRecordModel.WarehouseID).label("warehouses"),
                )
                .join(
                    ProductModel, ProductRecordModel.ProductID == ProductModel.ProductID
                )
                .where(ProductRecordModel.Status == ProductRecordStatus.IN_STOCK.value)
                .group_by(
                    ProductModel.ProductID,
                    ProductModel.Name,
                    ProductModel.BasePrice,
                    ProductModel.DiscountPercentage,
                    ProductModel.RequiresRefrigeration,
                    ProductModel.ShelfLifeDays,
                    ProductModel.DeadlineToDiscount,
                )
                .order_by(ProductModel.Name)
            )

            rows = result.all()
            return [
                {
                    "product_id": row.ProductID,
                    "product_name": row.Name,
                    "base_price": row.BasePrice,
                    "discount_percentage": row.DiscountPercentage,
                    "requires_refrigeration": row.RequiresRefrigeration,
                    "shelf_life_days": row.ShelfLifeDays,
                    "deadline_to_discount": row.DeadlineToDiscount,
                    "total_quantity_kg": int(row.total_quantity_kg)
                    if row.total_quantity_kg
                    else 0,
                    "total_records": row.total_records,
                    "warehouses": [w for w in row.warehouses if w is not None]
                    if row.warehouses
                    else [],
                }
                for row in rows
            ]

        except SQLAlchemyError as e:
            raise Exception(f"Failed to get available stock summary: {str(e)}")

    async def get_product_metrics(self, product_id: int) -> dict:
        """Get comprehensive metrics for a specific product"""
        try:
            # Get all records for this product
            result = await self.session.execute(
                select(
                    ProductRecordModel.Status,
                    ProductRecordModel.QualityClassification,
                    ProductRecordModel.QuantityKg,
                    ProductRecordModel.RegistrationDate,
                    ProductRecordModel.SaleDate,
                    ProductModel.BasePrice,
                    ProductModel.DiscountPercentage,
                )
                .join(
                    ProductModel, ProductRecordModel.ProductID == ProductModel.ProductID
                )
                .where(ProductRecordModel.ProductID == product_id)
            )

            records = result.all()

            if not records:
                return {
                    "total_in_stock_kg": 0,
                    "total_sold_kg": 0,
                    "total_discarded_kg": 0,
                    "total_donated_kg": 0,
                    "total_records": 0,
                    "total_profit": 0,
                    "average_days_to_sell": 0,
                    "quality_distribution": {"Good": 0, "Sub-optimal": 0, "Bad": 0},
                    "revenue_by_status": {
                        "InStock": 0,
                        "Sold": 0,
                        "Discarded": 0,
                        "Donated": 0,
                    },
                    "inventory_turnover_rate": 0,
                    "loss_percentage": 0,
                    "base_price": 0,
                    "discount_percentage": 0,
                }

            # Initialize metrics
            total_in_stock_kg = 0
            total_sold_kg = 0
            total_discarded_kg = 0
            total_donated_kg = 0
            total_profit = 0
            quality_distribution = {"Good": 0, "Sub-optimal": 0, "Bad": 0}
            revenue_by_status = {"InStock": 0, "Sold": 0, "Discarded": 0, "Donated": 0}
            days_to_sell = []
            base_price = records[0].BasePrice or 0
            discount_percentage = records[0].DiscountPercentage or 0

            # Calculate metrics from records
            for record in records:
                quantity = record.QuantityKg or 0
                price = base_price

                if record.Status == ProductRecordStatus.IN_STOCK.value:
                    total_in_stock_kg += quantity
                    revenue_by_status["InStock"] += quantity * price
                elif record.Status == ProductRecordStatus.SOLD.value:
                    total_sold_kg += quantity
                    # Apply discount if applicable
                    if discount_percentage > 0:
                        price = base_price * (1 - discount_percentage / 100)
                    revenue_by_status["Sold"] += quantity * price
                    total_profit += quantity * price

                    # Calculate days to sell
                    if record.RegistrationDate and record.SaleDate:
                        days = (record.SaleDate - record.RegistrationDate).days
                        if days >= 0:
                            days_to_sell.append(days)
                elif record.Status == ProductRecordStatus.DISCARDED.value:
                    total_discarded_kg += quantity
                    revenue_by_status["Discarded"] += (
                        0  # No revenue from discarded items
                    )
                elif record.Status == ProductRecordStatus.DONATED.value:
                    total_donated_kg += quantity
                    revenue_by_status["Donated"] += 0  # No revenue from donated items

                # Quality distribution
                quality = record.QualityClassification
                if quality in quality_distribution:
                    quality_distribution[quality] += quantity

            total_quantity = (
                total_in_stock_kg
                + total_sold_kg
                + total_discarded_kg
                + total_donated_kg
            )
            average_days_to_sell = (
                sum(days_to_sell) / len(days_to_sell) if days_to_sell else 0
            )

            # Calculate inventory turnover rate (sold / (sold + in_stock))
            inventory_turnover_rate = 0
            if total_sold_kg + total_in_stock_kg > 0:
                inventory_turnover_rate = (
                    total_sold_kg / (total_sold_kg + total_in_stock_kg)
                ) * 100

            # Calculate loss percentage (discarded / total)
            loss_percentage = 0
            if total_quantity > 0:
                loss_percentage = (total_discarded_kg / total_quantity) * 100

            return {
                "total_in_stock_kg": total_in_stock_kg,
                "total_sold_kg": total_sold_kg,
                "total_discarded_kg": total_discarded_kg,
                "total_donated_kg": total_donated_kg,
                "total_records": len(records),
                "total_profit": round(total_profit, 2),
                "average_days_to_sell": round(average_days_to_sell, 1),
                "quality_distribution": quality_distribution,
                "revenue_by_status": {
                    k: round(v, 2) for k, v in revenue_by_status.items()
                },
                "inventory_turnover_rate": round(inventory_turnover_rate, 1),
                "loss_percentage": round(loss_percentage, 1),
                "base_price": base_price,
                "discount_percentage": discount_percentage,
            }

        except SQLAlchemyError as e:
            raise Exception(f"Failed to get product metrics: {str(e)}")

    async def get_supplier_statistics(self, supplier_id: int) -> dict:
        """Get comprehensive statistics for a specific supplier"""
        try:
            # Get all records for this supplier
            result = await self.session.execute(
                select(
                    ProductRecordModel.Status,
                    ProductRecordModel.QualityClassification,
                    ProductRecordModel.QuantityKg,
                    ProductRecordModel.RegistrationDate,
                    ProductRecordModel.SaleDate,
                    ProductModel.BasePrice,
                    ProductModel.DiscountPercentage,
                    ProductModel.Name.label("product_name"),
                )
                .join(
                    ProductModel, ProductRecordModel.ProductID == ProductModel.ProductID
                )
                .where(ProductRecordModel.SupplierID == supplier_id)
            )

            records = result.all()

            if not records:
                return {
                    "total_products_registered": 0,
                    "total_quantity_kg": 0,
                    "total_records": 0,
                    "quality_distribution": {"Good": 0, "Sub-optimal": 0, "Bad": 0},
                    "quality_percentages": {"Good": 0, "Sub-optimal": 0, "Bad": 0},
                    "status_distribution": {
                        "InStock": 0,
                        "Sold": 0,
                        "Discarded": 0,
                        "Donated": 0,
                    },
                    "status_percentages": {
                        "InStock": 0,
                        "Sold": 0,
                        "Discarded": 0,
                        "Donated": 0,
                    },
                    "average_quality_score": 0,
                    "total_revenue_generated": 0,
                    "average_days_to_sell": 0,
                    "performance_rating": "No Data",
                    "products_list": [],
                }

            # Initialize metrics
            total_quantity_kg = 0
            quality_distribution = {"Good": 0, "Sub-optimal": 0, "Bad": 0}
            status_distribution = {
                "InStock": 0,
                "Sold": 0,
                "Discarded": 0,
                "Donated": 0,
            }
            total_revenue = 0
            days_to_sell = []
            products_set = set()

            # Calculate metrics from records
            for record in records:
                quantity = record.QuantityKg or 0
                total_quantity_kg += quantity
                products_set.add(record.product_name)

                # Quality distribution
                quality = record.QualityClassification
                if quality in quality_distribution:
                    quality_distribution[quality] += quantity

                # Status distribution
                status = record.Status
                if status in status_distribution:
                    status_distribution[status] += quantity

                # Revenue calculation
                if status == ProductRecordStatus.SOLD.value:
                    base_price = record.BasePrice or 0
                    discount = record.DiscountPercentage or 0
                    final_price = base_price * (1 - discount / 100)
                    total_revenue += quantity * final_price

                    # Days to sell calculation
                    if record.RegistrationDate and record.SaleDate:
                        days = (record.SaleDate - record.RegistrationDate).days
                        if days >= 0:
                            days_to_sell.append(days)

            # Calculate percentages
            quality_percentages = {}
            status_percentages = {}

            if total_quantity_kg > 0:
                for quality, qty in quality_distribution.items():
                    quality_percentages[quality] = round(
                        (qty / total_quantity_kg) * 100, 1
                    )
                for status, qty in status_distribution.items():
                    status_percentages[status] = round(
                        (qty / total_quantity_kg) * 100, 1
                    )
            else:
                quality_percentages = {"Good": 0, "Sub-optimal": 0, "Bad": 0}
                status_percentages = {
                    "InStock": 0,
                    "Sold": 0,
                    "Discarded": 0,
                    "Donated": 0,
                }

            # Calculate average quality score (Good=3, Sub-optimal=2, Bad=1)
            quality_scores = {"Good": 3, "Sub-optimal": 2, "Bad": 1}
            weighted_score = sum(
                quality_distribution[q] * quality_scores[q]
                for q in quality_distribution
            )
            average_quality_score = (
                weighted_score / total_quantity_kg if total_quantity_kg > 0 else 0
            )

            # Calculate average days to sell
            avg_days_to_sell = (
                sum(days_to_sell) / len(days_to_sell) if days_to_sell else 0
            )

            # Performance rating based on quality score and sell rate
            sell_rate = status_percentages["Sold"]
            good_rate = quality_percentages["Good"]

            if good_rate >= 80 and sell_rate >= 70:
                performance_rating = "Excellent"
            elif good_rate >= 60 and sell_rate >= 50:
                performance_rating = "Good"
            elif good_rate >= 40 and sell_rate >= 30:
                performance_rating = "Average"
            elif good_rate >= 20 or sell_rate >= 20:
                performance_rating = "Below Average"
            else:
                performance_rating = "Poor"

            return {
                "total_products_registered": len(products_set),
                "total_quantity_kg": total_quantity_kg,
                "total_records": len(records),
                "quality_distribution": quality_distribution,
                "quality_percentages": quality_percentages,
                "status_distribution": status_distribution,
                "status_percentages": status_percentages,
                "average_quality_score": round(average_quality_score, 2),
                "total_revenue_generated": round(total_revenue, 2),
                "average_days_to_sell": round(avg_days_to_sell, 1),
                "performance_rating": performance_rating,
                "products_list": list(products_set),
            }

        except SQLAlchemyError as e:
            raise Exception(f"Failed to get supplier statistics: {str(e)}")

    def _model_to_entity(
        self, product_record_model: ProductRecordModel
    ) -> ProductRecord:
        """Convert SQLAlchemy model to domain entity"""
        return ProductRecord(
            record_id=product_record_model.RecordID,
            product_id=product_record_model.ProductID,
            supplier_id=product_record_model.SupplierID,
            warehouse_id=product_record_model.WarehouseID,
            quantity_kg=product_record_model.QuantityKg,
            quality_classification=QualityClassification(
                product_record_model.QualityClassification
            )
            if product_record_model.QualityClassification
            else None,
            status=ProductRecordStatus(product_record_model.Status),
            image_path=product_record_model.ImagePath,
            registration_date=product_record_model.RegistrationDate,
            sale_date=product_record_model.SaleDate,
        )
