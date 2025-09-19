-- Enable PostGIS extension (needed for geography types)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Drop tables in reverse order to avoid dependency issues
DROP TABLE IF EXISTS OrderItem CASCADE;
DROP TABLE IF EXISTS WarehouseTransfer CASCADE;
DROP TABLE IF EXISTS Trip CASCADE;
DROP TABLE IF EXISTS Quote CASCADE;
DROP TABLE IF EXISTS ProductRecord CASCADE;
DROP TABLE IF EXISTS Product CASCADE;
DROP TABLE IF EXISTS Warehouse CASCADE;
DROP TABLE IF EXISTS "Order" CASCADE;
DROP TABLE IF EXISTS Truck CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- ==========================
-- User Table
-- ==========================
CREATE TABLE "User" (
    UserID SERIAL PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    ContactInfo TEXT,
    Location GEOGRAPHY(Point, 4326), -- geography(Point, 4326) is the best choice → it stores lat/long in WGS84 and supports distance calculations in meters out-of-the-box.
    Address TEXT,
    PasswordString TEXT NOT NULL,
    Role VARCHAR(20) CHECK (Role IN ('Administrator','Supplier','Buyer','TruckDriver')) NOT NULL
);

-- ==========================
-- Truck Table
-- ==========================
CREATE TABLE Truck (
    TruckID SERIAL PRIMARY KEY,
    TruckDriverID INT REFERENCES "User"(UserID) ON DELETE SET NULL,
    CurrentLocation GEOGRAPHY(Point, 4326),
    Status VARCHAR(20) CHECK (Status IN ('Available','InService')) NOT NULL,
    Type VARCHAR(20) CHECK (Type IN ('Refrigerated','Normal')) NOT NULL,
    LoadCapacityKg INTEGER
);

-- ==========================
-- Order Table
-- ==========================
CREATE TABLE "Order" (
    OrderID SERIAL PRIMARY KEY,
    BuyerID INT REFERENCES "User"(UserID) ON DELETE SET NULL,
    OrderDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Status VARCHAR(20) CHECK (Status IN ('Pending','Confirmed','InTransit','Completed','Cancelled')) NOT NULL,
    TotalAmount INTEGER
);

-- ==========================
-- Trip Table
-- ==========================
CREATE TABLE Trip (
    TripID SERIAL PRIMARY KEY,
    TruckID INT REFERENCES Truck(TruckID) ON DELETE SET NULL,
    OrderID INT REFERENCES "Order"(OrderID) ON DELETE SET NULL,
    Origin GEOGRAPHY(Point, 4326),
    Destination GEOGRAPHY(Point, 4326),
    Status VARCHAR(20) CHECK (Status IN ('Waiting','Collecting','Loaded','Paused','Delivering','Delivered')) NOT NULL,
    EstimatedTime INTERVAL,
    ActualTime INTERVAL,
    StartDate TIMESTAMP,
    EndDate TIMESTAMP
);

-- ==========================
-- Product Table
-- ==========================
CREATE TABLE Product (
    ProductID SERIAL PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    BasePrice INTEGER,
    DiscountPercentage INTEGER,
    RequiresRefrigeration BOOLEAN DEFAULT FALSE,
    ShelfLifeDays INT,
    DeadlineToDiscount INTEGER
);

-- ==========================
-- Warehouse Table
-- ==========================
CREATE TABLE Warehouse (
    WarehouseID SERIAL PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Location GEOGRAPHY(Point, 4326),
    Address TEXT,
    NormalCapacityKg INTEGER,
    RefrigeratedCapacityKg INTEGER
);

-- ==========================
-- ProductRecord Table
-- ==========================
CREATE TABLE ProductRecord (
    RecordID SERIAL PRIMARY KEY,
    ProductID INT REFERENCES Product(ProductID) ON DELETE CASCADE,
    SupplierID INT REFERENCES "User"(UserID) ON DELETE SET NULL,
    WarehouseID INT REFERENCES Warehouse(WarehouseID) ON DELETE SET NULL,
    QuantityKg INTEGER,
    QualityClassification VARCHAR(20) CHECK (QualityClassification IN ('Good','Sub-optimal','Bad')),
    Status VARCHAR(20) CHECK (Status IN ('InStock','Sold','Discarded','Donated')) NOT NULL,
    ImagePath TEXT,
    RegistrationDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    SaleDate TIMESTAMP
);

