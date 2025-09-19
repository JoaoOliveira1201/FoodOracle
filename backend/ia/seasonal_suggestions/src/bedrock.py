import json
import os
from .config import BEDROCK_LLM_MODEL_ID, SYSTEM_PROMPT, AWS_REGION, BEDROCK_CONFIG
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from typing import Dict, Any, List
from datetime import datetime

aws_bearer_token = os.getenv("AWS_BEARER_TOKEN_BEDROCK")
if aws_bearer_token:
    os.environ["AWS_BEARER_TOKEN_BEDROCK"] = aws_bearer_token
else:
    print(
        "AWS_BEARER_TOKEN_BEDROCK environment variable is not set. And will not work."
    )


def get_bedrock_client():
    """Create and return AWS Bedrock client with Nova timeout configuration"""
    return boto3.client(
        "bedrock-runtime",
        region_name=AWS_REGION,
        config=Config(
            connect_timeout=BEDROCK_CONFIG["connect_timeout"],
            read_timeout=BEDROCK_CONFIG["read_timeout"],
            retries={"max_attempts": BEDROCK_CONFIG["max_attempts"]},
        ),
    )


def format_inventory_context(
    inventory_data: Dict[str, Any],
    analysis_date: datetime,
    seasonal_context: Dict[str, Any],
) -> str:
    """Format inventory data and seasonal context for LLM analysis"""

    context = f"""
=== SEASONAL ANALYSIS CONTEXT ===
Analysis Date: {analysis_date.strftime("%Y-%m-%d")}
Season: {seasonal_context["season"]}
Seasonal Notes: {seasonal_context["seasonal_notes"]}

=== CURRENT INVENTORY SUMMARY ===
Total Products: {inventory_data["total_products"]}
Analysis Timestamp: {inventory_data["analysis_timestamp"]}

=== PRODUCT INVENTORY DETAILS ===
"""

    for product in inventory_data["products"]:
        context += f"""
--- {product["name"]} (ID: {product["product_id"]}) ---
Current Stock: {product["current_stock_kg"]} kg
Total Sold (Historical): {product["total_sold_kg"]} kg
Total Discarded (Historical): {product["total_discarded_kg"]} kg
Total Donated (Historical): {product["total_donated_kg"]} kg
Inventory Turnover Rate: {product["inventory_turnover_rate"]:.2f}%
Loss Percentage: {product["loss_percentage"]:.2f}%
Average Days to Sell: {product["average_days_to_sell"]:.1f} days
Base Price: ${product["base_price"] / 100:.2f} (stored as cents)
Requires Refrigeration: {"Yes" if product["requires_refrigeration"] else "No"}
Shelf Life: {product["shelf_life_days"]} days
"""

    context += f"""

=== SEASONAL TRENDS ===
High Demand Characteristics This Season: {seasonal_context["high_demand_foods"]}
Moderate Demand Characteristics: {seasonal_context["moderate_demand_foods"]}
Low Demand Characteristics: {seasonal_context["low_demand_foods"]}

=== ANALYSIS REQUEST ===
Based on the current inventory levels, seasonal demand patterns for Portugal, and historical performance data, please provide:

1. SUPPLY ADJUSTMENT RECOMMENDATIONS:
   - For each existing product, recommend whether to increase, reduce, or maintain supply
   - Provide specific percentage adjustments and reasoning
   - Consider seasonal demand, current stock levels, and historical performance

2. NEW PRODUCT SUGGESTIONS:
   - Suggest 3-5 new seasonal products that should be added to inventory
   - Include reasoning based on Portuguese seasonal preferences
   - Consider shelf life, refrigeration needs, and market potential

3. WASTE REDUCTION OPPORTUNITIES:
   - Identify products with high discard rates that could benefit from seasonal adjustments
   - Suggest strategies to reduce waste through better seasonal planning

4. STORAGE OPTIMIZATION:
   - Recommend storage and refrigeration adjustments for seasonal products
   - Consider shelf life and seasonal demand patterns

Please provide specific, actionable recommendations with clear reasoning based on the data provided.
"""

    return context


async def get_seasonal_suggestions(
    inventory_data: Dict[str, Any],
    analysis_date: datetime,
    seasonal_context: Dict[str, Any],
    model_id: str = BEDROCK_LLM_MODEL_ID,
) -> List[Dict[str, Any]]:
    """
    Get seasonal supply chain suggestions from Bedrock AI
    """
    client = get_bedrock_client()

    # Format the context for analysis
    context = format_inventory_context(inventory_data, analysis_date, seasonal_context)

    # Build request payload for Nova Converse API
    request_payload = {
        "system": [{"text": SYSTEM_PROMPT}],
        "messages": [{"role": "user", "content": [{"text": context}]}],
        "inferenceConfig": {
            "maxTokens": 3000,  # Increased for comprehensive seasonal analysis
            "temperature": 0.7,
            "topP": 0.9,
        },
    }

    try:
        response = client.invoke_model(
            modelId=model_id, body=json.dumps(request_payload)
        )
        model_response = json.loads(response["body"].read())

        # Parse Nova response format
        output = model_response.get("output", {})
        message = output.get("message", {})
        content = message.get("content", [])

        if content and len(content) > 0:
            ai_response = content[0].get("text", "").strip()

            # Debug: Print the raw AI response
            print(f"Raw AI Response: {ai_response[:200]}...")

            # Parse the AI response into structured suggestions
            suggestions = parse_ai_suggestions(
                ai_response, inventory_data, seasonal_context
            )
            print(f"Parsed suggestions: {suggestions}")
            return suggestions
        else:
            return [
                {
                    "type": "error",
                    "message": "Unable to generate seasonal suggestions. Please try again.",
                }
            ]

    except (ClientError, Exception) as e:
        return [
            {
                "type": "error",
                "message": f"Error processing seasonal analysis: {str(e)}",
            }
        ]


