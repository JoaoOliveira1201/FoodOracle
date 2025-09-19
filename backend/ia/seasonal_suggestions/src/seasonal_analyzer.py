from typing import Dict, Any, List
from datetime import datetime
from .config import PORTUGAL_SEASONAL_PATTERNS


def analyze_seasonal_data(
    inventory_data: Dict[str, Any], analysis_date: datetime
) -> Dict[str, Any]:
    """
    Analyze inventory data against seasonal patterns for Portugal
    """
    # Determine current season
    month = analysis_date.month
    season = get_season_from_month(month)
    seasonal_pattern = PORTUGAL_SEASONAL_PATTERNS[season]

    # Analyze current inventory against seasonal patterns
    inventory_analysis = analyze_inventory_against_season(
        seasonal_pattern, inventory_data
    )

    # Calculate seasonal trends
    trends = calculate_seasonal_trends(seasonal_pattern, inventory_data)

    # Generate inventory summary
    inventory_summary = generate_inventory_summary(inventory_data)

    return {
        "season": season,
        "seasonal_notes": seasonal_pattern["seasonal_notes"],
        "high_demand_foods": seasonal_pattern["characteristics"]["high_demand"],
        "moderate_demand_foods": seasonal_pattern["characteristics"]["moderate_demand"],
        "low_demand_foods": seasonal_pattern["characteristics"]["low_demand"],
        "inventory_analysis": inventory_analysis,
        "trends": trends,
        "inventory_summary": inventory_summary,
    }


def get_season_from_month(month: int) -> str:
    """Determine season based on month"""
    if month in [12, 1, 2]:
        return "winter"
    elif month in [3, 4, 5]:
        return "spring"
    elif month in [6, 7, 8]:
        return "summer"
    else:  # 9, 10, 11
        return "autumn"


def analyze_inventory_against_season(
    seasonal_pattern: Dict[str, Any], inventory_data: Dict[str, Any]
) -> Dict[str, Any]:
    """Analyze current inventory against seasonal demand patterns based on product characteristics"""

    analysis = {
        "well_positioned": [],  # Products that match seasonal demand
        "overstocked": [],  # Products with high stock but low seasonal demand
        "understocked": [],  # Products with low stock but high seasonal demand
        "seasonal_opportunities": [],  # Product types that should be added
        "waste_risks": [],  # Products at risk of waste due to seasonal mismatch
    }

    # Get seasonal characteristics
    high_demand_chars = seasonal_pattern["characteristics"]["high_demand"]
    moderate_demand_chars = seasonal_pattern["characteristics"]["moderate_demand"]
    low_demand_chars = seasonal_pattern["characteristics"]["low_demand"]

    for product in inventory_data["products"]:
        product_name_lower = product["name"].lower()
        current_stock = product["current_stock_kg"]
        turnover_rate = product["inventory_turnover_rate"]
        loss_percentage = product["loss_percentage"]

        # Analyze product characteristics against seasonal patterns
        seasonal_demand_level = analyze_product_seasonal_demand(
            product_name_lower,
            high_demand_chars,
            moderate_demand_chars,
            low_demand_chars,
        )

        # Categorize product based on seasonal demand and current stock
        if seasonal_demand_level == "high":
            if current_stock > 100:  # High stock threshold
                analysis["well_positioned"].append(
                    {
                        "product": product,
                        "reason": "High seasonal demand with adequate stock",
                        "recommendation": "maintain",
                    }
                )
            else:
                analysis["understocked"].append(
                    {
                        "product": product,
                        "reason": "High seasonal demand but low stock",
                        "recommendation": "increase",
                    }
                )
        elif seasonal_demand_level == "moderate":
            if current_stock > 50:  # Moderate stock threshold
                analysis["well_positioned"].append(
                    {
                        "product": product,
                        "reason": "Moderate seasonal demand with adequate stock",
                        "recommendation": "maintain",
                    }
                )
            else:
                analysis["understocked"].append(
                    {
                        "product": product,
                        "reason": "Moderate seasonal demand but low stock",
                        "recommendation": "increase",
                    }
                )
        elif seasonal_demand_level == "low":
            if current_stock > 20:  # Low stock threshold
                analysis["overstocked"].append(
                    {
                        "product": product,
                        "reason": "Low seasonal demand but high stock",
                        "recommendation": "reduce",
                    }
                )
            else:
                analysis["well_positioned"].append(
                    {
                        "product": product,
                        "reason": "Low seasonal demand with minimal stock",
                        "recommendation": "maintain",
                    }
                )

        # Check for waste risks
        if (
            loss_percentage > 15 and current_stock > 30
        ):  # High loss rate with significant stock
            analysis["waste_risks"].append(
                {
                    "product": product,
                    "reason": f"High waste rate ({loss_percentage:.1f}%) with significant stock",
                    "recommendation": "reduce_or_optimize",
                }
            )

    # Generate seasonal opportunities based on missing product types
    analysis["seasonal_opportunities"] = generate_seasonal_opportunities(
        inventory_data["products"], seasonal_pattern
    )

    return analysis


