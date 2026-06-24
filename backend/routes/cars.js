// backend/routes/cars.js
const express = require('express');
const { query } = require('../config/db');
const auth = require('../middleware/auth');
const { body, query: queryValidator, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Multer config for car images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/cars');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (jpeg, jpg, png, webp) are allowed'));
    }
  }
});

// Get all cars with filters
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      transmission, 
      fuel_type, 
      min_price, 
      max_price,
      location,
      brand,
      search,
      page = 1,
      limit = 12
    } = req.query;

    let queryText = `
      SELECT c.*, u.full_name as owner_name, u.phone as owner_phone,
             COALESCE(AVG(r.rating), 0) as average_rating,
             COUNT(r.id) as review_count
      FROM cars c
      LEFT JOIN users u ON c.owner_id = u.id
      LEFT JOIN reviews r ON c.id = r.car_id
      WHERE c.is_available = true
    `;

    const params = [];
    let paramCount = 0;

    if (category) {
      paramCount++;
      queryText += ` AND c.category = $${paramCount}`;
      params.push(category);
    }
    if (transmission) {
      paramCount++;
      queryText += ` AND c.transmission = $${paramCount}`;
      params.push(transmission);
    }
    if (fuel_type) {
      paramCount++;
      queryText += ` AND c.fuel_type = $${paramCount}`;
      params.push(fuel_type);
    }
    if (min_price) {
      paramCount++;
      queryText += ` AND c.daily_rate >= $${paramCount}`;
      params.push(min_price);
    }
    if (max_price) {
      paramCount++;
      queryText += ` AND c.daily_rate <= $${paramCount}`;
      params.push(max_price);
    }
    if (location) {
      paramCount++;
      queryText += ` AND c.location_city ILIKE $${paramCount}`;
      params.push(`%${location}%`);
    }
    if (brand) {
      paramCount++;
      queryText += ` AND c.brand ILIKE $${paramCount}`;
      params.push(`%${brand}%`);
    }
    if (search) {
      paramCount++;
      queryText += ` AND (c.brand ILIKE $${paramCount} OR c.model ILIKE $${paramCount} OR c.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    queryText += ` GROUP BY c.id, u.full_name, u.phone`;

    // Count total
    const countResult = await query(
      `SELECT COUNT(*) FROM (${queryText}) as filtered_cars`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Add pagination
    const offset = (page - 1) * limit;
    paramCount++;
    queryText += ` ORDER BY c.created_at DESC LIMIT $${paramCount}`;
    params.push(limit);
    paramCount++;
    queryText += ` OFFSET $${paramCount}`;
    params.push(offset);

    const result = await query(queryText, params);

    res.json({
      cars: result.rows,
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

// Get single car
router.get('/:id', async (req, res) => {
  try {
    const result = await query(
      `SELECT c.*, u.full_name as owner_name, u.phone as owner_phone, u.email as owner_email,
              COALESCE(AVG(r.rating), 0) as average_rating,
              COUNT(r.id) as review_count
       FROM cars c
       LEFT JOIN users u ON c.owner_id = u.id
       LEFT JOIN reviews r ON c.id = r.car_id
       WHERE c.id = $1
       GROUP BY c.id, u.full_name, u.phone, u.email`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Car not found' });
    }

    res.json({ car: result.rows[0] });
  } catch (error) {
    console.error('Get car error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create car (owners only)
router.post('/', auth, upload.array('images', 5), [
  body('brand').notEmpty(),
  body('model').notEmpty(),
  body('year').isInt({ min: 2000, max: 2026 }),
  body('category').isIn(['economy', 'sedan', 'suv', 'luxury', 'van', 'sports']),
  body('daily_rate').isFloat({ min: 0 })
], async (req, res) => {
  try {
    if (req.user.role !== 'owner' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only car owners can create listings' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const imageUrls = req.files ? req.files.map(f => `/uploads/cars/${f.filename}`) : [];
    
    const {
      brand, model, year, category, transmission, fuel_type,
      seats, doors, daily_rate, weekly_rate, monthly_rate,
      location_city, description, features, license_plate, mileage, color
    } = req.body;

    const result = await query(
      `INSERT INTO cars (
        owner_id, brand, model, year, category, transmission, fuel_type,
        seats, doors, daily_rate, weekly_rate, monthly_rate,
        location_city, description, features, image_urls,
        license_plate, mileage, color
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
      RETURNING *`,
      [
        req.user.id, brand, model, year, category, transmission, fuel_type,
        seats || 5, doors || 4, daily_rate, weekly_rate, monthly_rate,
        location_city || 'Tripoli', description, JSON.stringify(features || []),
        JSON.stringify(imageUrls), license_plate, mileage, color
      ]
    );

    res.status(201).json({ car: result.rows[0] });
  } catch (error) {
    console.error('Create car error:', error);
    res.status(500).json({ error: 'Server error creating car' });
  }
});

// Update car
router.put('/:id', auth, upload.array('images', 5), async (req, res) => {
  try {
    // Check ownership
    const carResult = await query('SELECT * FROM cars WHERE id = $1', [req.params.id]);
    if (carResult.rows.length === 0) {
      return res.status(404).json({ error: 'Car not found' });
    }
    if (carResult.rows[0].owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const newImageUrls = req.files ? req.files.map(f => `/uploads/cars/${f.filename}`) : [];
    const existingImages = carResult.rows[0].image_urls || [];
    const allImages = [...existingImages, ...newImageUrls];

    const {
      brand, model, year, category, transmission, fuel_type,
      seats, doors, daily_rate, weekly_rate, monthly_rate,
      location_city, description, features, is_available
    } = req.body;

    const result = await query(
      `UPDATE cars SET
        brand = COALESCE($1, brand),
        model = COALESCE($2, model),
        year = COALESCE($3, year),
        category = COALESCE($4, category),
        transmission = COALESCE($5, transmission),
        fuel_type = COALESCE($6, fuel_type),
        seats = COALESCE($7, seats),
        doors = COALESCE($8, doors),
        daily_rate = COALESCE($9, daily_rate),
        weekly_rate = COALESCE($10, weekly_rate),
        monthly_rate = COALESCE($11, monthly_rate),
        location_city = COALESCE($12, location_city),
        description = COALESCE($13, description),
        features = COALESCE($14, features),
        image_urls = $15,
        is_available = COALESCE($16, is_available),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $17
      RETURNING *`,
      [
        brand, model, year, category, transmission, fuel_type,
        seats, doors, daily_rate, weekly_rate, monthly_rate,
        location_city, description, 
        features ? JSON.stringify(features) : null,
        JSON.stringify(allImages),
        is_available,
        req.params.id
      ]
    );

    res.json({ car: result.rows[0] });
  } catch (error) {
    console.error('Update car error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete car
router.delete('/:id', auth, async (req, res) => {
  try {
    const carResult = await query('SELECT * FROM cars WHERE id = $1', [req.params.id]);
    if (carResult.rows.length === 0) {
      return res.status(404).json({ error: 'Car not found' });
    }
    if (carResult.rows[0].owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await query('DELETE FROM cars WHERE id = $1', [req.params.id]);
    res.json({ message: 'Car deleted successfully' });
  } catch (error) {
    console.error('Delete car error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;