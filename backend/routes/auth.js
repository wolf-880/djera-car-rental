// backend/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

const getJWTSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be configured');
    }
  }
  return secret || 'djera_dev_secret_key_not_for_production_12345678';
};

// Register
router.post('/register', [
  body('full_name').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('phone').optional().trim(),
  body('role').isIn(['client', 'owner'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { full_name, email, password, phone, role } = req.body;

    // Check if user exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const password_hash = await bcrypt.hash(password, salt);

    // Create user
    const result = await query(
      `INSERT INTO users (full_name, email, phone, password_hash, role) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id, full_name, email, role, created_at`,
      [full_name, email, phone, password_hash, role]
    );

    // Generate token
    const token = jwt.sign(
      { id: result.rows[0].id, email: result.rows[0].email, role: result.rows[0].role },
      getJWTSecret(),
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registration successful',
      user: result.rows[0],
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const result = await query(
      'SELECT id, full_name, email, phone, password_hash, role, preferred_language FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      getJWTSecret(),
      { expiresIn: '7d' }
    );

    delete user.password_hash;

    res.json({
      message: 'Login successful',
      user,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Get current user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, full_name, email, phone, role, preferred_language, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { full_name, phone, preferred_language } = req.body;
    
    const result = await query(
      `UPDATE users 
       SET full_name = COALESCE($1, full_name),
           phone = COALESCE($2, phone),
           preferred_language = COALESCE($3, preferred_language),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING id, full_name, email, phone, role, preferred_language`,
      [full_name, phone, preferred_language, req.user.id]
    );

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;