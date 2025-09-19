#!/usr/bin/env python3
"""
Verification script to check if every product has at least 3 pending quotes
Run this after populating the database to verify the requirement is met.
"""

import asyncio
import asyncpg
from src.config import DB_CONFIG


async def verify_quotes_requirement():
    """Verify that every product has at least 3 pending quotes"""
    print("Verifying quote requirement: Every product should have at least 3 pending quotes")
    print("=" * 80)
    
    # Connect to database
    conn = await asyncpg.connect(**DB_CONFIG)
    
    try:
        # Get all products
        products = await conn.fetch("SELECT productid, name FROM product ORDER BY productid")
        print(f"Total products in database: {len(products)}")
        
        # Check quotes for each product
        products_without_enough_quotes = []
        products_with_pending_quotes = []
        
        for product in products:
            product_id = product["productid"]
            product_name = product["name"]
            
            # Count pending quotes for this product
            pending_count = await conn.fetchval(
                "SELECT COUNT(*) FROM quote WHERE productid = $1 AND status = 'Pending'",
                product_id
            )
            
            # Count all quotes for this product
            total_count = await conn.fetchval(
                "SELECT COUNT(*) FROM quote WHERE productid = $1",
                product_id
            )
            
            if pending_count >= 3:
                products_with_pending_quotes.append({
                    "id": product_id,
                    "name": product_name,
                    "pending": pending_count,
                    "total": total_count
                })
            else:
                products_without_enough_quotes.append({
                    "id": product_id,
                    "name": product_name,
                    "pending": pending_count,
                    "total": total_count
                })
        
        # Print results
        print(f"\n✅ Products with at least 3 pending quotes: {len(products_with_pending_quotes)}")
        print(f"❌ Products with less than 3 pending quotes: {len(products_without_enough_quotes)}")
        
        if products_without_enough_quotes:
            print("\n❌ Products that don't meet the requirement:")
            for product in products_without_enough_quotes[:10]:  # Show first 10
                print(f"   - {product['name']} (ID: {product['id']}): {product['pending']} pending, {product['total']} total")
            if len(products_without_enough_quotes) > 10:
                print(f"   ... and {len(products_without_enough_quotes) - 10} more")
        else:
            print("\n🎉 SUCCESS: All products have at least 3 pending quotes!")
        
        # Show some examples of compliant products
        if products_with_pending_quotes:
            print(f"\n✅ Examples of compliant products (showing first 5):")
            for product in products_with_pending_quotes[:5]:
                print(f"   - {product['name']} (ID: {product['id']}): {product['pending']} pending, {product['total']} total")
        
        # Summary statistics
        total_quotes = await conn.fetchval("SELECT COUNT(*) FROM quote")
        pending_quotes = await conn.fetchval("SELECT COUNT(*) FROM quote WHERE status = 'Pending'")
        approved_quotes = await conn.fetchval("SELECT COUNT(*) FROM quote WHERE status = 'Approved'")
        rejected_quotes = await conn.fetchval("SELECT COUNT(*) FROM quote WHERE status = 'Rejected'")
        
        print(f"\n📊 Quote Statistics:")
        print(f"   Total quotes: {total_quotes}")
        print(f"   Pending: {pending_quotes}")
        print(f"   Approved: {approved_quotes}")
        print(f"   Rejected: {rejected_quotes}")
        
        return len(products_without_enough_quotes) == 0
        
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(verify_quotes_requirement())
