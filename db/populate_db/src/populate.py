"""
Database population functions for Supply Chain Management System
All entity population logic consolidated in one file for simplicity
"""

import random
from datetime import datetime, timedelta
from faker import Faker
from .config import (
    USER_TARGETS,
    PRODUCT_TARGET_COUNT,
    WAREHOUSE_TARGET_COUNT,
    TRUCK_TARGET_COUNT,
    POPULATION_COUNTS,
)
from .data import (
    SAMPLE_USERS,
    SAMPLE_TRUCKS,
    PRODUCE_ITEMS,
    WAREHOUSE_TYPES,
    PORTUGUESE_CITIES,
    QUALITY_OPTIONS,
    STATUS_OPTIONS,
    TRANSFER_REASONS,
    SAMPLE_TRANSFER_NOTES,
    random_city_location,
    load_locations_from_json,
    get_sample_users,
    get_random_user_location,
    get_random_city_location,
    get_locations_metadata,
)

faker = Faker()


# ===============================
# BASIC ENTITIES
# ===============================


async def populate_users(db_manager):
    """Populate User table with sample and generated users using pre-generated locations"""
    print("Populating users...")

    created_count = 0

    # Get sample users with pre-generated locations
    sample_users = get_sample_users()

    # Insert sample users
    print(
        f"📍 Creating {len(sample_users)} sample users with pre-generated locations..."
    )
    for i, user_data in enumerate(sample_users, 1):
        lng, lat, address = user_data["location"]

        user_id = await db_manager.conn.fetchval(
            """INSERT INTO "User" (Name, ContactInfo, Location, Address, PasswordString, Role) 
               VALUES ($1, $2, ST_Point($3, $4), $5, $6, $7) RETURNING UserID""",
            user_data["name"],
            user_data["contact"],
            lng,
            lat,
            address,
            user_data["password"],
            user_data["role"],
        )
        db_manager.add_user_id(user_data["role"], user_id)
        created_count += 1
        print(
            f"✅ Created user '{user_data['name']}' ({user_data['role']}) with address: {address}"
        )

    # Generate additional users to reach targets
    existing_by_role = {}
    for u in sample_users:
        role = u["role"]
        existing_by_role[role] = existing_by_role.get(role, 0) + 1

    for role, target in USER_TARGETS.items():
        current = existing_by_role.get(role, 0)
        to_generate = max(0, target - current)

        if to_generate > 0:
            print(
                f"📍 Creating {to_generate} additional {role} users with pre-generated locations..."
            )

        for i in range(to_generate):
            name = faker.name()
            contact = (
                faker.company_email()
                if role in ("Supplier", "Buyer")
                else faker.email()
            )
            lng, lat, address = get_random_user_location()
            password = faker.password(length=10)

            user_id = await db_manager.conn.fetchval(
                """INSERT INTO "User" (Name, ContactInfo, Location, Address, PasswordString, Role) 
                   VALUES ($1, $2, ST_Point($3, $4), $5, $6, $7) RETURNING UserID""",
                name,
                contact,
                lng,
                lat,
                address,
                password,
                role,
            )
            db_manager.add_user_id(role, user_id)
            created_count += 1
            print(f"✅ Created user '{name}' ({role}) with address: {address}")

    total_users = sum(len(v) for v in db_manager.user_ids.values())
    print(f"✓ Created {created_count} users using pre-generated locations")


