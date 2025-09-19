import os
import uuid
from typing import Optional, List
from minio import Minio
from minio.error import S3Error
from fastapi import UploadFile
from datetime import timedelta
from enum import Enum


class FileType(str, Enum):
    IMAGE = "image"
    PDF = "pdf"
    ANY = "any"


class MinioService:
    def __init__(self, bucket_name: str):
        self.client = Minio(
            os.getenv("MINIO_ENDPOINT", "localhost:9000"),
            access_key=os.getenv("MINIO_ACCESS_KEY", "minioadmin"),
            secret_key=os.getenv("MINIO_SECRET_KEY", "minioadmin"),
            secure=os.getenv("MINIO_SECURE", "False").lower() == "true",
        )
        self.bucket_name = bucket_name
        self._ensure_bucket_exists()

    def _ensure_bucket_exists(self):
        """Ensure the bucket exists, create if it doesn't"""
        try:
            if not self.client.bucket_exists(self.bucket_name):
                self.client.make_bucket(self.bucket_name)
                print(f"Created bucket: {self.bucket_name}")
        except S3Error as e:
            print(f"Error ensuring bucket exists: {e}")
            raise

    async def upload_file(
        self, file: UploadFile, identifier: str, file_type: FileType = FileType.ANY
    ) -> str:
        """Upload a file to Minio and return the file path"""
        try:
            # Validate file type if specified
            if file_type != FileType.ANY and not self._is_valid_file_type(
                file, file_type
            ):
                allowed_types = self._get_allowed_content_types(file_type)
                raise ValueError(
                    f"Invalid file type. Allowed types for {file_type.value}: {', '.join(allowed_types)}"
                )

            # Generate unique filename
            file_extension = (
                file.filename.split(".")[-1]
                if file.filename and "." in file.filename
                else self._get_default_extension(file_type)
            )
            unique_filename = f"{identifier}_{uuid.uuid4().hex}.{file_extension}"

            # Read file content
            file_content = await file.read()
            file_size = len(file_content)

            # Upload to Minio
            from io import BytesIO

            self.client.put_object(
                self.bucket_name,
                unique_filename,
                BytesIO(file_content),
                file_size,
                content_type=file.content_type
                or self._get_default_content_type(file_type),
            )

            return unique_filename

        except S3Error as e:
            raise Exception(f"Failed to upload file to Minio: {str(e)}")
        except Exception as e:
            raise Exception(f"Error uploading file: {str(e)}")

    def get_file_url(
        self, file_path: str, expires: timedelta = timedelta(hours=24)
    ) -> str:
        """Get a presigned URL for a file"""
        try:
            return self.client.presigned_get_object(
                self.bucket_name, file_path, expires=expires
            )
        except S3Error as e:
            raise Exception(f"Failed to get file URL: {str(e)}")

    def delete_file(self, file_path: str) -> bool:
        """Delete a file from Minio"""
        try:
            self.client.remove_object(self.bucket_name, file_path)
            return True
        except S3Error as e:
            print(f"Error deleting file {file_path}: {e}")
            return False

    def file_exists(self, file_path: str) -> bool:
        """Check if a file exists in Minio"""
        try:
            self.client.stat_object(self.bucket_name, file_path)
            return True
        except S3Error:
            return False

    def _is_valid_file_type(self, file: UploadFile, file_type: FileType) -> bool:
        """Check if the uploaded file matches the expected file type"""
        if not file.content_type:
            return False

        allowed_types = self._get_allowed_content_types(file_type)
        return file.content_type.lower() in allowed_types

    def _get_allowed_content_types(self, file_type: FileType) -> List[str]:
        """Get allowed content types for a file type"""
        if file_type == FileType.IMAGE:
            return ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
        elif file_type == FileType.PDF:
            return ["application/pdf"]
        else:  # FileType.ANY
            return []  # Allow any type

    def _get_default_extension(self, file_type: FileType) -> str:
        """Get default file extension for a file type"""
        if file_type == FileType.IMAGE:
            return "jpg"
        elif file_type == FileType.PDF:
            return "pdf"
        else:
            return "bin"

    def _get_default_content_type(self, file_type: FileType) -> str:
        """Get default content type for a file type"""
        if file_type == FileType.IMAGE:
            return "image/jpeg"
        elif file_type == FileType.PDF:
            return "application/pdf"
        else:
            return "application/octet-stream"


# Factory functions for common use cases
def get_quote_minio_service() -> MinioService:
    """Get MinioService instance for quotes"""
    return MinioService(os.getenv("MINIO_QUOTES_BUCKET_NAME", "quotes"))


def get_product_record_minio_service() -> MinioService:
    """Get MinioService instance for product records"""
    return MinioService(
        os.getenv("MINIO_PRODUCT_RECORDS_BUCKET_NAME", "product-records")
    )


def get_generic_minio_service(bucket_name: str) -> MinioService:
    """Get MinioService instance for any custom bucket"""
    return MinioService(bucket_name)
