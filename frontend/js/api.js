// frontend/js/api.js

// Determine API base URL based on environment
const API_BASE_URL = (() => {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:5500/api';
  }
  // In production, use the same domain
  return `${window.location.protocol}//${window.location.host}/api`;
})();

class ApiClient {
  constructor() {
    this.token = this.loadToken();
  }

  loadToken() {
    try {
      return localStorage.getItem('djera_token');
    } catch {
      return null;
    }
  }

  setToken(token) {
    this.token = token;
    try {
      if (token) {
        localStorage.setItem('djera_token', token);
      } else {
        localStorage.removeItem('djera_token');
      }
    } catch (e) {
      console.warn('Unable to access localStorage:', e);
    }
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });

      let data;
      try {
        data = await response.json();
      } catch {
        data = { error: 'Invalid server response' };
      }

      if (!response.ok) {
        const errorMessage = data.error || data.message || `HTTP ${response.status}`;
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection.');
      }
      throw error;
    }
  }

  // Auth
  async register(userData) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    if (data.token) {
      this.setToken(data.token);
      try {
        localStorage.setItem('djera_user', JSON.stringify(data.user));
      } catch (e) {
        console.warn('Unable to save user data:', e);
      }
    }
    return data;
  }

  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.token) {
      this.setToken(data.token);
      try {
        localStorage.setItem('djera_user', JSON.stringify(data.user));
      } catch (e) {
        console.warn('Unable to save user data:', e);
      }
    }
    return data;
  }

  logout() {
    this.setToken(null);
    try {
      localStorage.removeItem('djera_user');
    } catch (e) {
      console.warn('Unable to clear user data:', e);
    }
  }

  getCurrentUser() {
    try {
      const user = localStorage.getItem('djera_user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  }

  isLoggedIn() {
    return !!this.token;
  }

  // Cars
  async getCars(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/cars${queryString ? '?' + queryString : ''}`);
  }

  async getCar(id) {
    return this.request(`/cars/${id}`);
  }

  async createCar(formData) {
    // For file upload, don't set Content-Type
    const response = await fetch(`${API_BASE_URL}/cars`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create car listing');
    }
    return data;
  }

  // Bookings
  async createBooking(bookingData) {
    return this.request('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  }

  async getBookings() {
    return this.request('/bookings');
  }

  // Payments
  async createStripeIntent(bookingId) {
    return this.request('/payments/stripe/create-intent', {
      method: 'POST',
      body: JSON.stringify({ booking_id: bookingId }),
    });
  }

  async confirmPayment(bookingId, method) {
    return this.request('/payments/confirm', {
      method: 'POST',
      body: JSON.stringify({ booking_id: bookingId, payment_method: method }),
    });
  }

  // Reviews
  async addReview(reviewData) {
    return this.request('/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  }

  async getCarReviews(carId) {
    return this.request(`/reviews/car/${carId}`);
  }
}

const api = new ApiClient();
