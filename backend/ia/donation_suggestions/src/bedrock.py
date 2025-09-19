import json
import os
from .config import BEDROCK_LLM_MODEL_ID, SYSTEM_PROMPT, AWS_REGION, BEDROCK_CONFIG
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

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


def find_donation_locations(
    location_data: dict, model_id: str = BEDROCK_LLM_MODEL_ID
) -> str:
    """
    Find nearby donation locations using Bedrock AI based on warehouse location
    """
    client = get_bedrock_client()

    # Simplified location query with warehouse address
    location_query = f"""Find organizations that accept food donations near this warehouse:

Warehouse Address: {location_data["address"]}
Coordinates: {location_data["latitude"]}, {location_data["longitude"]}

IMPORTANT: Return ONLY the organization names, one per line. Do not include any introductory text, descriptions, or explanations. Just list the organization names directly.

Example format:
Organization Name 1
Organization Name 2
Organization Name 3"""

    # Build request payload for Nova Converse API
    request_payload = {
        "system": [{"text": SYSTEM_PROMPT}],
        "messages": [{"role": "user", "content": [{"text": location_query}]}],
        "inferenceConfig": {
            "maxTokens": 2000,
            "temperature": 0.3,  # Lower temperature for more factual responses
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
            return content[0].get("text", "").strip()
        else:
            return "I apologize, but I wasn't able to find donation locations. Please try again."

    except (ClientError, Exception) as e:
        return f"I apologize, but I encountered an error while searching for donation locations: {str(e)}. Please try again or contact support if the issue persists."
