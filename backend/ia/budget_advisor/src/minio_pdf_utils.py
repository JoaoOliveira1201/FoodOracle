import tempfile
import os
from PyPDF2 import PdfReader
from minio import Minio
from typing import Optional

# MinIO configuration using environment variables from docker compose.yml
MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "localhost:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin")
MINIO_SECURE = os.getenv("MINIO_SECURE", "false").lower() == "true"
QUOTES_BUCKET = os.getenv("MINIO_QUOTES_BUCKET_NAME", "quotes")


def get_minio_client() -> Minio:
    """Create and return MinIO client"""
    return Minio(
        MINIO_ENDPOINT,
        access_key=MINIO_ACCESS_KEY,
        secret_key=MINIO_SECRET_KEY,
        secure=MINIO_SECURE,
    )


def download_pdf_from_minio(pdf_path: str) -> Optional[str]:
    """
    Download PDF from MinIO and return the content as text
    Returns None if the file doesn't exist or can't be processed
    """
    if not pdf_path:
        return None

    try:
        client = get_minio_client()

        # Create a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
            # Download the PDF to temporary file
            client.fget_object(QUOTES_BUCKET, pdf_path, tmp_file.name)

            # Extract text from PDF
            text_content = extract_text_from_pdf(tmp_file.name)

            # Clean up temporary file
            os.unlink(tmp_file.name)

            return text_content

    except Exception as e:
        print(f"Error downloading/processing PDF from MinIO: {pdf_path}, Error: {e}")
        return None


def extract_text_from_pdf(file_path: str) -> str:
    """Extract text content from PDF file"""
    try:
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text.strip()
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
        return ""


def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 100) -> list:
    """Break text into smaller chunks for better processing"""
    if not text:
        return []

    words = text.split()
    chunks = []

    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i : i + chunk_size])
        if chunk.strip():  # Only add non-empty chunks
            chunks.append(chunk)

    return chunks