async def populate_products(db_manager):
    """Populate Product table with generated products"""
    print("Populating products...")

    for i in range(PRODUCT_TARGET_COUNT):
        name = random.choice(PRODUCE_ITEMS)
        # Make names unique if duplicates arise
        if name in db_manager.product_ids:
            name = f"{name} {faker.unique.numerify(text='###')}"

        base_price = random.randint(80, 800)
        discount_percentage = random.choice([5, 10, 15, 20, 25, 30, 35, 40])
        requires_refrigeration = name not in [
            "Onions","Garlic","Potatoes","Yams",
            "Beets","Turnips","Radishes","Rutabagas","Parsnips",
            "Ginger","Pumpkins","Butternut","Acorn","Spaghetti","Delicata",
        ]

        shelf_life_days = random.choice([30, 45, 60, 90, 120, 150, 180])  # Much longer shelf life: 1-6 months
        deadline_to_discount = max(
            7, min(shelf_life_days - 7, random.choice([14, 21, 30, 45, 60]))  # Discount 1-2 months before expiry
        )

        product_id = await db_manager.conn.fetchval(
            """INSERT INTO Product (Name, BasePrice, DiscountPercentage, RequiresRefrigeration, ShelfLifeDays, DeadlineToDiscount) 
               VALUES ($1, $2, $3, $4, $5, $6) RETURNING ProductID""",
            name,
            base_price,
            discount_percentage,
            requires_refrigeration,
            shelf_life_days,
            deadline_to_discount,
        )
        db_manager.add_product_id(name, product_id)

    print(f"✓ Created {len(db_manager.get_product_ids())} products")


async def populate_warehouses(db_manager):
    """Populate Warehouse table with generated warehouses using pre-generated locations"""
    print("Populating warehouses...")

    created_count = 0
    warehouse_index = 1

    print(
        f"📍 Creating {WAREHOUSE_TARGET_COUNT} warehouses with pre-generated locations..."
    )
    for i in range(WAREHOUSE_TARGET_COUNT):
        lng, lat, address = get_random_city_location()

        # Extract city name from address for warehouse naming
        city_name = address.split(",")[0] if "," in address else "Unknown City"
        name = random.choice(WAREHOUSE_TYPES)
        full_name = f"{city_name} {name}"

        # Demo-friendly warehouse capacities
        normal_capacity = random.randrange(25000, 50001, 500)  # 25k-60k kg
        refrigerated_capacity = random.randrange(15000, min(25000, normal_capacity) + 1, 500)  # 1k-20k kg

        warehouse_id = await db_manager.conn.fetchval(
            """INSERT INTO Warehouse (Name, Location, Address, NormalCapacityKg, RefrigeratedCapacityKg) 
               VALUES ($1, ST_Point($2, $3), $4, $5, $6) RETURNING WarehouseID""",
            full_name,
            lng,
            lat,
            address,
            normal_capacity,
            refrigerated_capacity,
        )
        db_manager.add_warehouse_id(warehouse_index, warehouse_id)
        warehouse_index += 1
        created_count += 1
        print(f"✅ Created warehouse '{full_name}' with address: {address}")

    print(f"✓ Created {created_count} warehouses using pre-generated locations")


async def get_truck_location(db_manager, warehouses, index):
    """Get location for truck from warehouse or random city location"""
    if warehouses:
        chosen_wh_id = warehouses[index % len(warehouses)]
        row = await db_manager.conn.fetchrow(
            "SELECT ST_X(Location::geometry) as lng, ST_Y(Location::geometry) as lat FROM Warehouse WHERE WarehouseID = $1",
            chosen_wh_id,
        )
        return row["lng"], row["lat"]
    else:
        return random_city_location()


