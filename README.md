# 🚗 Djera - Car Rental Platform (Libya)

Djera is a modern, full-stack car rental platform built for Libya. It connects car owners with renters, providing a seamless experience for booking, managing, and paying for car rentals across multiple Libyan cities.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [User Roles](#user-roles)
- [Key Features Explained](#key-features-explained)
- [Security Features](#security-features)
- [Troubleshooting](#troubleshooting)
- [Development Tips](#development-tips)

## 🎯 Project Overview

Djera is a P2P (peer-to-peer) car rental marketplace that enables:
- **Car Owners**: List their vehicles and earn money
- **Renters (Clients)**: Browse and book cars easily
- **Flexible Payments**: Support for cash, bank transfers, and online payments (Stripe)

### Key Statistics
- **500+ Cars** available across Libya
- **50+ Verified Owners** on the platform
- **10K+ Happy Customers** using Djera
- **5 Cities** covered: Tripoli, Benghazi, Misrata, Zawiya, and more

## ✨ Features

### For Renters (Clients)
- 🔍 **Advanced Car Search**: Filter by category, location, price, transmission, fuel type
- 📅 **Easy Booking**: Simple date selection and instant confirmation
- 💳 **Multiple Payment Methods**: 
  - Cash (in-person)
  - Bank Transfer
  - Online Payment (Stripe)
- ⭐ **Reviews & Ratings**: See verified reviews from other customers
- 📱 **Mobile Responsive**: Works seamlessly on mobile and desktop
- 🌍 **Bilingual Support**: English and Arabic (عربي)

### For Car Owners
- 📝 **Easy Listing**: Add cars with photos, specifications, and pricing
- 💰 **Flexible Pricing**: Set daily, weekly, and monthly rates
- 📊 **Booking Management**: View and manage all bookings
- 💬 **Customer Reviews**: Build trust with verified customer feedback
- 🔒 **Secure Platform**: Verified payment system

### For Admins
- 👥 **User Management**: Manage users and their roles
- 🚗 **Car Management**: Oversee all car listings
- 📈 **Analytics**: View platform statistics and trends
- 🔔 **Notifications**: System notifications for important events

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js (web server)
- **Database**: PostgreSQL (relational data)
- **Authentication**: JWT (JSON Web Tokens)
- **Password Security**: bcryptjs
- **Payments**: Stripe API
- **File Upload**: Multer
- **Input Validation**: express-validator
- **Security**: Helmet, CORS, Rate Limiting

### Frontend
- **Markup**: HTML5
- **Styling**: CSS3 (custom properties, dark theme)
- **Scripts**: Vanilla JavaScript (no frameworks)
- **Internationalization**: Custom i18n system
- **Icons**: Font Awesome 6.5.1
- **Fonts**: Inter (English), Tajawal (Arabic)
- **HTTP Client**: Fetch API

### Features & Tools
- **Rate Limiting**: 100 requests per 15 minutes
- **File Upload**: 5MB image limit per file (supports JPEG, PNG, WebP)
- **Database**: UUID primary keys, optimized indexes
- **Error Handling**: Comprehensive error handling with user feedback

## 📁 Project Structure

```
djera-car-rental/
├── backend/                    # Node.js/Express server
│   ├── config/
│   │   └── db.js             # PostgreSQL connection pool
│   ├── middleware/
│   │   └── auth.js           # JWT authentication middleware
│   ├── routes/
│   │   ├── auth.js           # Authentication endpoints
│   │   ├── cars.js           # Car listing endpoints
│   │   ├── bookings.js       # Booking management
│   │   ├── payments.js       # Payment processing (Stripe)
│   │   └── reviews.js        # Car reviews & ratings
│   ├── migrations/
│   │   └── schema.sql        # Database schema
│   ├── uploads/              # User-uploaded images
│   ├── server.js             # Express app setup
│   ├── package.json          # Dependencies
│   └── .env.example          # Environment template
│
└── frontend/                  # HTML/CSS/JS client
    ├── js/
    │   ├── api.js            # API client with error handling
    │   ├── i18n.js           # Internationalization system
    │   └── main.js           # UI logic & event handlers
    ├── css/
    │   └── style.css         # Dark theme styling
    ├── assets/
    │   └── images/           # Static images
    └── index.html            # Main HTML file
```

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v16+ ([download](https://nodejs.org/))
- **PostgreSQL**: v12+ ([download](https://www.postgresql.org/download/))
- **Stripe Account**: For payment processing (optional for development)

### Required Services
- PostgreSQL database
- Stripe (for online payments)
- SMTP server (for email notifications - optional)

## 📦 Installation

### 1. Clone the Repository
```bash
cd djera-car-rental
```

### 2. Setup Backend

#### Install Dependencies
```bash
cd backend
npm install
```

#### Create PostgreSQL Database
```bash
psql -U postgres

# In PostgreSQL terminal:
CREATE DATABASE djera_rental;
CREATE USER djera_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE djera_rental TO djera_user;
\q
```

#### Initialize Database Schema
```bash
psql -U djera_user -d djera_rental -f migrations/schema.sql
```

#### Setup Environment Variables
```bash
cp .env.example .env
nano .env  # Edit with your settings
```

See [Configuration](#configuration) section for detailed .env setup.

### 3. Setup Frontend

No build step required! The frontend is vanilla HTML/CSS/JavaScript.

Just ensure the backend is running before testing.

## ⚙️ Configuration

### Backend Environment Variables (.env)

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=djera_rental
DB_USER=djera_user
DB_PASSWORD=your_secure_password

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# JWT (at least 32 characters for security)
JWT_SECRET=your_jwt_secret_key_here_min_32_characters_long

# Stripe (get from https://dashboard.stripe.com)
STRIPE_PUBLIC_KEY=pk_test_your_public_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_password
```

### Frontend Configuration

The frontend automatically detects the environment:
- **Development**: Uses `http://localhost:5000/api`
- **Production**: Uses same domain as frontend

## ▶️ Running the Application

### Start Backend Server
```bash
cd backend
npm run dev    # Development (with hot reload)
npm start      # Production
```

The backend will run on `http://localhost:5000`

### Open Frontend
1. Open a browser
2. Navigate to `http://localhost:5000/api/../../../frontend/index.html`
3. Or if serving frontend separately: `http://localhost:3000`

### API Health Check
```bash
curl http://localhost:5000/api/health
# Response: {"status":"ok","timestamp":"2026-05-24T..."}
```

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "+218913583812",
  "password": "SecurePassword123",
  "role": "client"  // or "owner"
}

Response 201:
{
  "message": "Registration successful",
  "user": {
    "id": "uuid-string",
    "full_name": "John Doe",
    "email": "john@example.com",
    "role": "client"
  },
  "token": "jwt-token-string"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePassword123"
}

Response 200:
{
  "message": "Login successful",
  "user": { /* user data */ },
  "token": "jwt-token-string"
}
```

#### Get Current User Profile
```http
GET /api/auth/profile
Authorization: Bearer <token>

Response 200:
{
  "user": {
    "id": "uuid",
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone": "+218913583812",
    "role": "client",
    "preferred_language": "en"
  }
}
```

### Car Endpoints

#### Get All Cars (with filters)
```http
GET /api/cars?category=sedan&location=Tripoli&min_price=50&max_price=200&page=1&limit=12

Response 200:
{
  "cars": [
    {
      "id": "car-uuid",
      "brand": "Toyota",
      "model": "Camry",
      "year": 2022,
      "category": "sedan",
      "daily_rate": 120,
      "weekly_rate": 800,
      "monthly_rate": 2800,
      "location_city": "Tripoli",
      "owner_name": "Ahmed Ali",
      "average_rating": 4.8,
      "review_count": 25,
      "image_urls": ["https://..."]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 145,
    "pages": 13
  }
}
```

#### Create Car Listing (Owner Only)
```http
POST /api/cars
Authorization: Bearer <owner-token>
Content-Type: multipart/form-data

Form Data:
- brand: "Toyota"
- model: "Camry"
- year: 2022
- category: "sedan"
- transmission: "automatic"
- fuel_type: "petrol"
- seats: 5
- doors: 4
- daily_rate: 120
- weekly_rate: 800
- monthly_rate: 2800
- location_city: "Tripoli"
- description: "Well-maintained sedan..."
- images: [file1, file2, ...] (max 5 files)

Response 201:
{ "car": { /* car data */ } }
```

### Booking Endpoints

#### Create Booking
```http
POST /api/bookings
Authorization: Bearer <client-token>
Content-Type: application/json

{
  "car_id": "car-uuid",
  "start_date": "2026-05-25",
  "end_date": "2026-05-30",
  "payment_method": "stripe"  // or "cash", "bank_transfer"
}

Response 201:
{
  "booking": {
    "id": "booking-uuid",
    "car_id": "car-uuid",
    "client_id": "user-uuid",
    "start_date": "2026-05-25",
    "end_date": "2026-05-30",
    "total_amount": 600,
    "payment_status": "pending",
    "booking_status": "pending"
  },
  "message": "Booking created successfully. Please complete payment to confirm."
}
```

#### Get User Bookings
```http
GET /api/bookings
Authorization: Bearer <token>

Response 200:
{
  "bookings": [
    {
      "id": "booking-uuid",
      "car_id": "car-uuid",
      "brand": "Toyota",
      "model": "Camry",
      "year": 2022,
      "start_date": "2026-05-25",
      "end_date": "2026-05-30",
      "total_amount": 600,
      "payment_status": "pending",
      "booking_status": "pending",
      "owner_name": "Ahmed Ali"
    }
  ]
}
```

### Payment Endpoints

#### Create Stripe Payment Intent
```http
POST /api/payments/stripe/create-intent
Authorization: Bearer <token>
Content-Type: application/json

{
  "booking_id": "booking-uuid"
}

Response 200:
{
  "clientSecret": "pi_xxx#secret_xxx",
  "paymentIntentId": "pi_xxx"
}
```

#### Confirm Payment
```http
POST /api/payments/confirm
Authorization: Bearer <token>
Content-Type: application/json

{
  "booking_id": "booking-uuid",
  "payment_method": "bank_transfer",
  "transaction_ref": "optional-ref-number"
}

Response 200:
{ "message": "Payment confirmed successfully" }
```

## 🗄️ Database Schema

### Users Table
```sql
- id (UUID) - Primary Key
- full_name (VARCHAR)
- email (VARCHAR) - Unique, indexed
- phone (VARCHAR)
- password_hash (VARCHAR)
- role (VARCHAR) - client, owner, admin
- preferred_language (VARCHAR) - en, ar
- created_at, updated_at (TIMESTAMP)
```

### Cars Table
```sql
- id (UUID) - Primary Key
- owner_id (UUID) - Foreign Key to users
- brand, model, year (VARCHAR, INT)
- category (VARCHAR) - economy, sedan, suv, luxury, van, sports
- transmission, fuel_type (VARCHAR)
- seats, doors (INT)
- daily_rate, weekly_rate, monthly_rate (DECIMAL)
- is_available (BOOLEAN)
- location_city (VARCHAR) - indexed
- description (TEXT)
- features, image_urls (JSONB)
- license_plate, mileage, color (VARCHAR)
- created_at, updated_at (TIMESTAMP)
```

### Bookings Table
```sql
- id (UUID) - Primary Key
- car_id (UUID) - Foreign Key to cars
- client_id (UUID) - Foreign Key to users
- start_date, end_date (DATE)
- total_amount (DECIMAL)
- payment_method (VARCHAR) - cash, bank_transfer, stripe
- payment_status (VARCHAR) - pending, paid, confirmed, cancelled, refunded
- booking_status (VARCHAR) - pending, confirmed, active, completed, cancelled
- stripe_payment_id (VARCHAR)
- created_at, updated_at (TIMESTAMP)
```

### Reviews Table
```sql
- id (UUID) - Primary Key
- booking_id (UUID) - Foreign Key to bookings
- client_id (UUID) - Foreign Key to users
- car_id (UUID) - Foreign Key to cars
- rating (INT) - 1-5 stars
- comment (TEXT)
- created_at (TIMESTAMP)
```

### Indexes
- cars(owner_id), cars(is_available), cars(category), cars(location_city)
- bookings(client_id), bookings(car_id), bookings(start_date, end_date)
- car_availability(car_id, date)

## 👥 User Roles

### Client (Renter)
- Browse and search cars
- Create bookings
- Make payments
- Leave reviews
- View booking history

### Owner (Car Listing Owner)
- Create car listings
- Manage car listings
- View bookings for their cars
- Receive payments
- View owner reviews

### Admin
- Manage all users
- Manage all car listings
- View platform statistics
- Moderate reviews
- Handle disputes

## 🔑 Key Features Explained

### Search & Filtering
Users can filter cars by:
- **Category**: Economy, Sedan, SUV, Luxury, Van, Sports
- **Location**: Tripoli, Benghazi, Misrata, Zawiya, etc.
- **Price Range**: Min and max daily rate
- **Transmission**: Automatic or Manual
- **Fuel Type**: Petrol, Diesel, Electric, Hybrid
- **Features**: AC, GPS, Insurance, etc.

### Pricing Model
- **Daily Rate**: Standard day price
- **Weekly Rate**: Discounted price for 7+ days
- **Monthly Rate**: Best price for 30+ days
- **Automatic Calculation**: Booking total is auto-calculated based on:
  - Days/weeks/months booked
  - Applicable discounts
  - Damage waiver (if applicable)

### Payment Methods
1. **Cash**: Pay at pickup with owner
2. **Bank Transfer**: Transfer funds before pickup
3. **Stripe**: Online card payment (most secure)

### Booking Workflow
1. User selects car and dates
2. System checks availability
3. Price is calculated
4. User selects payment method
5. Booking is created
6. Payment is processed
7. Booking status updates
8. User can review after completion

### Review System
- Only verified renters can review
- Reviews are linked to completed bookings
- Ratings (1-5 stars) and comments
- Average rating displayed on car cards
- Reviews build trust in the platform

## 🔒 Security Features

### Authentication & Authorization
- JWT tokens with 7-day expiration
- Bcrypt password hashing (12 salt rounds)
- Role-based access control
- Protected routes with auth middleware

### Input Validation
- Email format validation
- Password minimum length (6 characters)
- Car data validation (year, category, etc.)
- File upload validation (image types, 5MB max)

### Data Protection
- PostgreSQL parameterized queries (SQL injection prevention)
- HTTPS enforcement in production
- CORS configuration
- Helmet.js for HTTP headers
- Rate limiting (100 requests/15 minutes)

### Payment Security
- Stripe API integration (PCI compliant)
- Webhook verification
- Payment intent validation
- Booking ownership verification

### Error Handling
- Detailed error messages for debugging
- Generic messages for production
- No sensitive data in error responses
- Proper HTTP status codes

## 🐛 Troubleshooting

### Backend Issues

#### "Cannot find module 'express'"
```bash
cd backend
npm install
```

#### PostgreSQL Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
- Ensure PostgreSQL is running
- Check DB_HOST, DB_PORT, DB_USER, DB_PASSWORD in .env
- Verify database exists: `psql -l`

#### JWT Secret Error
- Set `JWT_SECRET` in .env (min 32 characters)
- In production, this is required

#### Stripe Error
- Verify STRIPE_SECRET_KEY in .env
- Use test keys for development
- Check Stripe dashboard for webhook configuration

### Frontend Issues

#### "Failed to fetch from API"
- Ensure backend is running on port 5000
- Check CORS_ORIGIN in backend
- Verify API_BASE_URL in api.js matches your setup

#### Login/Register Not Working
- Check browser console for errors (F12)
- Verify database connection
- Check JWT_SECRET configuration

#### Images Not Loading
- Verify `/uploads` directory exists
- Check file permissions
- Ensure Multer is configured correctly

## 💡 Development Tips

### Adding a New Route
1. Create handler in `backend/routes/your-route.js`
2. Add validation with express-validator
3. Use auth middleware if needed
4. Import in `server.js`
5. Add API method in `frontend/js/api.js`
6. Use in frontend event handlers

### Database Migrations
1. Edit `migrations/schema.sql`
2. Run: `psql -U djera_user -d djera_rental -f migrations/schema.sql`
3. Or drop/recreate: `DROP DATABASE djera_rental;` then recreate

### Adding Translations
1. Edit `frontend/js/i18n.js`
2. Add new keys to en and ar objects
3. Use `t('key_name')` in JavaScript
4. Use `data-i18n="key_name"` in HTML

### Environment-Specific Code
```javascript
if (process.env.NODE_ENV === 'production') {
  // Production-only code
} else {
  // Development code
}
```

### Testing Stripe Locally
1. Use Stripe test credentials
2. Test card: 4242 4242 4242 4242
3. Any future expiry date
4. Any 3-digit CVC

### Rate Limit Testing
```bash
# Send 101 requests in quick succession
for i in {1..101}; do curl http://localhost:5000/api/health; done
# 101st+ should return 429 (Too Many Requests)
```

## 📞 Support

### For Issues:
1. Check the console (F12)
2. Review error messages
3. Check database logs: `pg_log` directory
4. Check backend logs: Terminal output

### Contact
- Email: info@alshoaa.ly
- Phone: +218 913583812
- Location: Tripoli, Libya

## 📄 License

© 2026 Djera - Car Rental Libya. All rights reserved.  
Powered by @Alshoaa.ly

## 🎓 Learning Resources

### Technologies Used
- [Node.js Docs](https://nodejs.org/docs/)
- [Express.js Guide](https://expressjs.com/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Stripe API](https://stripe.com/docs)
- [JWT Intro](https://jwt.io/introduction)
- [MDN Web Docs](https://developer.mozilla.org/)

---

**Happy renting! 🚗**
