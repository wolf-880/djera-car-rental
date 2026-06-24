// backend/routes/reviews.js
const express = require('express');
const { query } = require('../config/db');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Add review
router.post('/', auth, [
  body('booking_id').notEmpty(),
  body('car_id').notEmpty(),
  body('rating').isInt({ min: 1, max: 5 }),
  body('comment').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { booking_id, car_id, rating, comment } = req.body;

    // Verify booking belongs to user
    const booking = await query(
      'SELECT * FROM bookings WHERE id = $1 AND client_id = $2 AND booking_status = $3',
      [booking_id, req.user.id, 'completed']
    );

    if (booking.rows.length === 0) {
      return res.status(400).json({ error: 'Can only review completed bookings' });
    }

    // Check if already reviewed
    const existing = await query(
      'SELECT id FROM reviews WHERE booking_id = $1',
      [booking_id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Already reviewed this booking' });
    }

    const result = await query(
      `INSERT INTO reviews (booking_id, client_id, car_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [booking_id, req.user.id, car_id, rating, comment]
    );

    res.status(201).json({ review: result.rows[0] });
  } catch (error) {
    console.error('Review error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get reviews for a car
router.get('/car/:carId', async (req, res) => {
  try {
    const result = await query(
      `SELECT r.*, u.full_name 
       FROM reviews r
       JOIN users u ON r.client_id = u.id
       WHERE r.car_id = $1
       ORDER BY r.created_at DESC`,
      [req.params.carId]
    );

    res.json({ reviews: result.rows });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;