def analyze_product_seasonal_demand(
    product_name: str, high_chars: str, moderate_chars: str, low_chars: str
) -> str:
    """Analyze a product's seasonal demand level based on its name and seasonal characteristics"""

    # Convert characteristics to keywords for matching
    high_keywords = [word.strip() for word in high_chars.replace(",", " ").split()]
    moderate_keywords = [
        word.strip() for word in moderate_chars.replace(",", " ").split()
    ]
    low_keywords = [word.strip() for word in low_chars.replace(",", " ").split()]

    # Check for high demand characteristics
    high_matches = sum(1 for keyword in high_keywords if keyword in product_name)
    moderate_matches = sum(
        1 for keyword in moderate_keywords if keyword in product_name
    )
    low_matches = sum(1 for keyword in low_keywords if keyword in product_name)

    # Determine demand level based on matches
    if high_matches > 0:
        return "high"
    elif moderate_matches > 0:
        return "moderate"
    elif low_matches > 0:
        return "low"
    else:
        # If no clear match, analyze based on product type patterns
        return analyze_by_product_type(product_name)


def analyze_by_product_type(product_name: str) -> str:
    """Analyze seasonal demand based on general product type patterns"""

    # Summer fruits and vegetables
    summer_indicators = [
        "tomato",
        "pepper",
        "cucumber",
        "melon",
        "watermelon",
        "peach",
        "nectarine",
        "apricot",
        "plum",
        "cherry",
        "grape",
        "fig",
        "berry",
        "stone fruit",
    ]

    # Winter/hearty vegetables
    winter_indicators = [
        "cabbage",
        "cauliflower",
        "broccoli",
        "brussels",
        "kale",
        "chard",
        "leek",
        "turnip",
        "parsnip",
        "beet",
        "pumpkin",
        "squash",
        "sweet potato",
    ]

    # Root vegetables (moderate year-round)
    root_indicators = ["potato", "onion", "garlic", "carrot", "radish"]

    # Leafy greens (moderate year-round)
    leafy_indicators = ["lettuce", "spinach", "arugula", "herb"]

    # Check for patterns
    if any(indicator in product_name for indicator in summer_indicators):
        return "high"  # Summer products are high demand in summer
    elif any(indicator in product_name for indicator in winter_indicators):
        return "moderate"  # Winter vegetables are moderate in summer
    elif any(
        indicator in product_name for indicator in root_indicators + leafy_indicators
    ):
        return "moderate"  # Root vegetables and leafy greens are moderate year-round
    else:
        return "moderate"  # Default to moderate for unknown products


