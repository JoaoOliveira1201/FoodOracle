from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.user.user_controller import router as user_router
from src.truck.truck_controller import router as truck_router
from src.warehouse.warehouse_controller import router as warehouse_router
from src.product.product_controller import router as product_router
from src.product_record.product_record_controller import router as product_record_router
from src.order.order_controller import router as order_router
from src.order_item.order_item_controller import router as order_item_router
from src.trip.trip_controller import router as trip_router
from src.warehouse_transfer.warehouse_transfer_controller import (
    router as warehouse_transfer_router,
)
from src.quote.quote_controller import router as quote_router
from ia.budget_advisor.budget_advisor_controller import router as budget_advisor_router
from ia.quality_control.quality_control_controller import (
    router as quality_control_router,
)
from ia.client_advisor.client_advisor_controller import router as client_advisor_router
from ia.transfer_suggestions.transfer_suggestions_controller import (
    router as transfer_suggestions_router,
)
from ia.seasonal_suggestions.seasonal_suggestions_controller import (
    router as seasonal_suggestions_router,
)
from ia.donation_suggestions.donation_suggestions_controller import (
    router as donation_suggestions_router,
)
from src.analytics.analytics_controller import router as analytics_router

app = FastAPI(title="Supply Chain Management API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Backend routers
app.include_router(user_router)
app.include_router(truck_router)
app.include_router(warehouse_router)
app.include_router(product_router)
app.include_router(product_record_router)
app.include_router(order_router)
app.include_router(order_item_router)
app.include_router(trip_router)
app.include_router(warehouse_transfer_router)
app.include_router(quote_router)

# IA routers
app.include_router(budget_advisor_router)
app.include_router(quality_control_router)
app.include_router(client_advisor_router)
app.include_router(transfer_suggestions_router)
app.include_router(seasonal_suggestions_router)
app.include_router(donation_suggestions_router)
app.include_router(analytics_router)


@app.get("/")
async def root():
    return {"message": "Supply Chain Management API is running"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
