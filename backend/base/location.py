from pydantic import BaseModel, Field, validator
from typing import Dict, Any, Optional
import math


class Location(BaseModel):
    """Location class with coordinate validation and PostGIS integration"""

    latitude: float = Field(
        ..., ge=-90, le=90, description="Latitude must be between -90 and 90"
    )
    longitude: float = Field(
        ..., ge=-180, le=180, description="Longitude must be between -180 and 180"
    )
    address: Optional[str] = Field(
        None, description="Human-readable address for this location"
    )

    @validator("latitude")
    def validate_latitude(cls, v):
        if not (-90 <= v <= 90):
            raise ValueError(f"Invalid latitude: {v}. Must be between -90 and 90")
        return v

    @validator("longitude")
    def validate_longitude(cls, v):
        if not (-180 <= v <= 180):
            raise ValueError(f"Invalid longitude: {v}. Must be between -180 and 180")
        return v

    def to_wkt(self) -> str:
        """Convert to Well-Known Text format for PostGIS"""
        return f"POINT({self.longitude} {self.latitude})"

    def __str__(self) -> str:
        if self.address:
            return f"{self.address} ({self.latitude}, {self.longitude})"
        return f"({self.latitude}, {self.longitude})"

    @classmethod
    def from_coordinates(
        cls, latitude: float, longitude: float, address: Optional[str] = None
    ) -> "Location":
        """Create Location from separate latitude and longitude values"""
        return cls(latitude=latitude, longitude=longitude, address=address)

    @classmethod
    def from_db_row(cls, row) -> Optional["Location"]:
        """Create Location from database row with longitude/latitude/address attributes"""
        longitude = (
            getattr(row, "longitude", None) if hasattr(row, "longitude") else None
        )
        latitude = getattr(row, "latitude", None) if hasattr(row, "latitude") else None
        address = getattr(row, "address", None) if hasattr(row, "address") else None

        if longitude is not None and latitude is not None:
            return cls(latitude=latitude, longitude=longitude, address=address)
        return None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for easy serialization"""
        result = {"latitude": self.latitude, "longitude": self.longitude}
        if self.address:
            result["address"] = self.address
        return result

    def to_postgis_geography(self):
        """Convert to PostGIS Geography object"""
        from geoalchemy2.functions import ST_GeogFromText

        return ST_GeogFromText(self.to_wkt())

    def distance_to(self, other: "Location") -> float:
        """Calculate distance in kilometers to another location using Haversine formula"""
        if not isinstance(other, Location):
            raise ValueError("other must be a Location instance")

        R = 6371  # Earth's radius in kilometers

        lat1_rad = math.radians(self.latitude)
        lon1_rad = math.radians(self.longitude)
        lat2_rad = math.radians(other.latitude)
        lon2_rad = math.radians(other.longitude)

        dlat = lat2_rad - lat1_rad
        dlon = lon2_rad - lon1_rad

        a = (
            math.sin(dlat / 2) ** 2
            + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2) ** 2
        )
        c = 2 * math.asin(math.sqrt(a))

        return R * c

    class Config:
        """Pydantic config for better JSON serialization"""

        json_encoders = {
            float: lambda v: round(
                v, 6
            )  # Round coordinates to 6 decimal places (~1m precision)
        }
