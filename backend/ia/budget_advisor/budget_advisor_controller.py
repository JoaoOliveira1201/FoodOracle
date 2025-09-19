from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db_session
from src.quote.quote_repository import QuoteRepository
from src.product.product_repository import ProductRepository
from src.product_record.product_record_repository import ProductRecordRepository
from .src.bedrock import ask_question_bedrock_with_data
from .src.minio_pdf_utils import download_pdf_from_minio, chunk_text

router = APIRouter(prefix="/budget-advisor", tags=["Budget Advisor"])


class Question(BaseModel):
    product_id: int
    query: str


# Chat history storage (in production, consider using Redis or database)
chat_history: List[Dict[str, str]] = []


async def get_product_data(product_id: int, db: AsyncSession) -> Dict[str, Any]:
    """Fetch comprehensive product data from all relevant tables"""

    # Initialize repositories
    quote_repo = QuoteRepository(db)
    product_repo = ProductRepository(db)
    product_record_repo = ProductRecordRepository(db)

    # Fetch product information
    product = await product_repo.get_by_id(product_id)
    if not product:
        raise HTTPException(
            status_code=404, detail=f"Product with ID {product_id} not found"
        )

    # Fetch pending quotes for this product with supplier names
    quotes_with_supplier_names = (
        await quote_repo.get_pending_by_product_id_with_supplier_names(product_id)
    )

    # Fetch product records (history) for this product
    product_records = await product_record_repo.get_by_product_id(product_id)

    return {
        "product": product,
        "quotes_with_supplier_names": quotes_with_supplier_names,
        "product_records": product_records,
    }


def format_product_context(product_data: Dict[str, Any]) -> str:
    """Format product data into a readable context for budget decision making"""
    product = product_data["product"]
    quotes_with_supplier_names = product_data["quotes_with_supplier_names"]
    product_records = product_data["product_records"]

    context = f"""
=== PRODUCT INFORMATION ===
Product ID: {product.product_id}
Name: {product.name}
Base Price: ${product.base_price / 100:.2f} (stored as cents)
Discount Percentage: {product.discount_percentage}%
Requires Refrigeration: {"Yes" if product.requires_refrigeration else "No"}
Shelf Life: {product.shelf_life_days} days
Deadline to Discount: {product.deadline_to_discount} days

=== INVENTORY SUMMARY ==="""

    # Simplified product record counts
    in_stock_records = [r for r in product_records if r.status.value == "InStock"]
    sold_records = [r for r in product_records if r.status.value == "Sold"]
    discarded_records = [r for r in product_records if r.status.value == "Discarded"]
    donated_records = [r for r in product_records if r.status.value == "Donated"]

    total_in_stock = sum(r.quantity_kg or 0 for r in in_stock_records)
    total_sold = sum(r.quantity_kg or 0 for r in sold_records)
    total_discarded = sum(r.quantity_kg or 0 for r in discarded_records)
    total_donated = sum(r.quantity_kg or 0 for r in donated_records)

    context += f"""
In Stock: {len(in_stock_records)} records ({total_in_stock} kg total)
Sold: {len(sold_records)} records ({total_sold} kg total)  
Discarded: {len(discarded_records)} records ({total_discarded} kg total)
Donated: {len(donated_records)} records ({total_donated} kg total)

=== PENDING SUPPLIER QUOTES & BUDGET INFORMATION ==="""

    if not quotes_with_supplier_names:
        context += "\nNo pending quotes available for this product."
    else:
        context += (
            f"\nTotal Pending Quotes Available: {len(quotes_with_supplier_names)}"
        )

        for i, (quote, supplier_name) in enumerate(quotes_with_supplier_names, 1):
            context += f"""

--- Quote {i} ---
Quote ID: {quote.quote_id}
Supplier ID: {quote.supplier_id}
Supplier Name: {supplier_name or "Unknown Supplier"}
Status: {quote.status.value}
Submission Date: {quote.submission_date}"""

            # Download and process PDF content if available
            if quote.pdf_document_path:
                context += f"\nPDF Document: {quote.pdf_document_path}"

                pdf_content = download_pdf_from_minio(quote.pdf_document_path)
                if pdf_content:
                    # Chunk the content to avoid overwhelming the context
                    chunks = chunk_text(pdf_content, chunk_size=500, overlap=50)
                    # Take first few chunks to keep context manageable
                    relevant_chunks = chunks[:3] if len(chunks) > 3 else chunks

                    context += "\n\nPDF Content:"
                    for j, chunk in enumerate(relevant_chunks, 1):
                        context += f"\n--- PDF Section {j} ---\n{chunk}"
                else:
                    context += "\nPDF Content: Could not extract content from PDF"
            else:
                context += "\nPDF Document: Not available"

    return context


@router.post("/ask")
async def ask_budget_question(
    question: Question, db: AsyncSession = Depends(get_db_session)
):
    """Ask a question about a specific product's budget and supply chain data"""
    global chat_history

    try:
        # Fetch comprehensive product data
        product_data = await get_product_data(question.product_id, db)

        # Format the data into context
        context = format_product_context(product_data)

        # Add user question to chat history
        chat_history.append({"role": "user", "content": question.query})

        # Get AI response with the product data as context
        answer = ask_question_bedrock_with_data(question.query, context, chat_history)

        # Add AI response to chat history
        chat_history.append({"role": "assistant", "content": answer})

        return {
            "product_id": question.product_id,
            "query": question.query,
            "answer": answer,
            "product_summary": {
                "name": product_data["product"].name,
                "quotes_count": len(product_data["quotes_with_supplier_names"]),
                "records_count": len(product_data["product_records"]),
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error processing question: {str(e)}"
        )


@router.post("/clear-history")
def clear_history():
    """Clear the chat history"""
    global chat_history
    chat_history = []
    return {"message": "Chat history cleared."}


@router.get("/status")
def get_status():
    """Get the status of the budget advisor"""
    return {
        "status": "active",
        "chat_history_length": len(chat_history),
        "description": "Budget advisor integrated with supply chain data",
    }