async def populate_trucks(db_manager):
    """Populate Truck table with sample and generated trucks"""
    print("Populating trucks...")

    drivers = db_manager.get_user_ids("TruckDriver")
    warehouses = db_manager.get_warehouse_ids()

    # Get Test Driver ID to ensure they get a truck
    test_driver_id = await db_manager.conn.fetchval(
        'SELECT userid FROM "User" WHERE contactinfo = $1 AND role = $2',
        "driver@test.com",
        "TruckDriver",
    )

    # Track assigned drivers to avoid duplicates
    assigned_drivers = set()

    # Create trucks from sample data
    for i, truck_data in enumerate(SAMPLE_TRUCKS):
        # Ensure Test Driver gets the first truck
        if i == 0 and test_driver_id:
            driver_id = test_driver_id
            assigned_drivers.add(test_driver_id)
            print(f"✓ Assigned truck {i + 1} to Test Driver (driver@test.com)")
        else:
            # Assign to other drivers, avoiding already assigned ones
            available_drivers = [d for d in drivers if d not in assigned_drivers]
            if available_drivers:
                driver_id = available_drivers[i % len(available_drivers)]
                assigned_drivers.add(driver_id)
            else:
                # If all drivers are assigned, start over (some drivers can have multiple trucks)
                driver_id = drivers[i % len(drivers)] if drivers else None

        lng, lat = await get_truck_location(db_manager, warehouses, i)

        truck_id = await db_manager.conn.fetchval(
            """INSERT INTO Truck (TruckDriverID, CurrentLocation, Status, Type, LoadCapacityKg) 
               VALUES ($1, ST_Point($2, $3), $4, $5, $6) RETURNING TruckID""",
            driver_id,
            lng,
            lat,
            truck_data["status"],
            truck_data["type"],
            truck_data["load_capacity"],
        )
        db_manager.add_truck_id(i + 1, truck_id)

    # Generate additional trucks to reach target
    existing_count = len(db_manager.get_truck_ids())
    to_add = max(0, TRUCK_TARGET_COUNT - existing_count)

    for i in range(to_add):
        # Continue round-robin assignment
        driver_id = drivers[(existing_count + i) % len(drivers)] if drivers else None
        lng, lat = await get_truck_location(db_manager, warehouses, existing_count + i)

        truck_type = random.choices(["Refrigerated", "Normal"], weights=[0.4, 0.6])[0]
        status = random.choices(["Available", "InService"], weights=[0.8, 0.2])[0]
        load_capacity = random.randrange(100, 2601, 100)

        truck_id = await db_manager.conn.fetchval(
            """INSERT INTO Truck (TruckDriverID, CurrentLocation, Status, Type, LoadCapacityKg) 
               VALUES ($1, ST_Point($2, $3), $4, $5, $6) RETURNING TruckID""",
            driver_id,
            lng,
            lat,
            status,
            truck_type,
            load_capacity,
        )
        db_manager.add_truck_id(existing_count + i + 1, truck_id)

    print(f"✓ Created {len(db_manager.get_truck_ids())} trucks")


# ===============================
# FILE-BASED ENTITIES
# ===============================


async def populate_quotes(db_manager, file_manager):
    """Populate Quote table with PDF documents"""
    print("Populating quotes...")

    suppliers = db_manager.get_user_ids("Supplier")
    products = db_manager.get_product_ids()
    status_choices = ["Pending", "Approved", "Rejected"]
    status_weights = [0.25, 0.6, 0.15]

    for i in range(POPULATION_COUNTS["quotes"]):
        supplier_id = random.choice(suppliers)
        product_id = random.choice(products)
        uploaded_path = await file_manager.upload_quote_pdf(i, supplier_id, product_id)
        status = random.choices(status_choices, weights=status_weights)[0]
        submission_date = datetime.now() - timedelta(days=random.randint(0, 120))

        await db_manager.conn.execute(
            """INSERT INTO Quote (SupplierID, ProductID, PdfDocumentPath, Status, SubmissionDate) 
               VALUES ($1, $2, $3, $4, $5)""",
            supplier_id,
            product_id,
            uploaded_path,
            status,
            submission_date,
        )

    print(f"✓ Created {POPULATION_COUNTS['quotes']} quotes with PDF documents")