-- ==========================
-- Quote Table
-- ==========================
CREATE TABLE Quote (
    QuoteID SERIAL PRIMARY KEY,
    SupplierID INT REFERENCES "User"(UserID) ON DELETE SET NULL,
    ProductID INT REFERENCES Product(ProductID) ON DELETE SET NULL,
    PdfDocumentPath TEXT,
    Status VARCHAR(20) CHECK (Status IN ('Pending','Approved','Rejected')) NOT NULL,
    SubmissionDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================
-- OrderItem Table
-- ==========================
CREATE TABLE OrderItem (
    OrderItemID SERIAL PRIMARY KEY,
    OrderID INT REFERENCES "Order"(OrderID) ON DELETE CASCADE,
    RecordID INT REFERENCES ProductRecord(RecordID) ON DELETE SET NULL,
    PriceAtPurchase INTEGER
);

-- ==========================
-- WarehouseTransfer Table
-- ==========================
CREATE TABLE WarehouseTransfer (
    TransferID SERIAL PRIMARY KEY,
    RecordID INT REFERENCES ProductRecord(RecordID) ON DELETE SET NULL,
    TruckID INT REFERENCES Truck(TruckID) ON DELETE SET NULL,
    OriginWarehouseID INT REFERENCES Warehouse(WarehouseID) ON DELETE SET NULL,
    DestinationWarehouseID INT REFERENCES Warehouse(WarehouseID) ON DELETE SET NULL,
    Status VARCHAR(20) CHECK (Status IN ('Pending','InTransit','Completed','Cancelled')) NOT NULL,
    Reason VARCHAR(20) CHECK (Reason IN ('Restock','Redistribution','Emergency','Optimization')),
    RequestedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    StartDate TIMESTAMP,
    CompletedDate TIMESTAMP,
    EstimatedTime INTERVAL,
    ActualTime INTERVAL,
    Notes VARCHAR(500)
);

-- ==========================
-- TRIGGERS FOR AUTOMATIC PRODUCT RECORD MANAGEMENT
-- ==========================

-- Function to handle bad quality products
CREATE OR REPLACE FUNCTION handle_bad_quality_products()
RETURNS TRIGGER AS $$
BEGIN
    -- If quality classification is set to 'Bad', automatically discard and clear warehouse
    IF NEW.QualityClassification = 'Bad' THEN
        NEW.Status = 'Discarded';
        NEW.WarehouseID = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for handling bad quality products on INSERT and UPDATE
CREATE TRIGGER trigger_handle_bad_quality
    BEFORE INSERT OR UPDATE ON ProductRecord
    FOR EACH ROW
    EXECUTE FUNCTION handle_bad_quality_products();

-- Function to check for expired products
CREATE OR REPLACE FUNCTION check_expired_products()
RETURNS TRIGGER AS $$
DECLARE
    shelf_life_days INTEGER;
    expiration_date TIMESTAMP;
BEGIN
    -- Get the shelf life for this product
    SELECT ShelfLifeDays INTO shelf_life_days
    FROM Product 
    WHERE ProductID = NEW.ProductID;
    
    -- Calculate expiration date
    IF shelf_life_days IS NOT NULL AND NEW.RegistrationDate IS NOT NULL THEN
        expiration_date := NEW.RegistrationDate + (shelf_life_days || ' days')::INTERVAL;
        
        -- If product is expired, mark as bad and discarded
        IF expiration_date <= CURRENT_TIMESTAMP THEN
            NEW.QualityClassification = 'Bad';
            NEW.Status = 'Discarded';
            NEW.WarehouseID = NULL;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for checking expired products on INSERT and UPDATE
CREATE TRIGGER trigger_check_expired_products
    BEFORE INSERT OR UPDATE ON ProductRecord
    FOR EACH ROW
    EXECUTE FUNCTION check_expired_products();

-- Function to periodically check for expired products (can be called by a scheduled job)
CREATE OR REPLACE FUNCTION expire_old_products()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    WITH expired_products AS (
        SELECT pr.RecordID
        FROM ProductRecord pr
        JOIN Product p ON pr.ProductID = p.ProductID
        WHERE pr.Status != 'Discarded'
          AND pr.RegistrationDate IS NOT NULL
          AND p.ShelfLifeDays IS NOT NULL
          AND (pr.RegistrationDate + (p.ShelfLifeDays || ' days')::INTERVAL) <= CURRENT_TIMESTAMP
    )
    UPDATE ProductRecord 
    SET QualityClassification = 'Bad',
        Status = 'Discarded',
        WarehouseID = NULL
    WHERE RecordID IN (SELECT RecordID FROM expired_products);
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;