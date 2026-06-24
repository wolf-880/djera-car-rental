# Development Guide

This guide will help you set up your development environment and understand the project structure.

## Prerequisites

- Node.js v16+
- PostgreSQL v12+
- Git
- A code editor (VS Code recommended)

## Quick Start

### 1. Set Up Database

```bash
# Create database
createdb djera_rental

# Create user
createuser djera_user

# Set password
psql -U postgres -d djera_rental -c "ALTER USER djera_user WITH PASSWORD 'secure_password';"

# Grant privileges
psql -U postgres -d djera_rental -c "GRANT ALL PRIVILEGES ON DATABASE djera_rental TO djera_user;"

# Initialize schema
psql -U djera_user -d djera_rental -f backend/migrations/schema.sql
```

### 2. Start Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials
npm install
npm run dev
```

Backend runs on `http://localhost:5000`

### 3. Start Frontend

Open `http://localhost:5000` in your browser.

## Project Structure Details

### Backend Architecture

```
backend/
├── server.js           # Express app initialization
├── config/
│   └── db.js          # Database pool configuration
├── middleware/
│   └── auth.js        # JWT authentication
└── routes/            # API endpoints
    ├── auth.js        # User authentication
    ├── cars.js        # Car CRUD operations
    ├── bookings.js    # Booking management
    ├── payments.js    # Payment processing
    └── reviews.js     # Reviews & ratings
```

#### Request Flow
1. **Request** → Express server
2. **Middleware** → CORS, JSON parsing, Rate limiting
3. **Route Handler** → Validation, business logic
4. **Database Query** → PostgreSQL
5. **Response** → JSON back to client

### Frontend Architecture

```
frontend/
├── index.html         # Main HTML structure
├── js/
│   ├── api.js        # API client & HTTP methods
│   ├── i18n.js       # Translation system
│   └── main.js       # UI logic & event handlers
└── css/
    └── style.css     # Dark theme styles
```

#### Component Flow
1. **HTML** loads
2. **CSS** applies styling (dark theme)
3. **JS modules** initialize:
   - i18n (translations)
   - API client (HTTP)
   - Event listeners (UI interactions)
4. **User interactions** trigger API calls
5. **Responses** update DOM dynamically

## Code Style Guide

### JavaScript
- Use `const` by default, `let` when reassignment needed
- Use arrow functions for callbacks
- Use async/await instead of promises
- Validate input early
- Return early on errors

### Database Queries
- Always use parameterized queries (e.g., `$1`, `$2`)
- Never concatenate user input into SQL
- Use meaningful column names
- Index frequently queried columns

### API Responses
- Always return proper HTTP status codes
- Include `error` field on failures
- Include `data`/`message` field on success
- Validate before processing
- Log errors for debugging

## Common Tasks

### Add a New Car Feature

1. **Database** - Add column to cars table
```sql
ALTER TABLE cars ADD COLUMN feature_name VARCHAR(100);
```

2. **Backend** - Add to car creation/update
```javascript
// In backend/routes/cars.js
const { feature_name } = req.body;
// ... add to INSERT query
```

3. **Frontend** - Add form field
```html
<!-- In index.html -->
<input type="text" id="featureName" placeholder="Feature">
```

4. **API** - Update API client
```javascript
// In api.js if needed for creation
```

### Add a New API Endpoint

1. Create handler in appropriate route file
2. Add validation
3. Add auth check if needed
4. Return JSON response
5. Update frontend API client
6. Use in frontend UI

### Add Translations

1. **Edit i18n.js**
```javascript
const en = {
  'new_key': 'English text',
};

const ar = {
  'new_key': 'النص العربي',
};
```

2. **Use in HTML**
```html
<p data-i18n="new_key">English text</p>
```

3. **Use in JavaScript**
```javascript
showToast(t('new_key'));
```

## Testing

### Manual API Testing with cURL

```bash
# Health check
curl http://localhost:5000/api/health

# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "role": "client"
  }'

# Get cars
curl "http://localhost:5000/api/cars?category=sedan&limit=5"

# Get with auth
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/auth/profile
```

### Browser DevTools

1. **Console** (F12) - See errors and logs
2. **Network** tab - Monitor API requests
3. **Application** tab - Check localStorage (token, user data)
4. **Storage** - View cookies and local data

### Database Inspection

```bash
# Connect to database
psql -U djera_user -d djera_rental

# List tables
\dt

# Describe table
\d cars

# Query data
SELECT * FROM users LIMIT 5;
SELECT * FROM cars WHERE category = 'sedan';
SELECT COUNT(*) FROM bookings;

# Exit
\q
```

## Debugging Tips

### Backend Debugging

1. **Check logs** - Terminal output from `npm run dev`
2. **Add console.log** - Debug values before returning
3. **Check database** - Query directly with psql
4. **Test with cURL** - Bypass frontend issues
5. **Check .env** - Verify all required variables

### Frontend Debugging

1. **Browser Console** (F12) - See errors
2. **Network tab** - Check API responses
3. **Inspect HTML** - Verify elements render
4. **Application tab** - Check localStorage
5. **Add alerts** - Debug flow (use in dev only)

## Performance Tips

### Backend
- Use database indexes (already configured)
- Cache frequently accessed data
- Compress responses
- Paginate large datasets

### Frontend
- Lazy load images
- Minimize HTTP requests
- Optimize CSS/JS
- Use localStorage for tokens
- Debounce search input

### Database
- Vacuum regularly: `VACUUM ANALYZE;`
- Monitor slow queries: `postgresql.conf` settings
- Keep indexes updated

## Security Checklist

- [ ] Never commit .env files
- [ ] Use HTTPS in production
- [ ] Keep dependencies updated
- [ ] Validate all user input
- [ ] Never trust client-side validation alone
- [ ] Use strong JWT secrets (32+ chars)
- [ ] Hash passwords with bcrypt
- [ ] Use parameterized queries
- [ ] Enable CORS properly
- [ ] Rate limit endpoints
- [ ] Log security events

## Deployment Preparation

### Before Going Live

1. **Update .env** for production
2. **Set NODE_ENV=production**
3. **Use strong JWT_SECRET**
4. **Configure Stripe live keys**
5. **Enable HTTPS/SSL**
6. **Set up database backups**
7. **Configure CORS for production domain**
8. **Set up error logging/monitoring**
9. **Test payment flow end-to-end**
10. **Set up automated tests**

### Environment Variables for Production

```bash
NODE_ENV=production
JWT_SECRET=<very-long-random-string-32+-chars>
DB_HOST=production-db-server
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=https://yourdomain.com
```

## Resources

- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Express Security](https://expressjs.com/en/advanced/best-practice-security.html)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/sql-syntax.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8949)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

## Getting Help

1. **Check existing issues** - GitHub issues
2. **Review documentation** - README.md
3. **Check database schema** - migrations/schema.sql
4. **Ask in Slack/Discord** - Development channel
5. **Email support** - info@alshoaa.ly

---

Happy coding! 🚀