def generate_seasonal_opportunities(
    products: List[Dict[str, Any]], seasonal_pattern: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """Generate suggestions for seasonal product opportunities"""

    opportunities = []
    current_product_names = [p["name"].lower() for p in products]

    # Get high demand characteristics for the season
    high_demand_chars = seasonal_pattern["characteristics"]["high_demand"]
    high_demand_keywords = [
        word.strip() for word in high_demand_chars.replace(",", " ").split()
    ]

    # Check for missing high-demand product types
    for keyword in high_demand_keywords:
        if not any(keyword in name for name in current_product_names):
            opportunities.append(
                {
                    "product_type": keyword,
                    "reason": f"High seasonal demand for {keyword} but not in current inventory",
                    "recommendation": "consider_adding",
                }
            )

    return opportunities


def calculate_seasonal_trends(
    seasonal_pattern: Dict[str, Any], inventory_data: Dict[str, Any]
) -> Dict[str, Any]:
    """Calculate seasonal trends and insights"""

    trends = {
        "total_products": len(inventory_data["products"]),
        "total_stock_kg": sum(
            p["current_stock_kg"] for p in inventory_data["products"]
        ),
        "high_demand_coverage": 0,
        "moderate_demand_coverage": 0,
        "low_demand_coverage": 0,
        "average_turnover_rate": 0,
        "average_loss_rate": 0,
        "refrigeration_usage": 0,
        "seasonal_readiness_score": 0,
    }

    if not inventory_data["products"]:
        return trends

    # Get seasonal characteristics
    high_demand_chars = seasonal_pattern["characteristics"]["high_demand"]
    moderate_demand_chars = seasonal_pattern["characteristics"]["moderate_demand"]
    low_demand_chars = seasonal_pattern["characteristics"]["low_demand"]

    # Calculate coverage for each demand level
    high_demand_products = 0
    moderate_demand_products = 0
    low_demand_products = 0

    total_turnover = 0
    total_loss = 0
    refrigeration_products = 0

    for product in inventory_data["products"]:
        product_name_lower = product["name"].lower()

        # Analyze seasonal demand level
        seasonal_demand_level = analyze_product_seasonal_demand(
            product_name_lower,
            high_demand_chars,
            moderate_demand_chars,
            low_demand_chars,
        )

        if seasonal_demand_level == "high":
            high_demand_products += 1
        elif seasonal_demand_level == "moderate":
            moderate_demand_products += 1
        elif seasonal_demand_level == "low":
            low_demand_products += 1

        total_turnover += product["inventory_turnover_rate"]
        total_loss += product["loss_percentage"]

        if product["requires_refrigeration"]:
            refrigeration_products += 1

    # Calculate percentages
    total_products = len(inventory_data["products"])
    trends["high_demand_coverage"] = (high_demand_products / total_products) * 100
    trends["moderate_demand_coverage"] = (
        moderate_demand_products / total_products
    ) * 100
    trends["low_demand_coverage"] = (low_demand_products / total_products) * 100
    trends["average_turnover_rate"] = total_turnover / total_products
    trends["average_loss_rate"] = total_loss / total_products
    trends["refrigeration_usage"] = (refrigeration_products / total_products) * 100

    # Calculate seasonal readiness score (0-100)
    # Higher score = better alignment with seasonal demand
    seasonal_score = (
        (
            trends["high_demand_coverage"] * 0.5
        )  # High demand products are most important
        + (trends["moderate_demand_coverage"] * 0.3)  # Moderate demand products
        + (trends["low_demand_coverage"] * 0.2)  # Low demand products
        + (100 - trends["average_loss_rate"]) * 0.1  # Lower loss rate is better
    )
    trends["seasonal_readiness_score"] = min(100, max(0, seasonal_score))

    return trends


def generate_inventory_summary(inventory_data: Dict[str, Any]) -> Dict[str, Any]:
    """Generate a summary of current inventory status"""

    if not inventory_data["products"]:
        return {
            "total_products": 0,
            "total_stock_kg": 0,
            "refrigeration_products": 0,
            "average_shelf_life": 0,
            "top_products_by_stock": [],
            "products_at_risk": [],
        }

    products = inventory_data["products"]

    # Basic counts
    total_stock = sum(p["current_stock_kg"] for p in products)
    refrigeration_products = sum(1 for p in products if p["requires_refrigeration"])

    # Calculate average shelf life
    shelf_lives = [p["shelf_life_days"] for p in products if p["shelf_life_days"]]
    avg_shelf_life = sum(shelf_lives) / len(shelf_lives) if shelf_lives else 0

    # Top products by stock
    top_products = sorted(products, key=lambda x: x["current_stock_kg"], reverse=True)[
        :5
    ]
    top_products_summary = [
        {
            "name": p["name"],
            "stock_kg": p["current_stock_kg"],
            "turnover_rate": p["inventory_turnover_rate"],
        }
        for p in top_products
    ]

    # Products at risk (high loss rate or low turnover)
    at_risk_products = [
        {
            "name": p["name"],
            "stock_kg": p["current_stock_kg"],
            "loss_rate": p["loss_percentage"],
            "turnover_rate": p["inventory_turnover_rate"],
            "risk_factors": [],
        }
        for p in products
        if p["loss_percentage"] > 10 or p["inventory_turnover_rate"] < 20
    ]

    # Add risk factors
    for product in at_risk_products:
        if product["loss_rate"] > 10:
            product["risk_factors"].append("High waste rate")
        if product["turnover_rate"] < 20:
            product["risk_factors"].append("Low turnover rate")

    return {
        "total_products": len(products),
        "total_stock_kg": total_stock,
        "refrigeration_products": refrigeration_products,
        "average_shelf_life": avg_shelf_life,
        "top_products_by_stock": top_products_summary,
        "products_at_risk": at_risk_products,
    }
