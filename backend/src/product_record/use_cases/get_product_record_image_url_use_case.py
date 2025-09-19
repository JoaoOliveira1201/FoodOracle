from typing import Optional
from datetime import timedelta
from src.product_record.product_record_repository import ProductRecordRepository
from src.base.minio_service import MinioService


class GetProductRecordImageUrlUseCase:
    def __init__(
        self,
        product_record_repository: ProductRecordRepository,
        minio_service: MinioService,
    ):
        self._product_record_repository = product_record_repository
        self._minio_service = minio_service

    async def execute(self, record_id: int, expires_hours: int = 24) -> Optional[str]:
        """Get a presigned URL for the product record image"""
        product_record = await self._product_record_repository.get_by_id(record_id)
        if not product_record or not product_record.image_path:
            return None

        # Check if image exists in Minio
        if not self._minio_service.file_exists(product_record.image_path):
            return None

        # Get presigned URL
        expires = timedelta(hours=expires_hours)
        return self._minio_service.get_file_url(product_record.image_path, expires)
