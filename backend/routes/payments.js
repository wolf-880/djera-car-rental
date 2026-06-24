// backend/routes/payments.js
const express = require('express');
const { query } = require('../config/db');
const auth = require('../middleware/auth');

let stripe = null;

// Initialize Stripe only if key is configured
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
} else if (process.env.NODE_ENV === 'production') {
  throw new Error('STRIPE_SECRET_KEY is required in production');
}

const router = express.Router();

// Create Stripe payment intent
router.post('/stripe/create-intent', auth, async (req, res) => {
  try {
    const { booking_id } = req.body;

    const booking = await query(
      'SELECT * FROM bookings WHERE id = $1 AND client_id = $2',
      [booking_id, req.user.id]
    );

    if (booking.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.rows[0].payment_status === 'paid') {
      return res.status(400).json({ error: 'Booking already paid' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(booking.rows[0].total_amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        booking_id: booking_id,
        user_id: req.user.id
      },
      description: `Car rental booking #${booking_id.substring(0, 8)}`
    });

    // Update booking with payment intent
    await query(
      'UPDATE bookings SET stripe_payment_id = $1 WHERE id = $2',
      [paymentIntent.id, booking_id]
    );

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Stripe intent error:', error);
    res.status(500).json({ error: 'Payment processing error' });
  }
});

// Confirm payment (Stripe webhook or manual confirmation)
router.post('/confirm', auth, async (req, res) => {
  try {
    const { booking_id, payment_method, transaction_ref } = req.body;

    const booking = await query('SELECT * FROM bookings WHERE id = $1', [booking_id]);
    if (booking.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    await query(
      `UPDATE bookings 
       SET payment_status = 'paid', 
           payment_method = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [payment_method || booking.rows[0].payment_method, booking_id]
    );

    res.json({ message: 'Payment confirmed successfully' });
  } catch (error) {
    console.error('Payment confirm error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Stripe webhook
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Stripe not configured' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return res.status(400).json({ error: 'Webhook secret not configured' });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const bookingId = paymentIntent.metadata.booking_id;

    await query(
      `UPDATE bookings
       SET payment_status = 'paid', stripe_payment_id = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [paymentIntent.id, bookingId]
    );

    console.log(`✅ Payment succeeded for booking ${bookingId}`);
  }

  res.json({ received: true });
});

module.exports = router;