async def ensure_test_supplier_approved_quotes(db_manager, file_manager):
    """Ensure Test Supplier has approved quotes for at least 3 products"""
    print("Ensuring Test Supplier has approved quotes...")

    # Find Test Supplier ID
    test_supplier_id = await db_manager.conn.fetchval(
        'SELECT userid FROM "User" WHERE name = $1 AND role = $2',
        "Test Supplier",
        "Supplier",
    )

    if not test_supplier_id:
        print("Warning: Test Supplier not found, skipping approved quotes creation")
        return

    # Get first 3 products
    products = await db_manager.conn.fetch(
        "SELECT productid, name FROM product LIMIT 3"
    )

    if len(products) < 3:
        print("Warning: Not enough products found, skipping approved quotes creation")
        return

    # Check existing approved quotes for Test Supplier
    existing_quotes = await db_manager.conn.fetch(
        """SELECT productid FROM quote 
           WHERE supplierid = $1 AND status = 'Approved' 
           AND productid = ANY($2::int[])""",
        test_supplier_id,
        [p["productid"] for p in products],
    )

    existing_product_ids = [q["productid"] for q in existing_quotes]
    created_count = 0
    submission_date = datetime.now() - timedelta(days=7)  # Quote submitted a week ago

    # Create approved quotes for products that don't have them yet
    for product in products:
        product_id = product["productid"]

        if product_id not in existing_product_ids:
            # Upload a PDF for the quote
            uploaded_path = await file_manager.upload_quote_pdf(
                1000 + product_id, test_supplier_id, product_id
            )

            # Create the approved quote
            await db_manager.conn.execute(
                """INSERT INTO quote (supplierid, productid, pdfdocumentpath, status, submissiondate)
                   VALUES ($1, $2, $3, $4, $5)""",
                test_supplier_id,
                product_id,
                uploaded_path,
                "Approved",
                submission_date,
            )

            created_count += 1

    total_approved = len(existing_product_ids) + created_count
    print(
        f"✓ Test Supplier has {total_approved} approved quotes (created {created_count} new)"
    )


async def populate_product_records(db_manager, file_manager):
    """Populate ProductRecord table with realistic inventory distribution"""
    print("Populating product records...")

    suppliers = db_manager.get_user_ids("Supplier")
    warehouses = db_manager.get_warehouse_ids()
    products = db_manager.get_product_ids()
    quality_weights = [0.7, 0.2, 0.1]  # Good 70%, Sub-optimal 20%, Bad 10%
    status_weights = [
        0.60,  # InStock 60% (index 0) - Increased to compensate for order processing
        0.15,  # Sold 15% (index 1) - Reduced since orders will add more
        0.10,  # Discarded 10% (index 2) - Reduced since some will expire naturally
        0.15,  # Donated 15% (index 3) - Slightly reduced
    ]  # Initial distribution accounting for order processing and natural expiration
    # NOTE: Order must match STATUS_OPTIONS["product_record"] = ["InStock", "Sold", "Discarded", "Donated"]

    # Ensure each product appears in multiple warehouses for redistribution scenarios
    records_per_product = POPULATION_COUNTS["product_records"] // len(products)

    for product_id in products:
        # Each product gets distributed across several warehouses
        warehouses_for_product = random.sample(
            warehouses, k=min(len(warehouses), random.randint(3, 8))
        )

        for j in range(records_per_product):
            supplier_id = random.choice(suppliers)
            warehouse_id = random.choice(warehouses_for_product)

            quality = random.choices(QUALITY_OPTIONS, weights=quality_weights)[0]
            uploaded_path = file_manager.upload_product_record_image(j, quality)
            status = random.choices(
                STATUS_OPTIONS["product_record"], weights=status_weights
            )[0]

            # Create realistic demo-friendly inventory quantities
            if random.random() < 0.15:  # 15% chance of large inventory
                quantity = random.randint(500, 1500)    # 500-1500 kg
            elif random.random() < 0.25:  # 25% chance of medium inventory
                quantity = random.randint(200, 500)     # 200-500 kg
            elif random.random() < 0.4:  # 40% chance of small inventory
                quantity = random.randint(50, 200)      # 50-200 kg
            else:  # 20% chance of very small inventory
                quantity = random.randint(10, 50)       # 10-50 kg

            # Set registration date and sale date based on status to ensure logical consistency
            # With longer shelf life (30-180 days), we can have more realistic date ranges
            sale_date = None
            if status == "InStock":
                # Fresh products - registered recently but with variety (0-30 days old)
                registration_date = datetime.now() - timedelta(days=random.randint(0, 30))
            elif status == "Sold":
                # Sold products - registered longer ago, sold more recently
                registration_date = datetime.now() - timedelta(days=random.randint(7, 60))
                sale_date = registration_date + timedelta(days=random.randint(1, 30))
            elif status == "Donated":
                # Donated products - registered longer ago but still within shelf life
                registration_date = datetime.now() - timedelta(days=random.randint(30, 90))
            else:  # Discarded
                # Discarded products - older or bad quality, but not necessarily expired
                registration_date = datetime.now() - timedelta(days=random.randint(15, 60))

            await db_manager.conn.execute(
                """INSERT INTO productrecord (productid, supplierid, warehouseid, quantitykg, 
                   qualityclassification, status, imagepath, registrationdate, saledate) 
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)""",
                product_id,
                supplier_id,
                warehouse_id,
                quantity,
                quality,
                status,
                uploaded_path,
                registration_date,
                sale_date,
            )

    print(
        f"✓ Created {len(products) * records_per_product} product records distributed across warehouses"
    )


