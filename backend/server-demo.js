// backend/server-demo.js
// Demo server with in-memory database (no PostgreSQL required)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;

// ===== IN-MEMORY DATABASE =====
const db = {
  users: [],
  cars: [
    {
      id: uuidv4(),
      owner_id: 'demo-owner-1',
      brand: 'Toyota',
      model: 'Camry',
      year: 2022,
      category: 'sedan',
      transmission: 'automatic',
      fuel_type: 'petrol',
      seats: 5,
      doors: 4,
      daily_rate: 120,
      weekly_rate: 800,
      monthly_rate: 2800,
      is_available: true,
      location_city: 'Tripoli',
      description: 'Well-maintained Toyota Camry with AC and GPS',
      features: ['AC', 'GPS', 'USB', 'Bluetooth'],
      image_urls: ['https://via.placeholder.com/400x300?text=Toyota+Camry'],
      license_plate: 'TRP-001',
      mileage: 45000,
      color: 'White',
      average_rating: 4.8,
      review_count: 25,
      created_at: new Date(),
      updated_at: new Date(),
      owner_name: 'Ahmed Ali',
      owner_phone: '+218913583812'
    },
    {
      id: uuidv4(),
      owner_id: 'demo-owner-2',
      brand: 'Honda',
      model: 'Civic',
      year: 2021,
      category: 'sedan',
      transmission: 'automatic',
      fuel_type: 'petrol',
      seats: 5,
      doors: 4,
      daily_rate: 100,
      weekly_rate: 700,
      monthly_rate: 2500,
      is_available: true,
      location_city: 'Benghazi',
      description: 'Fuel-efficient Honda Civic, perfect for city driving',
      features: ['AC', 'Power Steering', 'ABS'],
      image_urls: ['https://via.placeholder.com/400x300?text=Honda+Civic'],
      license_plate: 'BNG-002',
      mileage: 32000,
      color: 'Silver',
      average_rating: 4.6,
      review_count: 18,
      created_at: new Date(),
      updated_at: new Date(),
      owner_name: 'Fatima Mohamed',
      owner_phone: '+218921234567'
    },
    {
      id: uuidv4(),
      owner_id: 'demo-owner-3',
      brand: 'Nissan',
      model: 'Patrol',
      year: 2023,
      category: 'suv',
      transmission: 'automatic',
      fuel_type: 'diesel',
      seats: 7,
      doors: 4,
      daily_rate: 200,
      weekly_rate: 1400,
      monthly_rate: 5000,
      is_available: true,
      location_city: 'Tripoli',
      description: 'Luxury SUV with all modern features. Perfect for families',
      features: ['AC', 'GPS', 'Sunroof', 'Leather Seats', 'Camera'],
      image_urls: ['https://via.placeholder.com/400x300?text=Nissan+Patrol'],
      license_plate: 'TRP-003',
      mileage: 15000,
      color: 'Black',
      average_rating: 4.9,
      review_count: 32,
      created_at: new Date(),
      updated_at: new Date(),
      owner_name: 'Khalid Hassan',
      owner_phone: '+218933333333'
    },
    {
      id: uuidv4(),
      owner_id: 'demo-owner-4',
      brand: 'Hyundai',
      model: 'Elantra',
      year: 2022,
      category: 'economy',
      transmission: 'automatic',
      fuel_type: 'petrol',
      seats: 5,
      doors: 4,
      daily_rate: 80,
      weekly_rate: 560,
      monthly_rate: 2000,
      is_available: true,
      location_city: 'Misrata',
      description: 'Budget-friendly economy car, great for short trips',
      features: ['AC', 'Power Windows'],
      image_urls: ['https://via.placeholder.com/400x300?text=Hyundai+Elantra'],
      license_plate: 'MIS-004',
      mileage: 28000,
      color: 'Red',
      average_rating: 4.4,
      review_count: 15,
      created_at: new Date(),
      updated_at: new Date(),
      owner_name: 'Layla Ibrahim',
      owner_phone: '+218944444444'
    }
  ],
  bookings: [],
  reviews: []
};

// ===== MIDDLEWARE =====
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===== JWT HELPER =====
const JWT_SECRET = process.env.JWT_SECRET || 'demo_jwt_secret_key_for_testing_only';

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

