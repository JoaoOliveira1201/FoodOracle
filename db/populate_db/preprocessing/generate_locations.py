#!/usr/bin/env python3
"""
Location generator script for Supply Chain Management System
Generates 1000 locations with coordinates and addresses, saves to JSON file

This script pre-generates all location data to avoid real-time geocoding during database population.
"""

import asyncio
import json
import random
from datetime import datetime
from tqdm.asyncio import tqdm
from src.geocoding_utils import GeocodingService
from src.data import PORTUGAL_BOUNDS, PORTUGUESE_CITIES


def generate_portugal_coordinates():
    """Generate random coordinates within Portugal's boundaries"""
    # Use a hybrid approach: 70% of the time use bounded random coordinates,
    # 30% of the time use coordinates near existing Portuguese cities
    if random.random() < 0.7:
        longitude = random.uniform(
            PORTUGAL_BOUNDS["min_longitude"], PORTUGAL_BOUNDS["max_longitude"]
        )
        latitude = random.uniform(
            PORTUGAL_BOUNDS["min_latitude"], PORTUGAL_BOUNDS["max_latitude"]
        )
        return (longitude, latitude)
    else:
        # Pick a random city and add small random offset to ensure variety
        base_city_coords = random.choice(PORTUGUESE_CITIES)[1]
        # Add small random offset (max ~20km in any direction)
        longitude_offset = random.uniform(-0.2, 0.2)
        latitude_offset = random.uniform(-0.15, 0.15)

        return (
            base_city_coords[0] + longitude_offset,
            base_city_coords[1] + latitude_offset,
        )


def generate_city_coordinates():
    """Get random coordinates from Portuguese cities for warehouses/trucks with small random offset"""
    city_name, base_coords = random.choice(PORTUGUESE_CITIES)

    # Add small random offset to avoid exact duplicates
    longitude_offset = random.uniform(-0.5, 0.5)  # ~5km offset
    latitude_offset = random.uniform(-0.4, 0.4)  # ~4km offset

    return (base_coords[0] + longitude_offset, base_coords[1] + latitude_offset)


async def save_progress(location_type: str, locations: list, count: int):
    """Save progress to a temporary file every 10 locations"""
    filename = f"progress_{location_type}_{count}.json"
    progress_data = {
        "type": location_type,
        "count": count,
        "timestamp": datetime.now().isoformat(),
        "locations": locations,
    }

    try:
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(progress_data, f, indent=2, ensure_ascii=False)
        print(f"¾ Saved progress: {filename}")
    except Exception as e:
        print(f"âš ï¸ Failed to save progress: {e}")


def cleanup_progress_files():
    """Clean up temporary progress files"""
    import glob
    import os

    progress_files = glob.glob("progress_*.json")
    for file in progress_files:
        try:
            os.remove(file)
            print(f"‘ï¸ Cleaned up: {file}")
        except Exception as e:
            print(f"âš ï¸ Failed to remove {file}: {e}")


async def process_coordinate_batch(
    geocoding_service,
    coordinates_batch,
    location_type,
    semaphore,
    seen_addresses,
    stats,
):
    """Process a batch of coordinates in parallel"""

    async def process_single_coordinate(coord_data):
        longitude, latitude = coord_data
        async with semaphore:  # Limit concurrent requests
            try:
                # Add a longer delay between requests to avoid timeouts
                await asyncio.sleep(
                    1.0
                )  # 1 second delay = max 1 request per second per worker
                address = await geocoding_service.coords_to_address(latitude, longitude)

                # Filter out Spain locations immediately and don't print success for them
                if address:
                    spain_keywords = ["Espanha", "Spain", "EspaÃ±a", "Espana"]
                    if any(keyword in address for keyword in spain_keywords):
                        print(
                            f"« SPAIN REJECTED: ({latitude}, {longitude}) â†’ {address}"
                        )
                        return longitude, latitude, "SPAIN_REJECTED"
                    else:
                        print(
                            f" PORTUGAL ACCEPTED: ({latitude}, {longitude}) â†’ {address}"
                        )

                return longitude, latitude, address
            except Exception as e:
                print(f"âš ï¸ Error geocoding ({latitude}, {longitude}): {e}")
                return longitude, latitude, None

    # Process all coordinates in parallel
    tasks = [process_single_coordinate(coord) for coord in coordinates_batch]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    # Filter and validate results
    valid_locations = []
    spain_keywords = ["Espanha", "Spain", "EspaÃ±a", "Espana"]

    for result in results:
        if isinstance(result, Exception):
            stats["failed_count"] += 1
            continue

        longitude, latitude, address = result

        if address is None:
            stats["failed_count"] += 1
            continue

        # Check for Spain (already filtered in process_single_coordinate)
        if address == "SPAIN_REJECTED":
            stats["spain_rejected"] += 1
            continue

        # Check for duplicates (thread-safe check)
        normalized_address = address.strip().lower()
        if normalized_address in seen_addresses:
            stats["duplicate_rejected"] += 1
            continue

        # Add to seen addresses
        seen_addresses.add(normalized_address)

        location_data = {
            "longitude": longitude,
            "latitude": latitude,
            "address": address,
            "type": location_type,
        }
        valid_locations.append(location_data)

    return valid_locations


