// backend/config/migrate.js
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

async function runMigration() {
    console.log('Connecting to database and starting migration...');
    try {
        // 1. Create Extension
        await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

        // 2. Create Tables
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
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

            CREATE TABLE IF NOT EXISTS cars (
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

            CREATE TABLE IF NOT EXISTS car_availability (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                car_id UUID REFERENCES cars(id) ON DELETE CASCADE,
                date DATE NOT NULL,
                is_available BOOLEAN DEFAULT true,
                UNIQUE(car_id, date)
            );

            CREATE TABLE IF NOT EXISTS bookings (
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

            CREATE TABLE IF NOT EXISTS reviews (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
                client_id UUID REFERENCES users(id) ON DELETE CASCADE,
                car_id UUID REFERENCES cars(id) ON DELETE CASCADE,
                rating INTEGER CHECK (rating BETWEEN 1 AND 5),
                comment TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Tables created successfully!');

        // 3. Create Indexes
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_cars_owner ON cars(owner_id);
            CREATE INDEX IF NOT EXISTS idx_cars_available ON cars(is_available);
            CREATE INDEX IF NOT EXISTS idx_cars_category ON cars(category);
            CREATE INDEX IF NOT EXISTS idx_cars_location ON cars(location_city);
            CREATE INDEX IF NOT EXISTS idx_bookings_client ON bookings(client_id);
            CREATE INDEX IF NOT EXISTS idx_bookings_car ON bookings(car_id);
            CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(start_date, end_date);
            CREATE INDEX IF NOT EXISTS idx_car_availability_date ON car_availability(car_id, date);
        `);
        console.log('✅ Indexes created successfully!');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        await pool.end();
    }
}

runMigration();