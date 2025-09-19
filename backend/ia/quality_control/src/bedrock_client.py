import boto3
import json
import os
from botocore.config import Config
from botocore.exceptions import ClientError
from .config import AWS_REGION, BEDROCK_CONFIG, BEDROCK_MODEL_ID

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


def classify_image_with_bedrock(
    product_name: str, image_b64: str, image_format: str, system_prompt: str
) -> dict:
    """
    Use AWS Bedrock Nova to classify food quality from image

    Args:
        product_name: Name of the product to classify
        image_b64: Base64 encoded image
        image_format: Image format (jpeg, png, gif, webp)
        system_prompt: System prompt for classification

    Returns:
        dict: Classification result or error
    """
    client = get_bedrock_client()

    # User message with text and image using Nova Converse API format
    user_message = f"Product name: {product_name}. Please classify the quality of this food item in the attached image."

    # Build request payload for Nova Converse API
    request_payload = {
        "system": [{"text": system_prompt}],
        "messages": [
            {
                "role": "user",
                "content": [
                    {"text": user_message},
                    {"image": {"format": image_format, "source": {"bytes": image_b64}}},
                ],
            }
        ],
        "inferenceConfig": {"maxTokens": 50, "temperature": 0.0, "topP": 1.0},
    }

    try:
        response = client.invoke_model(
            modelId=BEDROCK_MODEL_ID, body=json.dumps(request_payload)
        )
        model_response = json.loads(response["body"].read())

        # Parse Nova response format
        output = model_response.get("output", {})
        message = output.get("message", {})
        content = message.get("content", [])

        raw_text = ""
        if content and len(content) > 0:
            raw_text = content[0].get("text", "").strip()

        # Normalize output to expected labels
        for label in ["GOOD", "BAD", "SUBOPTIMAL", "WRONG_PRODUCT"]:
            if label in raw_text.upper():
                return {"classification": label, "raw_response": raw_text}

        # fallback if model didn't follow instructions
        return {"classification": "UNKNOWN", "raw_response": raw_text}

    except (ClientError, Exception) as e:
        return {"error": str(e)}