async def generate_locations_with_addresses_sequential(count: int = 1000):
    """
    Generate unique locations with their addresses using reliable sequential geocoding

    Args:
        count: Number of locations to generate

    Returns:
        Dictionary containing user locations, city locations, and metadata
    """
    print(
        f" Starting reliable sequential generation of {count} unique locations (240 user + 60 city)..."
    )
    print("âš¡ Using sequential processing for maximum reliability")

    geocoding_service = GeocodingService(quiet=True)
    seen_addresses = set()

    # Statistics tracking
    stats = {"failed_count": 0, "spain_rejected": 0, "duplicate_rejected": 0}

    user_locations = []
    city_locations = []
    user_target = 240  # 80% of 300
    city_target = 60  # 20% of 300
    spain_keywords = ["Espanha", "Spain", "EspaÃ±a", "Espana"]

    # Generate user locations - NEVER GIVE UP!
    print(" Generating 240 unique user locations...")
    attempts = 0

    with tqdm(total=user_target, desc="User locations", unit="loc") as pbar:
        while len(user_locations) < user_target:
            attempts += 1
            longitude, latitude = generate_portugal_coordinates()

            # Become more lenient after many attempts (but NEVER allow Spain)
            duplicate_check_enabled = (
                attempts < 1000
            )  # Disable duplicate check after 1000 attempts

            # Show leniency status
            if attempts == 1000:
                print(
                    "\n¥ Becoming lenient: Allowing duplicates after 1000 attempts (but NEVER Spain)"
                )

            try:
                # Add delay to be gentle on the API
                await asyncio.sleep(0.5)  # 500ms delay between requests
                address = await geocoding_service.coords_to_address(latitude, longitude)

                if address is None:
                    stats["failed_count"] += 1
                    continue

                # Check for Spain (ALWAYS reject Spain)
                if any(keyword in address for keyword in spain_keywords):
                    stats["spain_rejected"] += 1
                    continue

                # Check for duplicates (only if enabled)
                normalized_address = address.strip().lower()
                if duplicate_check_enabled and normalized_address in seen_addresses:
                    stats["duplicate_rejected"] += 1
                    continue

                # Success!
                seen_addresses.add(normalized_address)
                location_data = {
                    "longitude": longitude,
                    "latitude": latitude,
                    "address": address,
                    "type": "user",
                }
                user_locations.append(location_data)
                pbar.update(1)

                # Save progress every 10 locations
                if len(user_locations) % 10 == 0:
                    await save_progress("user", user_locations, len(user_locations))

            except Exception as e:
                stats["failed_count"] += 1
                continue

    # Generate city locations - NEVER GIVE UP!
    print(" Generating 60 unique city locations...")
    city_attempts = 0

    with tqdm(total=city_target, desc="City locations", unit="loc") as pbar:
        while len(city_locations) < city_target:
            city_attempts += 1
            longitude, latitude = generate_city_coordinates()

            # Become more lenient after many attempts for city locations (but NEVER allow Spain)
            duplicate_check_enabled = (
                city_attempts < 400
            )  # Disable duplicate check after 400 attempts

            # Show leniency status for city locations
            if city_attempts == 400:
                print(
                    "\n¥ City locations becoming lenient: Allowing duplicates after 400 attempts (but NEVER Spain)"
                )

            # Debug city coordinate generation every 50 attempts
            if city_attempts % 50 == 0:
                print(
                    f"\n City attempts: {city_attempts}, Generated coordinates: ({longitude}, {latitude})"
                )

            try:
                await asyncio.sleep(0.5)  # 500ms delay
                address = await geocoding_service.coords_to_address(latitude, longitude)

                if address is None:
                    stats["failed_count"] += 1
                    print(f"âš ï¸ City geocoding failed for ({longitude}, {latitude})")
                    continue

                # Check for Spain (ALWAYS reject Spain)
                if any(keyword in address for keyword in spain_keywords):
                    stats["spain_rejected"] += 1
                    print(
                        f"« City Spain rejected: ({longitude}, {latitude}) â†’ {address}"
                    )
                    continue

                # Check for duplicates (only if enabled)
                normalized_address = address.strip().lower()
                if duplicate_check_enabled and normalized_address in seen_addresses:
                    stats["duplicate_rejected"] += 1
                    print(f"„ City duplicate rejected: {address}")
                    continue

                # Success!
                seen_addresses.add(normalized_address)
                location_data = {
                    "longitude": longitude,
                    "latitude": latitude,
                    "address": address,
                    "type": "city",
                }
                print(
                    f" City location success: ({longitude}, {latitude}) â†’ {address}"
                )
                city_locations.append(location_data)
                pbar.update(1)

                # Save progress every 10 locations
                if len(city_locations) % 10 == 0:
                    await save_progress("city", city_locations, len(city_locations))

            except Exception as e:
                stats["failed_count"] += 1
                continue

    print(
        f" Generated {len(user_locations)} user locations and {len(city_locations)} city locations"
    )

    # Save final progress files
    if user_locations:
        await save_progress("user", user_locations, len(user_locations))
    if city_locations:
        await save_progress("city", city_locations, len(city_locations))

    # FINAL VALIDATION: Double-check for any Spain locations or duplicates that might have slipped through
    print(" Final validation: checking for Spain locations and duplicates...")

    all_locations = user_locations + city_locations
    spain_keywords = ["Espanha", "Spain", "EspaÃ±a", "Espana"]
    validation_errors = []

    # Check for Spain locations
    for i, location in enumerate(all_locations):
        address = location["address"]
        if any(keyword in address for keyword in spain_keywords):
            validation_errors.append(f"SPAIN FOUND: Index {i}, Address: {address}")

    # Check for duplicates
    seen_validation = set()
    for i, location in enumerate(all_locations):
        normalized_address = location["address"].strip().lower()
        if normalized_address in seen_validation:
            validation_errors.append(
                f"DUPLICATE FOUND: Index {i}, Address: {location['address']}"
            )
        seen_validation.add(normalized_address)

    # If validation errors found, raise exception
    if validation_errors:
        print(" VALIDATION FAILED!")
        for error in validation_errors:
            print(f"  {error}")
        raise Exception(
            f"Validation failed: {len(validation_errors)} errors found. Spain locations or duplicates detected!"
        )

    print(" Validation passed: No Spain locations or duplicates found!")

    # Compile results
    total_generated = len(user_locations) + len(city_locations)
    failed_count = stats["failed_count"] + geocoding_service.get_failure_count()
    spain_rejected_count = stats["spain_rejected"]
    duplicate_rejected_count = stats["duplicate_rejected"]

    locations_data = {
        "metadata": {
            "generated_at": datetime.now().isoformat(),
            "total_requested": count,
            "total_generated": total_generated,
            "user_locations_count": len(user_locations),
            "city_locations_count": len(city_locations),
            "failed_geocoding_count": failed_count,
            "spain_rejected_count": spain_rejected_count,
            "duplicate_rejected_count": duplicate_rejected_count,
            "unique_addresses_count": len(seen_addresses),
            "failed_coordinates": geocoding_service.get_failed_coordinates(),
            "success_rate": f"{(total_generated / (total_generated + failed_count + spain_rejected_count + duplicate_rejected_count) * 100):.1f}%"
            if (
                total_generated
                + failed_count
                + spain_rejected_count
                + duplicate_rejected_count
            )
            > 0
            else "0%",
            "validation_passed": True,
            "processing_mode": "sequential",
        },
        "user_locations": user_locations,
        "city_locations": city_locations,
    }

    return locations_data


