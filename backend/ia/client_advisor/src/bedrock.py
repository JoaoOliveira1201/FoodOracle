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


def ask_client_advisor(
    query: str, context: str, history: list, model_id: str = BEDROCK_LLM_MODEL_ID
) -> str:
    """
    Ask a question to Bedrock with client data as context for personalized advice
    """
    client = get_bedrock_client()

    # Format the current user message with client context
    current_user_message = f"""Here's what I know about the customer and what's currently available:

{context}

The customer is asking: "{query}"

Please help them with a friendly, conversational response that uses the information above to give personalized recommendations."""

    # Build messages array for Nova Converse API
    messages = []

    # Add conversation history (excluding the current query)
    if history and len(history) > 1:
        for i in range(
            0, len(history) - 1, 2
        ):  # Process pairs of user/assistant messages
            if i < len(history) - 1:
                user_msg = history[i]
                if user_msg["role"] == "user":
                    messages.append(
                        {"role": "user", "content": [{"text": user_msg["content"]}]}
                    )

                if (
                    i + 1 < len(history) - 1
                ):  # Don't include the last message if it's assistant
                    assistant_msg = history[i + 1]
                    if assistant_msg["role"] == "assistant":
                        messages.append(
                            {
                                "role": "assistant",
                                "content": [{"text": assistant_msg["content"]}],
                            }
                        )

    # Add the current user message
    messages.append({"role": "user", "content": [{"text": current_user_message}]})

    # Build request payload for Nova Converse API
    request_payload = {
        "system": [{"text": SYSTEM_PROMPT}],
        "messages": messages,
        "inferenceConfig": {
            "maxTokens": 500,  # Shorter for more focused, conversational responses
            "temperature": 0.8,  # Higher temperature for more natural, varied responses
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
            return "I apologize, but I wasn't able to generate a response. Please try again."

    except (ClientError, Exception) as e:
        return f"I apologize, but I encountered an error while processing your request: {str(e)}. Please try again or contact support if the issue persists."
