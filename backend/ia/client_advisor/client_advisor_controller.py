from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db_session
from src.user.user_repository import UserRepository
from src.product.product_repository import ProductRepository
from src.order.order_repository import OrderRepository
from src.order_item.order_item_repository import OrderItemRepository
from src.warehouse.warehouse_repository import WarehouseRepository
from src.product_record.product_record_repository import ProductRecordRepository
from src.product_record.use_cases.get_buyer_stock_use_case import GetBuyerStockUseCase
from .src.bedrock import ask_client_advisor

router = APIRouter(prefix="/client-advisor", tags=["Client Advisor"])


class Question(BaseModel):
    query: str


class ProductQuestion(BaseModel):
    product_id: int
    query: str


# Per-user chat history storage (in production, consider using Redis or database)
user_chat_histories: Dict[int, List[Dict[str, str]]] = {}


def get_user_chat_history(user_id: int) -> List[Dict[str, str]]:
    """Get chat history for a specific user"""
    if user_id not in user_chat_histories:
        user_chat_histories[user_id] = []
    return user_chat_histories[user_id]


def add_to_user_chat_history(user_id: int, role: str, content: str):
    """Add a message to user's chat history"""
    if user_id not in user_chat_histories:
        user_chat_histories[user_id] = []
    user_chat_histories[user_id].append({"role": role, "content": content})


def clear_user_chat_history(user_id: int):
    """Clear chat history for a specific user"""
    if user_id in user_chat_histories:
        user_chat_histories[user_id] = []


async def get_user_data(user_id: int, db: AsyncSession) -> Dict[str, Any]:
    """Fetch comprehensive user data for client advisory"""

    # Initialize repositories
    user_repo = UserRepository(db)
    order_repo = OrderRepository(db)
    warehouse_repo = WarehouseRepository(db)
    product_record_repo = ProductRecordRepository(db)
    order_item_repo = OrderItemRepository(db)
    product_repo = ProductRepository(db)

    # Fetch user information
    user = await user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail=f"User with ID {user_id} not found")

    # Check if user is a buyer
    if user.role.value != "Buyer":
        raise HTTPException(
            status_code=400, detail=f"User with ID {user_id} is not a buyer"
        )

    # Fetch user's orders
    orders = await order_repo.get_by_buyer_id(user_id)

    # Fetch order items and product names for recent completed orders
    order_products = {}
    if orders:
        recent_completed = sorted(
            [o for o in orders if o.status.value == "Completed"],
            key=lambda x: x.order_date or "",
            reverse=True,
        )[:3]

        for order in recent_completed:
            order_items = await order_item_repo.get_by_order_id(order.order_id)
            products_in_order = []

            for item in order_items:
                if item.record_id:
                    # Get the product record to find the product
                    product_record = await product_record_repo.get_by_id(item.record_id)
                    if product_record and product_record.product_id:
                        product = await product_repo.get_by_id(
                            product_record.product_id
                        )
                        if product:
                            products_in_order.append(
                                {
                                    "name": product.name,
                                    "quantity_kg": product_record.quantity_kg,
                                    "price_paid": item.price_at_purchase,
                                }
                            )

            order_products[order.order_id] = products_in_order

    # Fetch available items for buyers
    buyer_stock_use_case = GetBuyerStockUseCase(product_record_repo)
    available_items_data = await buyer_stock_use_case.execute()

    # Fetch nearby warehouses if user has location
    warehouses = []
    warehouse_info = {}
    if user.location:
        all_warehouses = await warehouse_repo.get_all()
        for w in all_warehouses:
            distance_km = user.location.distance_to(w.location)
            warehouse_data = {
                "warehouse_id": w.warehouse_id,
                "name": w.name,
                "location": w.location,
                "distance_km": distance_km,
                "normal_capacity_kg": w.normal_capacity_kg,
                "refrigerated_capacity_kg": w.refrigerated_capacity_kg,
            }
            warehouses.append(warehouse_data)
            warehouse_info[w.warehouse_id] = warehouse_data

        # Sort by distance
        warehouses.sort(key=lambda x: x["distance_km"])

    return {
        "user": user,
        "orders": orders,
        "order_products": order_products,
        "warehouses": warehouses,
        "warehouse_info": warehouse_info,
        "available_items": available_items_data,
    }


async def get_user_and_product_data(
    user_id: int, product_id: int, db: AsyncSession
) -> Dict[str, Any]:
    """Fetch user data and specific product information"""

    # Get user data first
    user_data = await get_user_data(user_id, db)

    # Get product information
    product_repo = ProductRepository(db)
    product = await product_repo.get_by_id(product_id)
    if not product:
        raise HTTPException(
            status_code=404, detail=f"Product with ID {product_id} not found"
        )

    user_data["product"] = product
    return user_data