const authMiddleware = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ===== AUTH ROUTES =====
app.post('/api/auth/register', async (req, res) => {
  try {
    const { full_name, email, password, phone, role } = req.body;

    // Validation
    if (!full_name || !email || !password || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user exists
    if (db.users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create user
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const user = {
      id: uuidv4(),
      full_name,
      email,
      phone,
      password_hash,
      role,
      preferred_language: 'en',
      created_at: new Date()
    };

    db.users.push(user);

    const token = generateToken(user);

    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = db.users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

app.get('/api/auth/profile', authMiddleware, (req, res) => {
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({
    user: {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      preferred_language: user.preferred_language
    }
  });
});

// ===== CAR ROUTES =====
app.get('/api/cars', (req, res) => {
  try {
    const { category, location, min_price, max_price, page = 1, limit = 12 } = req.query;

    let filtered = [...db.cars];

    if (category) {
      filtered = filtered.filter(c => c.category === category);
    }
    if (location) {
      filtered = filtered.filter(c => c.location_city.toLowerCase().includes(location.toLowerCase()));
    }
    if (min_price) {
      filtered = filtered.filter(c => c.daily_rate >= parseFloat(min_price));
    }
    if (max_price) {
      filtered = filtered.filter(c => c.daily_rate <= parseFloat(max_price));
    }

    const total = filtered.length;
    const start = (page - 1) * limit;
    const paginatedCars = filtered.slice(start, start + parseInt(limit));

    res.json({
      cars: paginatedCars,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get cars error:', error);
    res.status(500).json({ error: 'Server error fetching cars' });
  }
});

app.get('/api/cars/:id', (req, res) => {
  try {
    const car = db.cars.find(c => c.id === req.params.id);
    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }
    res.json({ car });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ===== BOOKING ROUTES =====
app.post('/api/bookings', authMiddleware, (req, res) => {
  try {
    const { car_id, start_date, end_date, payment_method } = req.body;

    const car = db.cars.find(c => c.id === car_id);
    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }

    // Check for conflicts
    const conflict = db.bookings.some(b =>
      b.car_id === car_id &&
      b.booking_status !== 'cancelled' &&
      ((new Date(b.start_date) <= new Date(start_date) && new Date(b.end_date) >= new Date(start_date)) ||
        (new Date(b.start_date) <= new Date(end_date) && new Date(b.end_date) >= new Date(end_date)))
    );

    if (conflict) {
      return res.status(409).json({ error: 'Car is already booked for these dates' });
    }

    const days = Math.ceil((new Date(end_date) - new Date(start_date)) / (1000 * 60 * 60 * 24));
    const totalAmount = days * car.daily_rate;

    const booking = {
      id: uuidv4(),
      car_id,
      client_id: req.user.id,
      start_date,
      end_date,
      total_amount: totalAmount,
      payment_method,
      payment_status: 'pending',
      booking_status: 'pending',
      created_at: new Date()
    };

    db.bookings.push(booking);

    res.status(201).json({
      booking,
      message: 'Booking created successfully. Please complete payment to confirm.'
    });
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/bookings', authMiddleware, (req, res) => {
  try {
    const userBookings = db.bookings.filter(b => b.client_id === req.user.id);
    const bookingsWithCars = userBookings.map(b => {
      const car = db.cars.find(c => c.id === b.car_id);
      return {
        ...b,
        brand: car?.brand,
        model: car?.model,
        year: car?.year,
        image_urls: car?.image_urls,
        daily_rate: car?.daily_rate,
        owner_name: car?.owner_name
      };
    });
    res.json({ bookings: bookingsWithCars });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ===== PAYMENT ROUTES =====
app.post('/api/payments/stripe/create-intent', authMiddleware, (req, res) => {
  try {
    const { booking_id } = req.body;
    const booking = db.bookings.find(b => b.id === booking_id && b.client_id === req.user.id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({
      clientSecret: 'demo_secret_' + booking_id,
      paymentIntentId: 'demo_pi_' + booking_id
    });
  } catch (error) {
    res.status(500).json({ error: 'Payment processing error' });
  }
});

app.post('/api/payments/confirm', authMiddleware, (req, res) => {
  try {
    const { booking_id, payment_method } = req.body;
    const booking = db.bookings.find(b => b.id === booking_id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    booking.payment_status = 'paid';
    booking.payment_method = payment_method || booking.payment_method;
    booking.booking_status = 'confirmed';

    res.json({ message: 'Payment confirmed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ===== HEALTH CHECK =====
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), mode: 'demo' });
});

// ===== ERROR HANDLING =====
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// ===== START SERVER =====
app.listen(5500, () => {
  console.log(`\n🚗 Djera API Demo Server running on port ${5500}`);
  console.log(`📍 Mode: Demo (In-Memory Database)`);
  console.log(`🔗 Frontend: http://localhost:3000`);
  console.log(`📚 API: http://localhost:5500/api`);
  console.log(`✅ Health: http://localhost:5500/api/health\n`);
});

module.exports = app;