async def main():
    """Main function to generate locations and save to JSON"""
    print("=" * 60)
    print("—ï¸  RELIABLE LOCATION GENERATOR FOR SUPPLY CHAIN DB")
    print("=" * 60)

    try:
        # Generate locations with reliable sequential processing
        locations_data = await generate_locations_with_addresses_sequential(300)

        # Save to JSON file
        output_file = "generated_locations.json"
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(locations_data, f, indent=2, ensure_ascii=False)

        # Print summary
        metadata = locations_data["metadata"]
        print("\n" + "=" * 60)
        print(" LOCATION GENERATION COMPLETED")
        print("=" * 60)
        print(f"Š SUMMARY:")
        print(f"  â€¢ Total unique locations generated: {metadata['total_generated']}")
        print(f"  â€¢ User locations: {metadata['user_locations_count']}")
        print(f"  â€¢ City locations: {metadata['city_locations_count']}")
        print(f"  â€¢ Unique addresses: {metadata['unique_addresses_count']}")
        print(f"  â€¢ Failed geocoding attempts: {metadata['failed_geocoding_count']}")
        print(f"  â€¢ Spain locations rejected: {metadata['spain_rejected_count']}")
        print(
            f"  â€¢ Duplicate locations rejected: {metadata['duplicate_rejected_count']}"
        )
        print(f"  â€¢ Success rate: {metadata['success_rate']}")
        print(f"  â€¢ Processing mode: {metadata.get('processing_mode', 'unknown')}")
        print(
            f"  â€¢ Final validation: {' PASSED' if metadata.get('validation_passed') else ' FAILED'}"
        )
        print(f"  â€¢ Output file: {output_file}")

        if metadata["failed_geocoding_count"] > 0:
            print(f"\nâš ï¸  FAILED COORDINATES (no county/country):")
            for coord in metadata["failed_coordinates"]:
                print(f"    - {coord}")

        if metadata["spain_rejected_count"] > 0:
            print(
                f"\nª¸ REJECTED {metadata['spain_rejected_count']} locations in Spain"
            )

        if metadata["duplicate_rejected_count"] > 0:
            print(
                f"\n„ REJECTED {metadata['duplicate_rejected_count']} duplicate locations"
            )

        print("\n‰ Ready to use with populate script!")
        print("=" * 60)

        # Clean up temporary progress files
        print("\nðŸ§¹ Cleaning up temporary files...")
        cleanup_progress_files()

    except Exception as e:
        print(f" Error during location generation: {e}")
        raise


if __name__ == "__main__":
    asyncio.run(main())