# ===============================
# TRANSACTIONAL ENTITIES
# ===============================


async def populate_orders(db_manager):
    """Populate Order and OrderItem tables with realistic historical data"""
    print("Populating orders and order items...")

    buyers = db_manager.get_user_ids("Buyer")
    records = await db_manager.conn.fetch(
        """SELECT pr.recordid, pr.productid, pr.quantitykg, p.baseprice, p.discountpercentage
           FROM productrecord pr JOIN product p ON pr.productid = p.productid
           WHERE pr.status = 'Sold'"""
    )
    record_pool = [dict(r) for r in records]

    # Create orders spanning last 12 months for better forecasting data
    for i in range(POPULATION_COUNTS["orders"]):
        if not buyers or not record_pool:
            break

        buyer_id = random.choice(buyers)
        order_statuses = ["Pending", "Confirmed", "InTransit", "Completed", "Cancelled"]
        # Increase completed orders percentage for more sales history
        order_weights = [0.1, 0.15, 0.1, 0.60, 0.05]
        status = random.choices(order_statuses, weights=order_weights)[0]

        # Generate orders over last 12 months instead of just 4 months
        order_date = datetime.now() - timedelta(days=random.randint(0, 365))

        order_id = await db_manager.conn.fetchval(
            """INSERT INTO "Order" (buyerid, orderdate, status, totalamount) 
               VALUES ($1, $2, $3, $4) RETURNING orderid""",
            buyer_id,
            order_date,
            status,
            0,
        )

        total_amount = 0
        # Increased max items per order from 5 to 15 for more realistic order sizes
        # Use weighted distribution to favor smaller orders but allow larger ones
        max_items = min(15, max(1, len(record_pool)))
        if max_items <= 3:
            num_items = random.randint(1, max_items)
        elif max_items <= 7:
            # For small pools, use simpler distribution
            num_items = random.randint(1, max_items)
        else:
            # Weighted towards smaller orders: 40% chance 1-3 items, 35% chance 4-7 items, 25% chance 8-max_items
            weights = [0.4, 0.35, 0.25]
            ranges = [(1, 3), (4, 7), (8, max_items)]
            # Filter out invalid ranges where start > end
            valid_ranges = [(start, end) for start, end in ranges if start <= end]
            if valid_ranges:
                selected_range = random.choices(
                    valid_ranges, weights=weights[: len(valid_ranges)]
                )[0]
                num_items = random.randint(selected_range[0], selected_range[1])
            else:
                # Fallback if no valid ranges
                num_items = random.randint(1, max_items)
        chosen_indexes = random.sample(range(len(record_pool)), k=num_items)

        for idx in sorted(chosen_indexes, reverse=True):
            record = record_pool[idx]
            base_price = record["baseprice"] or 200
            discount_pct = record["discountpercentage"] or 0
            market_multiplier = random.uniform(0.85, 1.15)
            effective_price = max(
                50, int(base_price * (1 - discount_pct / 100.0) * market_multiplier)
            )
            total_amount += effective_price

            await db_manager.conn.execute(
                """INSERT INTO orderitem (orderid, recordid, priceatpurchase) VALUES ($1, $2, $3)""",
                order_id,
                record["recordid"],
                effective_price,
            )

            # Records are already 'Sold' status, just update the sale date if needed
            if status in ("Completed", "InTransit", "Confirmed"):
                sale_date = order_date + timedelta(days=random.randint(0, 14))
                await db_manager.conn.execute(
                    "UPDATE productrecord SET saledate = $1 WHERE recordid = $2",
                    sale_date,
                    record["recordid"],
                )
            del record_pool[idx]

        await db_manager.conn.execute(
            'UPDATE "Order" SET totalamount = $1 WHERE orderid = $2',
            total_amount,
            order_id,
        )

    print(f"✓ Created up to {POPULATION_COUNTS['orders']} orders with order items")


