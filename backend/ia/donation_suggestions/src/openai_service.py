import os
import json
from typing import Dict, Any, Optional
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None


class OpenAILocationService:
    """Service for getting location information using OpenAI's web search capabilities"""

    def __init__(self):
        """Initialize the OpenAI client"""
        if OpenAI is None:
            raise ValueError("OpenAI package is not installed. Please install with: pip install openai")

        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable is not set. Please set it with your OpenAI API key.")

        self.client = OpenAI(api_key=api_key)

    async def get_location_info(self, location_name: str, location_address: str = None) -> Dict[str, Any]:
        """
        Get detailed information about a donation location using OpenAI web search

        Args:
            location_name: Name of the organization/location
            location_address: Optional address information for better context

        Returns:
            Dictionary containing location information
        """
        try:
            # Construct search query - restrict to Portugal
            search_query = f"{location_name}"
            if location_address:
                search_query += f" {location_address}"

            # Add Portugal location restriction and specific information we're looking for
            search_query += " Portugal contact phone number opening hours schedule address"

            # Create the prompt for the AI
            prompt = f"""
            I need you to search for contact information about this organization in Portugal: {search_query}

            IMPORTANT: Only search for and return information about organizations located in Portugal.

            Return your response as a valid JSON object with these exact fields:

            {{
                "location_name": "{location_name}",
                "phone": "phone number or Not available",
                "schedule": "opening hours or Not available",
                "address": "full address in Portugal or Not available",
                "website": "website URL or Not available",
                "additional_info": "other contact info or Not available"
            }}

            IMPORTANT:
            - Return ONLY the JSON object, no other text
            - Use "Not available" for any information you cannot find
            - Ensure the JSON is properly formatted
            - Only include Portuguese organizations/locations
            """

            # Call OpenAI with web search model
            response = self.client.chat.completions.create(
                model="gpt-4o-mini-search-preview",
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=500
            )

            # Extract and parse the response
            response_content = response.choices[0].message.content.strip()

            # Try to clean up the response and extract JSON
            try:
                # Remove any markdown code blocks if present
                if "```json" in response_content:
                    start = response_content.find("```json") + 7
                    end = response_content.find("```", start)
                    response_content = response_content[start:end].strip()
                elif "```" in response_content:
                    start = response_content.find("```") + 3
                    end = response_content.find("```", start)
                    response_content = response_content[start:end].strip()

                # Try to find JSON object within the response
                start_brace = response_content.find("{")
                end_brace = response_content.rfind("}") + 1

                if start_brace != -1 and end_brace > start_brace:
                    json_content = response_content[start_brace:end_brace]
                    location_info = json.loads(json_content)
                else:
                    # Try parsing the whole content
                    location_info = json.loads(response_content)

                # Validate and fix required fields
                required_fields = ["location_name", "phone", "schedule", "address", "website", "additional_info"]
                for field in required_fields:
                    if field not in location_info or location_info[field] is None:
                        location_info[field] = "Not available"

                return location_info

            except (json.JSONDecodeError, ValueError, IndexError) as e:
                # If JSON parsing fails, return a structured fallback with debug info
                return self._create_fallback_response(
                    location_name,
                    f"Failed to parse AI response. Response was: {response_content[:200]}..."
                )

        except Exception as e:
            # Return fallback response on any error
            return self._create_fallback_response(location_name, f"Error fetching information: {str(e)}")

    def _create_fallback_response(self, location_name: str, error_message: str) -> Dict[str, Any]:
        """Create a fallback response when the search fails"""
        return {
            "location_name": location_name,
            "phone": "Not available",
            "schedule": "Not available",
            "address": "Not available",
            "website": "Not available",
            "additional_info": f"Unable to fetch information automatically. {error_message}",
            "error": True
        }