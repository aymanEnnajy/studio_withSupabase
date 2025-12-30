-- Supabase (PostgreSQL) Schema

-- Drop tables if they exist (Be careful with this in production!)
DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS scraped_studios CASCADE;
DROP TABLE IF EXISTS studios CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('user', 'admin')) DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Studios Table
CREATE TABLE studios (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    services TEXT NOT NULL,
    price_per_hour DECIMAL(10,2) NOT NULL,
    city TEXT NOT NULL,
    equipments TEXT,
    status TEXT CHECK(status IN ('available', 'reserved')) DEFAULT 'available',
    image TEXT,
    description TEXT,
    reserved_until DATE,
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Favorites Table
CREATE TABLE favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    studio_id INTEGER NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, studio_id)
);

-- Bookings Table
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    item_id INTEGER NOT NULL REFERENCES studios(id),
    date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Reviews Table
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    studio_id INTEGER NOT NULL REFERENCES studios(id),
    rating INTEGER CHECK(rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Scraped Studios Table
CREATE TABLE scraped_studios (
    id SERIAL PRIMARY KEY,
    name TEXT,
    city TEXT,
    rating DECIMAL(2,1),
    address TEXT,
    source TEXT DEFAULT 'Google Maps',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS for all tables (Standard security practice)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraped_studios ENABLE ROW LEVEL SECURITY;

-- Note: Since we are using a Service Role key in the Cloudflare Worker 
-- to maintain existing JWT logic, we can keep policies simple or bypass RLS.
-- However, for future direct-client access, you should define granular policies.

CREATE POLICY "Allow all for authenticated worker" ON users FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated worker" ON studios FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated worker" ON favorites FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated worker" ON bookings FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated worker" ON reviews FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated worker" ON scraped_studios FOR ALL USING (true);