async def populate_trips(db_manager):
    """Populate Trip table with multiple trips per driver and proper constraint handling"""
    print("Populating trips...")

    trucks = db_manager.get_truck_ids()
    orders = await db_manager.conn.fetch(
        "SELECT orderid FROM \"Order\" WHERE status IN ('Confirmed', 'InTransit')"
    )
    warehouses = db_manager.get_warehouse_ids()

    if not trucks or not warehouses:
        print("No trucks or warehouses available; skipping trips.")
        return

    # Get Test Driver's truck ID to ensure they get trips
    test_driver_truck_id = await db_manager.conn.fetchval(
        """SELECT t.truckid FROM truck t 
           JOIN "User" u ON t.truckdriverid = u.userid 
           WHERE u.contactinfo = $1 AND u.role = $2""",
        "driver@test.com",
        "TruckDriver",
    )

    # Active trip statuses (only one allowed per driver)
    active_statuses = ["Waiting", "Collecting", "Loaded", "Paused", "Delivering"]
    completed_status = "Delivered"

    # Track which drivers have active trips
    drivers_with_active_trips = set()

    # Calculate trips per driver (with some variation)
    base_trips_per_driver = POPULATION_COUNTS["trips"] // len(trucks)
    extra_trips = POPULATION_COUNTS["trips"] % len(trucks)

    total_created = 0

    for truck_idx, truck_id in enumerate(trucks):
        # Determine number of trips for this driver
        trips_for_driver = base_trips_per_driver
        if truck_idx < extra_trips:
            trips_for_driver += 1

        # Ensure Test Driver gets extra trips (at least 8)
        if truck_id == test_driver_truck_id:
            trips_for_driver = max(8, trips_for_driver)
            print(f"✓ Guaranteed {trips_for_driver} trips for Test Driver")

        # Ensure at least 1 trip per driver, max around 8-10
        trips_for_driver = max(1, min(trips_for_driver, 10))

        for trip_num in range(trips_for_driver):
            order_id = (
                orders[total_created % len(orders)]["orderid"] if orders else None
            )

            origin_warehouse = random.choice(warehouses)
            destination_warehouse = random.choice(
                [w for w in warehouses if w != origin_warehouse]
            )

            # Get warehouse locations
            origin_location = await db_manager.conn.fetchrow(
                "SELECT ST_X(location::geometry) as lng, ST_Y(location::geometry) as lat FROM warehouse WHERE warehouseid = $1",
                origin_warehouse,
            )
            dest_location = await db_manager.conn.fetchrow(
                "SELECT ST_X(location::geometry) as lng, ST_Y(location::geometry) as lat FROM warehouse WHERE warehouseid = $1",
                destination_warehouse,
            )

            # Determine status based on constraints
            # Give Test Driver a 50% chance to have an active trip
            if truck_id == test_driver_truck_id:
                if (
                    trip_num == 0
                    and truck_id not in drivers_with_active_trips
                    and random.random() < 0.5
                ):
                    status = random.choice(active_statuses)
                    drivers_with_active_trips.add(truck_id)
                else:
                    status = completed_status
            else:
                if (
                    trip_num == 0
                    and truck_id not in drivers_with_active_trips
                    and random.random() < 0.15
                ):
                    # First trip for driver, 15% chance to be active
                    status = random.choice(active_statuses)
                    drivers_with_active_trips.add(truck_id)
                else:
                    # All other trips must be completed
                    status = completed_status

            estimated_hours = random.randint(3, 18)
            actual_hours = max(1, int(random.gauss(mu=estimated_hours, sigma=2)))

            # Set dates based on status
            if status == completed_status:
                start_date = datetime.now() - timedelta(days=random.randint(1, 90))
                end_date = start_date + timedelta(hours=actual_hours)
            else:
                # Active trip - start date recent, no end date
                start_date = datetime.now() - timedelta(days=random.randint(0, 3))
                end_date = None

            await db_manager.conn.execute(
                """INSERT INTO trip (truckid, orderid, origin, destination, status, 
                   estimatedtime, actualtime, startdate, enddate) 
                   VALUES ($1, $2, ST_Point($3, $4), ST_Point($5, $6), $7, $8, $9, $10, $11)""",
                truck_id,
                order_id,
                origin_location["lng"],
                origin_location["lat"],
                dest_location["lng"],
                dest_location["lat"],
                status,
                timedelta(hours=estimated_hours),
                timedelta(hours=actual_hours),
                start_date,
                end_date,
            )

            total_created += 1

    print(f"✓ Created {total_created} trips across {len(trucks)} drivers")
    print(f"✓ {len(drivers_with_active_trips)} drivers have active trips")