def parse_ai_suggestions(
    ai_response: str, inventory_data: Dict[str, Any], seasonal_context: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """
    Parse AI response into structured suggestions with title and summary format
    """
    try:
        # Clean the response - remove any markdown code blocks or extra text
        cleaned_response = ai_response.strip()

        # Remove markdown code blocks if present
        if cleaned_response.startswith("```json"):
            cleaned_response = cleaned_response[7:]
        if cleaned_response.startswith("```"):
            cleaned_response = cleaned_response[3:]
        if cleaned_response.endswith("```"):
            cleaned_response = cleaned_response[:-3]

        cleaned_response = cleaned_response.strip()

        # Try to find JSON array in the response
        json_start = cleaned_response.find("[")
        json_end = cleaned_response.rfind("]") + 1

        if json_start != -1 and json_end > json_start:
            json_str = cleaned_response[json_start:json_end]
            suggestions = json.loads(json_str)
        else:
            # Try to parse the entire response as JSON
            suggestions = json.loads(cleaned_response)

        # Validate the format
        if isinstance(suggestions, list):
            validated_suggestions = []
            for item in suggestions:
                if isinstance(item, dict) and "title" in item and "summary" in item:
                    validated_suggestions.append(
                        {"title": item["title"], "summary": item["summary"]}
                    )
                else:
                    # If item doesn't have required fields, create a fallback
                    validated_suggestions.append(
                        {
                            "title": "General Recommendation",
                            "summary": str(item)
                            if isinstance(item, str)
                            else "Invalid recommendation format",
                        }
                    )
            return validated_suggestions
        else:
            # If not a list, wrap in a single suggestion
            return [{"title": "AI Recommendation", "summary": str(suggestions)}]

    except json.JSONDecodeError as e:
        print(f"JSON Decode Error: {e}")
        print(f"Response that failed to parse: {ai_response[:300]}...")
        # If JSON parsing fails, try to extract structured content from text
        return parse_text_suggestions(ai_response)
    except Exception as e:
        print(f"Parse Error: {e}")
        # Fallback to error message
        return [
            {
                "title": "Analysis Error",
                "summary": f"Unable to parse AI response: {str(e)}",
            }
        ]


def parse_text_suggestions(text_response: str) -> List[Dict[str, Any]]:
    """
    Fallback parser for non-JSON responses
    """
    suggestions = []

    # Try to extract JSON from text if it contains JSON-like content
    if "[" in text_response and "]" in text_response:
        try:
            # Look for JSON array pattern
            json_start = text_response.find("[")
            json_end = text_response.rfind("]") + 1
            json_str = text_response[json_start:json_end]

            # Try to parse as JSON
            parsed_json = json.loads(json_str)
            if isinstance(parsed_json, list):
                for item in parsed_json:
                    if isinstance(item, dict) and "title" in item and "summary" in item:
                        suggestions.append(
                            {"title": item["title"], "summary": item["summary"]}
                        )
                    elif isinstance(item, dict):
                        # Try to extract title and summary from any dict
                        title = item.get("title", "Recommendation")
                        summary = item.get("summary", str(item))
                        suggestions.append({"title": title, "summary": summary})
        except:
            pass  # Fall through to text parsing

    # If no JSON found or parsing failed, try text parsing
    if not suggestions:
        lines = text_response.split("\n")
        current_title = None
        current_summary = None

        for line in lines:
            line = line.strip()
            if not line:
                continue

            # Look for title patterns
            if (
                line.startswith("-")
                or line.startswith("•")
                or line.startswith("*")
                or line.startswith("1.")
                or line.startswith("2.")
                or line.startswith("3.")
                or line.startswith("4.")
                or line.startswith("5.")
            ):
                # Save previous suggestion if exists
                if current_title and current_summary:
                    suggestions.append(
                        {"title": current_title, "summary": current_summary}
                    )

                # Start new suggestion
                current_title = line.lstrip("-•*123456789. ").strip()
                current_summary = ""

            elif current_title and line:
                # Add to current summary
                if current_summary:
                    current_summary += " " + line
                else:
                    current_summary = line

        # Add the last suggestion
        if current_title and current_summary:
            suggestions.append({"title": current_title, "summary": current_summary})

    # If no structured content found, create a single suggestion
    if not suggestions:
        suggestions.append(
            {
                "title": "Seasonal Analysis",
                "summary": text_response[:150] + "..."
                if len(text_response) > 150
                else text_response,
            }
        )

    return suggestions
