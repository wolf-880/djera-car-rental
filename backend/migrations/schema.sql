-- backend/migrations/schema.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (both clients and car shop owners)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('client', 'owner', 'admin')) DEFAULT 'client',
    preferred_language VARCHAR(5) DEFAULT 'en',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Car listings
CREATE TABLE cars (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    category VARCHAR(50) CHECK (category IN ('economy', 'sedan', 'suv', 'luxury', 'van', 'sports')),
    transmission VARCHAR(20) CHECK (transmission IN ('automatic', 'manual')),
    fuel_type VARCHAR(20) CHECK (fuel_type IN ('petrol', 'diesel', 'electric', 'hybrid')),
    seats INTEGER DEFAULT 5,
    doors INTEGER DEFAULT 4,
    daily_rate DECIMAL(10,2) NOT NULL,
    weekly_rate DECIMAL(10,2),
    monthly_rate DECIMAL(10,2),
    is_available BOOLEAN DEFAULT true,
    location_city VARCHAR(100) DEFAULT 'Tripoli',
    description TEXT,
    features JSONB DEFAULT '[]',
    image_urls JSONB DEFAULT '[]',
    license_plate VARCHAR(20),
    mileage INTEGER,
    color VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Car availability calendar (for date-specific blocking)
CREATE TABLE car_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    car_id UUID REFERENCES cars(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    is_available BOOLEAN DEFAULT true,
    UNIQUE(car_id, date)
);

-- Bookings
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    car_id UUID REFERENCES cars(id) ON DELETE CASCADE,
    client_id UUID REFERENCES users(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'bank_transfer', 'stripe')),
    payment_status VARCHAR(20) CHECK (payment_status IN ('pending', 'paid', 'confirmed', 'cancelled', 'refunded')) DEFAULT 'pending',
    booking_status VARCHAR(20) CHECK (booking_status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled')) DEFAULT 'pending',
    stripe_payment_id VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reviews
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    client_id UUID REFERENCES users(id) ON DELETE CASCADE,
    car_id UUID REFERENCES cars(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_cars_owner ON cars(owner_id);
CREATE INDEX idx_cars_available ON cars(is_available);
CREATE INDEX idx_cars_category ON cars(category);
CREATE INDEX idx_cars_location ON cars(location_city);
CREATE INDEX idx_bookings_client ON bookings(client_id);
CREATE INDEX idx_bookings_car ON bookings(car_id);
CREATE INDEX idx_bookings_dates ON bookings(start_date, end_date);
CREATE INDEX idx_car_availability_date ON car_availability(car_id, date);