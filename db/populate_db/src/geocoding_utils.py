"""
Geocoding utilities for converting coordinates to addresses
Handles rate limiting, retries, and error tracking for geopy requests
"""

import asyncio
from typing import Optional, List
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError


class GeocodingService:
    """Service for converting coordinates to addresses with retries"""

    def __init__(
        self,
        user_agent: str = "supply_chain_db_populator",
        quiet: bool = False,
    ):
        self.geolocator = Nominatim(user_agent=user_agent)
        self.failed_coordinates = []  # Track coordinates that failed after max retries
        self.quiet = quiet  # If True, don't print success messages

    async def coords_to_address(
        self,
        latitude: float,
        longitude: float,
        max_retries: int = 10,
        language: str = "pt",
    ) -> Optional[str]:
        """
        Convert coordinates to address with retry logic

        Args:
            latitude: Latitude coordinate
            longitude: Longitude coordinate
            max_retries: Maximum number of retry attempts
            language: Language for the response (default: Portuguese)

        Returns:
            Formatted address string. Format depends on available data:
            - With city: "City, County, Country"
            - Without city: "County, Country"
            - Returns None if county or country are missing or if request fails
        """
        for attempt in range(max_retries):
            try:
                # Perform the geocoding request
                location = await asyncio.to_thread(
                    self.geolocator.reverse, (latitude, longitude), language=language
                )

                if location and location.raw and "address" in location.raw:
                    address_data = location.raw["address"]
                    city = address_data.get(
                        "city",
                        address_data.get("town", address_data.get("village", "")),
                    )
                    county = address_data.get("county", address_data.get("state", ""))
                    country = address_data.get("country", "")

                    # County and country are mandatory, city is optional
                    if county and country:
                        # Format the address - include city only if available
                        if city:
                            address = f"{city}, {county}, {country}"
                            if not self.quiet:
                                print(
                                    f"✅ Geocoded ({latitude}, {longitude}) → {address}"
                                )
                            return address
                        else:
                            address = f"{county}, {country}"
                            if not self.quiet:
                                print(
                                    f"✅ Geocoded ({latitude}, {longitude}) → {address} (no city)"
                                )
                            return address
                    else:
                        # Missing mandatory fields, treat as failure
                        print(
                            f"❌ Missing mandatory fields for ({latitude}, {longitude}): county='{county}', country='{country}'"
                        )
                        return None

                # If we get here, the location was found but didn't have expected structure
                return None

            except (GeocoderTimedOut, GeocoderServiceError) as e:
                print(
                    f"Geocoding attempt {attempt + 1}/{max_retries} failed for ({latitude}, {longitude}): {e}"
                )

                if attempt < max_retries - 1:
                    # Wait longer before retrying (exponential backoff)
                    wait_time = min(2**attempt, 5)  # Cap at 5 seconds
                    await asyncio.sleep(wait_time)
                else:
                    # All retries exhausted
                    coord_key = f"({latitude}, {longitude})"
                    self.failed_coordinates.append(coord_key)
                    print(
                        f"❌ Failed to geocode {coord_key} after {max_retries} attempts"
                    )
                    return None

            except Exception as e:
                print(
                    f"Unexpected error during geocoding ({latitude}, {longitude}): {e}"
                )
                return None

        return None

    def get_failed_coordinates(self) -> List[str]:
        """Get list of coordinates that failed geocoding after all retries"""
        return self.failed_coordinates.copy()

    def get_failure_count(self) -> int:
        """Get count of failed geocoding attempts"""
        return len(self.failed_coordinates)