async def populate_warehouse_transfers(db_manager):
    """Populate WarehouseTransfer table with multiple transfers per driver and proper constraint handling"""
    print("Populating warehouse transfers...")

    records = await db_manager.conn.fetch(
        f"SELECT recordid FROM productrecord WHERE status = 'InStock' LIMIT {POPULATION_COUNTS['warehouse_transfers'] * 2}"
    )
    record_pool = [r["recordid"] for r in records]
    trucks = db_manager.get_truck_ids()
    warehouses = db_manager.get_warehouse_ids()

    if not trucks or len(warehouses) < 2 or not record_pool:
        print("Insufficient data for transfers; skipping.")
        return

    # Get Test Driver's truck ID to ensure they get transfers
    test_driver_truck_id = await db_manager.conn.fetchval(
        """SELECT t.truckid FROM truck t 
           JOIN "User" u ON t.truckdriverid = u.userid 
           WHERE u.contactinfo = $1 AND u.role = $2""",
        "driver@test.com",
        "TruckDriver",
    )

    # Active transfer statuses (only one allowed per driver)
    active_statuses = ["Pending", "InTransit"]
    completed_statuses = ["Completed", "Cancelled"]

    # Check which drivers already have active trips (they cannot have active transfers)
    drivers_with_active_trips = await db_manager.conn.fetch(
        "SELECT DISTINCT truckid FROM trip WHERE status IN ('Waiting', 'Collecting', 'Loaded', 'Paused', 'Delivering')"
    )
    drivers_with_active_trips = {row["truckid"] for row in drivers_with_active_trips}

    # Track which drivers have active transfers
    drivers_with_active_transfers = set()

    # Calculate transfers per driver (with some variation)
    base_transfers_per_driver = POPULATION_COUNTS["warehouse_transfers"] // len(trucks)
    extra_transfers = POPULATION_COUNTS["warehouse_transfers"] % len(trucks)

    total_created = 0

    for truck_idx, truck_id in enumerate(trucks):
        # Determine number of transfers for this driver
        transfers_for_driver = base_transfers_per_driver
        if truck_idx < extra_transfers:
            transfers_for_driver += 1

        # Ensure Test Driver gets extra transfers (at least 6)
        if truck_id == test_driver_truck_id:
            transfers_for_driver = max(6, transfers_for_driver)
            print(f"✓ Guaranteed {transfers_for_driver} transfers for Test Driver")

        # Ensure at least 1 transfer per driver, max around 6-8
        transfers_for_driver = max(1, min(transfers_for_driver, 8))

        for transfer_num in range(transfers_for_driver):
            record_id = record_pool[total_created % len(record_pool)]
            origin_warehouse = random.choice(warehouses)
            dest_warehouse = random.choice(
                [w for w in warehouses if w != origin_warehouse]
            )

            # Determine status based on constraints
            can_have_active = (
                truck_id not in drivers_with_active_trips
                and truck_id not in drivers_with_active_transfers
            )

            # Special handling for Test Driver
            if truck_id == test_driver_truck_id:
                # Test Driver can only have active transfer if they don't have active trip
                if transfer_num == 0 and can_have_active and random.random() < 0.3:
                    status = random.choice(active_statuses)
                    drivers_with_active_transfers.add(truck_id)
                else:
                    status = random.choices(completed_statuses, weights=[0.9, 0.1])[0]
            else:
                if transfer_num == 0 and can_have_active and random.random() < 0.12:
                    # First transfer for driver, 12% chance to be active (only if no active trip)
                    status = random.choice(active_statuses)
                    drivers_with_active_transfers.add(truck_id)
                else:
                    # All other transfers must be completed/cancelled
                    status = random.choices(completed_statuses, weights=[0.9, 0.1])[0]

            reason = random.choice(TRANSFER_REASONS)
            notes = random.choice(SAMPLE_TRANSFER_NOTES)
            estimated_hours = random.randint(4, 16)
            actual_hours = max(2, int(random.gauss(mu=estimated_hours, sigma=2)))

            # Set dates based on status
            if status in completed_statuses:
                requested_date = datetime.now() - timedelta(days=random.randint(1, 120))
                start_date = requested_date + timedelta(hours=random.randint(12, 48))
                completed_date = (
                    start_date + timedelta(hours=actual_hours)
                    if status == "Completed"
                    else None
                )
            elif status == "InTransit":
                requested_date = datetime.now() - timedelta(days=random.randint(1, 7))
                start_date = requested_date + timedelta(hours=random.randint(12, 48))
                completed_date = None
            else:  # Pending
                requested_date = datetime.now() - timedelta(days=random.randint(0, 3))
                start_date = None
                completed_date = None

            await db_manager.conn.execute(
                """INSERT INTO warehousetransfer (recordid, truckid, originwarehouseid, 
                   destinationwarehouseid, status, reason, requesteddate, startdate, completeddate, 
                   estimatedtime, actualtime, notes) 
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)""",
                record_id,
                truck_id,
                origin_warehouse,
                dest_warehouse,
                status,
                reason,
                requested_date,
                start_date,
                completed_date,
                timedelta(hours=estimated_hours),
                timedelta(hours=actual_hours),
                notes,
            )

            total_created += 1

    print(f"✓ Created {total_created} warehouse transfers across {len(trucks)} drivers")
    print(f"✓ {len(drivers_with_active_trips)} drivers have active trips")
    print(f"✓ {len(drivers_with_active_transfers)} drivers have active transfers")
    print(f"✓ Constraint enforced: no driver has both active trip and active transfer")


