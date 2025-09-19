#!/usr/bin/env python3
"""
Merge progress files into final generated_locations.json
"""

import json
import glob
from datetime import datetime


def merge_progress_files():
    """Merge all progress files into final locations JSON"""
    print("🔄 Merging progress files...")

    # Load the final progress files
    user_file = "progress_user_240.json"
    city_file = "progress_city_60.json"

    user_locations = []
    city_locations = []

    # Load user locations
    try:
        with open(user_file, "r", encoding="utf-8") as f:
            user_data = json.load(f)
            user_locations = user_data["locations"]
        print(f"✅ Loaded {len(user_locations)} user locations from {user_file}")
    except Exception as e:
        print(f"❌ Failed to load {user_file}: {e}")
        return

    # Load city locations
    try:
        with open(city_file, "r", encoding="utf-8") as f:
            city_data = json.load(f)
            city_locations = city_data["locations"]
        print(f"✅ Loaded {len(city_locations)} city locations from {city_file}")
    except Exception as e:
        print(f"❌ Failed to load {city_file}: {e}")
        return

    # Create final merged data
    total_generated = len(user_locations) + len(city_locations)

    locations_data = {
        "metadata": {
            "generated_at": datetime.now().isoformat(),
            "total_requested": 300,
            "total_generated": total_generated,
            "user_locations_count": len(user_locations),
            "city_locations_count": len(city_locations),
            "source": "merged_from_progress_files",
            "validation_passed": False,  # Since final validation failed
            "processing_mode": "sequential",
        },
        "user_locations": user_locations,
        "city_locations": city_locations,
    }

    # Save merged file
    output_file = "generated_locations.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(locations_data, f, indent=2, ensure_ascii=False)

    print(f"✅ Merged locations saved to {output_file}")
    print(f"📊 Total locations: {total_generated}")
    print(f"📊 User locations: {len(user_locations)}")
    print(f"📊 City locations: {len(city_locations)}")

    # Clean up progress files
    print("\n🧹 Cleaning up progress files...")
    progress_files = glob.glob("progress_*.json")
    for file in progress_files:
        try:
            import os

            os.remove(file)
            print(f"🗑️ Removed: {file}")
        except Exception as e:
            print(f"⚠️ Failed to remove {file}: {e}")

    print(f"\n🎉 Successfully merged {total_generated} locations!")
    print(f"📄 Final file: {output_file}")


if __name__ == "__main__":
    merge_progress_files()