def format_user_context(user_data: Dict[str, Any]) -> str:
    """Format user data into a readable context for the AI"""
    user = user_data["user"]
    orders = user_data["orders"]
    order_products = user_data.get("order_products", {})
    warehouses = user_data.get("warehouses", [])
    warehouse_info = user_data.get("warehouse_info", {})
    available_items = user_data.get("available_items")

    context = f"""Customer: {user.name}"""

    # Add warehouse distance information if available
    if warehouses:
        context += f"\n\nNearby warehouses:"
        # Show top 3 closest warehouses
        for warehouse in warehouses[:3]:
            context += f"""
- {warehouse.get("name", "Warehouse")} ({warehouse["distance_km"]:.1f}km away)"""

    # Add available items information
    if available_items:
        context += f"\n\nWhat's available ({available_items.total_items} items total):"

        # Show top 6 available items with concise info
        for item in available_items.available_items[:6]:
            warehouse_details = ""
            if item.warehouse_id and item.warehouse_id in warehouse_info:
                wh = warehouse_info[item.warehouse_id]
                warehouse_details = (
                    f" at {wh.get('name', 'warehouse')} ({wh['distance_km']:.1f}km)"
                )

            price_info = ""
            if item.current_price:
                if item.is_discounted and item.original_price:
                    price_info = f"${item.current_price / 100:.2f} (was ${item.original_price / 100:.2f}) 🏷️"
                else:
                    price_info = f"${item.current_price / 100:.2f}"

            freshness_info = ""
            if item.days_until_expiry is not None and item.days_until_expiry <= 7:
                freshness_info = f" - expires in {item.days_until_expiry} days"

            context += f"""
- {item.product_name}: {price_info}, {item.quantity_kg}kg available{warehouse_details}{freshness_info}"""

    # Add actual purchase history with products
    if orders:
        # Get recent completed orders to understand product preferences
        recent_orders = sorted(
            [o for o in orders if o.status.value == "Completed"],
            key=lambda x: x.order_date or "",
            reverse=True,
        )[:3]

        if recent_orders and order_products:
            context += "\n\nRecent purchases:"
            for order in recent_orders:
                products_in_order = order_products.get(order.order_id, [])
                if products_in_order:
                    product_names = [p["name"] for p in products_in_order]
                    context += f"\n- {order.order_date}: {', '.join(product_names)} (${(order.total_amount or 0) / 100:.2f})"
                else:
                    context += f"\n- {order.order_date}: ${(order.total_amount or 0) / 100:.2f}"

    else:
        context += "\n\nFirst-time customer"

    return context


def format_user_product_context(user_data: Dict[str, Any]) -> str:
    """Format user and product data into context for product-specific advice"""
    base_context = format_user_context(user_data)
    product = user_data["product"]

    product_context = f"""

Asking about: {product.name} (ID: {product.product_id})
Base price: ${product.base_price / 100:.2f}
{"❄️ Needs refrigeration" if product.requires_refrigeration else "🌡️ Room temperature storage"}
Shelf life: {product.shelf_life_days} days"""

    return base_context + product_context


@router.post("/ask")
async def ask_client_question(
    question: Question, user_id: int, db: AsyncSession = Depends(get_db_session)
):
    """Ask a general question for a specific buyer (user_id only)"""
    try:
        # Fetch user data
        user_data = await get_user_data(user_id, db)

        # Format the data into context
        context = format_user_context(user_data)

        # Get user's chat history
        user_history = get_user_chat_history(user_id)

        # Add user question to chat history
        add_to_user_chat_history(user_id, "user", question.query)

        # Get AI response with the user data as context
        answer = ask_client_advisor(question.query, context, user_history)

        # Add AI response to chat history
        add_to_user_chat_history(user_id, "assistant", answer)

        return {
            "user_id": user_id,
            "query": question.query,
            "answer": answer,
            "user_summary": {
                "name": user_data["user"].name,
                "total_orders": len(user_data["orders"]),
            },
            "chat_history_length": len(get_user_chat_history(user_id)),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error processing question: {str(e)}"
        )


@router.post("/ask-product")
async def ask_product_question(
    question: ProductQuestion, user_id: int, db: AsyncSession = Depends(get_db_session)
):
    """Ask a question about a specific product for a specific buyer (user_id and product_id)"""
    try:
        # Fetch user and product data
        user_data = await get_user_and_product_data(user_id, question.product_id, db)

        # Format the data into context
        context = format_user_product_context(user_data)

        # Get user's chat history
        user_history = get_user_chat_history(user_id)

        # Add user question to chat history
        add_to_user_chat_history(user_id, "user", question.query)

        # Get AI response with the user and product data as context
        answer = ask_client_advisor(question.query, context, user_history)

        # Add AI response to chat history
        add_to_user_chat_history(user_id, "assistant", answer)

        return {
            "user_id": user_id,
            "product_id": question.product_id,
            "query": question.query,
            "answer": answer,
            "user_summary": {
                "name": user_data["user"].name,
                "total_orders": len(user_data["orders"]),
            },
            "product_summary": {
                "name": user_data["product"].name,
                "price": user_data["product"].base_price,
            },
            "chat_history_length": len(get_user_chat_history(user_id)),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error processing question: {str(e)}"
        )


@router.post("/clear-history")
def clear_history(user_id: int):
    """Clear the chat history for a specific user"""
    clear_user_chat_history(user_id)
    return {"message": f"Chat history cleared for user {user_id}."}


@router.get("/chat-history/{user_id}")
def get_user_history(user_id: int):
    """Get the chat history for a specific user"""
    history = get_user_chat_history(user_id)
    return {
        "user_id": user_id,
        "chat_history": history,
        "chat_history_length": len(history),
    }


@router.get("/status")
def get_status():
    """Get the status of the client advisor"""
    total_users_with_history = len(user_chat_histories)
    total_messages = sum(len(history) for history in user_chat_histories.values())

    return {
        "status": "active",
        "total_users_with_chat_history": total_users_with_history,
        "total_messages_across_all_users": total_messages,
        "description": "AI-powered client advisor for personalized buyer recommendations with per-user chat history",
    }