# ===============================
# MAIN POPULATION ORCHESTRATOR
# ===============================


async def populate_all_entities(db_manager, file_manager):
    """Populate all entities in the correct order"""
    print("Starting complete database population...")

    # Load pre-generated locations first
    print("🌍 Loading pre-generated locations...")
    locations_loaded = load_locations_from_json("generated_locations.json")

    if not locations_loaded:
        print("❌ Failed to load pre-generated locations!")
        print("Please run the location generator script first:")
        print("  python generate_locations.py")
        return False

    # Display location metadata
    metadata = get_locations_metadata()
    print(f"📊 Location data: {metadata.get('total_generated', 0)} total locations")
    print(f"📊 Generated at: {metadata.get('generated_at', 'unknown')}")

    # Basic entities first (order matters due to foreign keys)
    await populate_users(db_manager)
    await populate_products(db_manager)
    await populate_warehouses(db_manager)
    await populate_trucks(db_manager)

    # File-based entities
    await populate_quotes(db_manager, file_manager)
    await ensure_test_supplier_approved_quotes(db_manager, file_manager)
    await populate_product_records(db_manager, file_manager)

    # Transactional entities
    await populate_orders(db_manager)
    await populate_trips(db_manager)
    await populate_warehouse_transfers(db_manager)

    print("✅ All entities populated successfully using pre-generated locations!")
    return True
