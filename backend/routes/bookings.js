// backend/routes/bookings.js
const express = require('express');
const { query } = require('../config/db');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Create booking
router.post('/', auth, [
  body('car_id').notEmpty(),
  body('start_date').isISO8601(),
  body('end_date').isISO8601(),
  body('payment_method').isIn(['cash', 'bank_transfer', 'stripe'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { car_id, start_date, end_date, payment_method, notes } = req.body;

    // Check car availability
    const car = await query('SELECT * FROM cars WHERE id = $1 AND is_available = true', [car_id]);
    if (car.rows.length === 0) {
      return res.status(404).json({ error: 'Car not available' });
    }

    // Check date conflicts
    const conflict = await query(
      `SELECT id FROM bookings 
       WHERE car_id = $1 
       AND booking_status NOT IN ('cancelled', 'completed')
       AND ((start_date <= $2 AND end_date >= $2) 
         OR (start_date <= $3 AND end_date >= $3)
         OR (start_date >= $2 AND end_date <= $3))`,
      [car_id, start_date, end_date]
    );

    if (conflict.rows.length > 0) {
      return res.status(409).json({ error: 'Car is already booked for these dates' });
    }

    // Calculate total
    const days = Math.ceil((new Date(end_date) - new Date(start_date)) / (1000 * 60 * 60 * 24));
    const dailyRate = car.rows[0].daily_rate;
    
    let totalAmount = days * dailyRate;
    // Apply weekly discount if applicable
    if (days >= 7 && car.rows[0].weekly_rate) {
      const weeks = Math.floor(days / 7);
      const remainingDays = days % 7;
      totalAmount = weeks * car.rows[0].weekly_rate + remainingDays * dailyRate;
    }

    const result = await query(
      `INSERT INTO bookings (car_id, client_id, start_date, end_date, total_amount, payment_method, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [car_id, req.user.id, start_date, end_date, totalAmount, payment_method, notes]
    );

    res.status(201).json({ 
      booking: result.rows[0],
      message: 'Booking created successfully. Please complete payment to confirm.'
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's bookings
router.get('/', auth, async (req, res) => {
  try {
    let queryText = `
      SELECT b.*, c.brand, c.model, c.year, c.image_urls, c.daily_rate,
             u.full_name as owner_name
      FROM bookings b
      JOIN cars c ON b.car_id = c.id
      JOIN users u ON c.owner_id = u.id
    `;

    if (req.user.role === 'owner') {
      queryText += ` WHERE c.owner_id = $1`;
    } else {
      queryText += ` WHERE b.client_id = $1`;
    }
    
    queryText += ` ORDER BY b.created_at DESC`;

    const result = await query(queryText, [req.user.id]);
    res.json({ bookings: result.rows });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update booking status (owner/admin)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { booking_status } = req.body;
    const validStatuses = ['confirmed', 'active', 'completed', 'cancelled'];

    if (!validStatuses.includes(booking_status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const booking = await query(
      `SELECT b.*, c.owner_id FROM bookings b 
       JOIN cars c ON b.car_id = c.id 
       WHERE b.id = $1`,
      [req.params.id]
    );

    if (booking.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.rows[0].owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const result = await query(
      `UPDATE bookings SET booking_status = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 RETURNING *`,
      [booking_status, req.params.id]
    );

    res.json({ booking: result.rows[0] });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;