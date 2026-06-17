-- PostgreSQL Database Initialization Script
-- Target Schema: MILK COOPERATIVE MANAGEMENT SYSTEM

-- 1. Create Cooperatives Table
CREATE TABLE cooperatives (
    cooperative_id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    base_rate_per_liter NUMERIC(6, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create System Users Table (System Admins and Cooperative Managers)
CREATE TABLE users (
    user_id BIGSERIAL PRIMARY KEY,
    cooperative_id BIGINT REFERENCES cooperatives(cooperative_id) ON DELETE RESTRICT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_user_role CHECK (role IN ('ADMIN', 'MANAGER'))
);

-- 3. Create Farmers Table
CREATE TABLE farmers (
    farmer_id BIGSERIAL PRIMARY KEY,
    cooperative_id BIGINT REFERENCES cooperatives(cooperative_id) ON DELETE RESTRICT,
    farmer_number VARCHAR(30) NOT NULL UNIQUE, -- Farmer's unique username credential
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(15) NOT NULL, -- Target contact used for SMS pushes
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create Milk Deliveries Table
CREATE TABLE milk_deliveries (
    delivery_id BIGSERIAL PRIMARY KEY,
    farmer_id BIGINT NOT NULL REFERENCES farmers(farmer_id) ON DELETE RESTRICT,
    recorded_by_user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    quantity_liters NUMERIC(5, 2) NOT NULL,
    delivery_date DATE NOT NULL,
    verification_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    verified_by_user_id BIGINT REFERENCES users(user_id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_quantity CHECK (quantity_liters > 0.00),
    CONSTRAINT chk_verification_status CHECK (verification_status IN ('PENDING', 'VERIFIED'))
);

-- 5. Create Payments Table
CREATE TABLE payments (
    payment_id BIGSERIAL PRIMARY KEY,
    farmer_id BIGINT NOT NULL REFERENCES farmers(farmer_id) ON DELETE RESTRICT,
    billing_period_month INT NOT NULL,
    billing_period_year INT NOT NULL,
    total_liters NUMERIC(7, 2) NOT NULL,
    calculated_payout NUMERIC(10, 2) NOT NULL,
    is_settled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_month CHECK (billing_period_month BETWEEN 1 AND 12),
    CONSTRAINT chk_payout CHECK (calculated_payout >= 0.00)
);

-- Strategic Performance Indices for Fast Queries and Report Generation
CREATE INDEX idx_deliveries_farmer ON milk_deliveries(farmer_id);
CREATE INDEX idx_deliveries_date ON milk_deliveries(delivery_date);
CREATE INDEX idx_payments_farmer_period ON payments(farmer_id, billing_period_year, billing_period_month);