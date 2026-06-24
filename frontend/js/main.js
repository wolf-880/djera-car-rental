// frontend/js/main.js

document.addEventListener('DOMContentLoaded', () => {
    // Initialize i18n
    initI18n();
    
    // Set current year
    document.getElementById('currentYear').textContent = new Date().getFullYear();
    
    // Initialize UI
    initNavigation();
    initAuthUI();
    initModals();
    initLangToggle();
    initListCarForm();
    loadFeaturedCars();
    initSearchForm();
    initCarFilters();
    initContactForm();
    
    // Check auth state
    updateAuthUI();
});

/* ===========================
   Navigation
   =========================== */
function initNavigation() {
    const navbar = document.getElementById('navbar');
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');

    // Scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Mobile menu toggle
    menuToggle.addEventListener('click', () => {
        menuToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close menu on link click
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            menuToggle.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Active link on scroll
    const sections = document.querySelectorAll('section[id]');
    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            if (window.scrollY >= sectionTop) {
                current = section.getAttribute('id');
            }
        });

        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
}

/* ===========================
   Language Toggle
   =========================== */
function initLangToggle() {
    const toggle = document.getElementById('langToggle');
    toggle.addEventListener('click', () => {
        const currentLang = getCurrentLang();
        const newLang = currentLang === 'en' ? 'ar' : 'en';
        setLanguage(newLang);
    });
}

/* ===========================
   Auth UI
   =========================== */
function initAuthUI() {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const userMenu = document.getElementById('userMenu');
    const userAvatar = document.getElementById('userAvatar');
    const dropdownMenu = document.getElementById('dropdownMenu');
    
    // Login button
    loginBtn.addEventListener('click', () => openModal('loginModal'));
    registerBtn.addEventListener('click', () => openModal('registerModal'));
    
    // Switch between login/register
    document.getElementById('switchToRegister').addEventListener('click', (e) => {
        e.preventDefault();
        closeModal('loginModal');
        openModal('registerModal');
    });
    
    document.getElementById('switchToLogin').addEventListener('click', (e) => {
        e.preventDefault();
        closeModal('registerModal');
        openModal('loginModal');
    });
    
    // User menu toggle
    userAvatar.addEventListener('click', () => {
        dropdownMenu.classList.toggle('hidden');
    });
    
    // Close dropdown on click outside
    document.addEventListener('click', (e) => {
        if (!userMenu.contains(e.target)) {
            dropdownMenu.classList.add('hidden');
        }
    });
    
    // Logout
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        api.logout();
        updateAuthUI();
        showToast('Logged out successfully', 'info');
    });
    
    // Login form submission
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const btn = e.target.querySelector('button[type="submit"]');

        // Validation
        if (!email || !email.includes('@')) {
            showToast('Please enter a valid email address', 'error');
            return;
        }
        if (!password || password.length < 6) {
            showToast('Password must be at least 6 characters', 'error');
            return;
        }

        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = t('logging_in') || 'Logging in...';

        try {
            const data = await api.login(email, password);
            closeModal('loginModal');
            updateAuthUI();
            showToast(t('welcome_back') || 'Welcome back!', 'success');
            document.getElementById('loginForm').reset();
        } catch (error) {
            showToast(error.message || t('login_error') || 'Login failed', 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    });
    
    // Register form submission
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const userData = {
            full_name: document.getElementById('regName').value.trim(),
            email: document.getElementById('regEmail').value.trim(),
            phone: document.getElementById('regPhone').value.trim(),
            password: document.getElementById('regPassword').value,
            role: document.getElementById('regRole').value,
        };
        const btn = e.target.querySelector('button[type="submit"]');

        // Validation
        if (!userData.full_name) {
            showToast('Please enter your full name', 'error');
            return;
        }
        if (!userData.email || !userData.email.includes('@')) {
            showToast('Please enter a valid email address', 'error');
            return;
        }
        if (!userData.password || userData.password.length < 6) {
            showToast('Password must be at least 6 characters', 'error');
            return;
        }

        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = t('registering') || 'Registering...';

        try {
            const data = await api.register(userData);
            closeModal('registerModal');
            updateAuthUI();
            showToast(t('account_created') || 'Account created successfully!', 'success');
            document.getElementById('registerForm').reset();
        } catch (error) {
            showToast(error.message || t('registration_error') || 'Registration failed', 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    });
    
    // List car button
    document.getElementById('listCarBtn').addEventListener('click', (e) => {
        e.preventDefault();
        if (!api.isLoggedIn()) {
            openModal('loginModal');
            showToast('Please login to list your car', 'info');
        } else {
            const user = api.getCurrentUser();
            if (user && user.role === 'owner') {
                openModal('listCarModal');
            } else {
                showToast('Only car owners can list vehicles', 'error');
            }
        }
    });

    // My Cars link in dropdown
    const myCarsLink = document.querySelector('a[href="#my-cars"]');
    if (myCarsLink) {
        myCarsLink.addEventListener('click', (e) => {
            e.preventDefault();
            openModal('listCarModal');
        });
    }
}

function updateAuthUI() {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const userMenu = document.getElementById('userMenu');
    const ownerOnly = document.querySelector('.owner-only');
    
    if (api.isLoggedIn()) {
        const user = api.getCurrentUser();
        loginBtn.classList.add('hidden');
        registerBtn.classList.add('hidden');
        userMenu.classList.remove('hidden');
        
        // Show owner-only links
        if (user && user.role === 'owner') {
            if (ownerOnly) ownerOnly.classList.add('visible');
        }
    } else {
        loginBtn.classList.remove('hidden');
        registerBtn.classList.remove('hidden');
        userMenu.classList.add('hidden');
        if (ownerOnly) ownerOnly.classList.remove('visible');
    }
}

/* ===========================
   Modals
   =========================== */
function initModals() {
    // Close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            closeModal(modal.id);
        });
    });
    
    // Overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', () => {
            const modal = overlay.closest('.modal');
            closeModal(modal.id);
        });
    });
    
    // Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal:not(.hidden)').forEach(modal => {
                closeModal(modal.id);
            });
        }
    });
}

function openModal(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
    document.body.style.overflow = '';
}

/* ===========================
   Cars
   =========================== */
async function loadFeaturedCars(filters = {}) {
    const grid = document.getElementById('carsGrid');
    grid.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        const data = await api.getCars({ limit: 6, ...filters });
        renderCars(data.cars);
    } catch (error) {
        grid.innerHTML = '<p style="text-align:center;color:var(--text-muted);">Failed to load cars. Please try again.</p>';
    }
}

function renderCars(cars) {
    const grid = document.getElementById('carsGrid');
    
    if (cars.length === 0) {
        grid.innerHTML = '<p style="text-align:center;color:var(--text-muted);grid-column:1/-1;">No cars found matching your criteria.</p>';
        return;
    }
    
    grid.innerHTML = cars.map(car => `
        <div class="car-card" onclick="viewCarDetails('${car.id}')">
            <div class="car-card-image">
                <img src="${car.image_urls?.[0] || 'https://placehold.co/400x300/1e1e1e/e63946?text=Djera'}" 
                     alt="${car.brand} ${car.model}" 
                     loading="lazy"
                     onerror="this.src='https://placehold.co/400x300/1e1e1e/e63946?text=Djera'">
                <span class="car-card-badge">${car.category?.toUpperCase() || 'CAR'}</span>
            </div>
            <div class="car-card-body">
                <div class="car-card-header">
                    <div class="car-card-title">
                        ${car.brand} ${car.model}
                        <span>${car.year}</span>
                    </div>
                    <div class="car-card-rating">
                        <i class="fas fa-star"></i>
                        <span>${parseFloat(car.average_rating || 0).toFixed(1)}</span>
                    </div>
                </div>
                <div class="car-card-features">
                    <div class="car-card-feature">
                        <i class="fas fa-cog"></i>
                        ${car.transmission === 'automatic' ? t('automatic') : t('manual')}
                    </div>
                    <div class="car-card-feature">
                        <i class="fas fa-gas-pump"></i>
                        ${car.fuel_type || 'Petrol'}
                    </div>
                    <div class="car-card-feature">
                        <i class="fas fa-users"></i>
                        ${car.seats || 5} Seats
                    </div>
                    <div class="car-card-feature">
                        <i class="fas fa-map-marker-alt"></i>
                        ${car.location_city || 'Tripoli'}
                    </div>
                </div>
                <div class="car-card-footer">
                    <div class="car-card-price">
                        ${car.daily_rate} LYD <span>${t('per_day')}</span>
                    </div>
                    <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); bookCar('${car.id}')">
                        ${t('book_car') || 'Book Now'}
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function viewCarDetails(carId) {
    // Implement car detail modal view
    showToast('Car details coming soon!', 'info');
}

function bookCar(carId) {
    if (!api.isLoggedIn()) {
        openModal('loginModal');
        showToast('Please login to book a car', 'info');
        return;
    }
    
    document.getElementById('bookingCarId').value = carId;
    openModal('bookingModal');
    
    // Set minimum dates
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('bookingStartDate').min = today;
    document.getElementById('bookingEndDate').min = today;
}

/* ===========================
   Search & Filters
   =========================== */
function initSearchForm() {
    const searchBtn = document.getElementById('searchBtn');
    
    searchBtn.addEventListener('click', () => {
        const filters = {
            category: document.getElementById('searchCategory').value,
            location: document.getElementById('searchLocation').value,
        };
        
        loadFeaturedCars(filters);
        
        // Scroll to cars section
        document.getElementById('cars').scrollIntoView({ behavior: 'smooth' });
    });
}

function initCarFilters() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const filter = btn.getAttribute('data-filter');
            const filters = filter === 'all' ? {} : { category: filter };
            loadFeaturedCars(filters);
        });
    });
}

function updateSearchSelects() {
    // Update select options text based on current language
    const categorySelect = document.getElementById('searchCategory');
    const categories = {
        '': 'all_categories',
        'economy': 'economy',
        'sedan': 'sedan',
        'suv': 'suv',
        'luxury': 'luxury',
        'van': 'van',
        'sports': 'sports',
    };
    
    if (categorySelect) {
        Array.from(categorySelect.options).forEach(option => {
            const key = categories[option.value];
            if (key) option.textContent = t(key);
        });
    }
}

/* ===========================
   Booking Form
   =========================== */
document.getElementById('bookingForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const carId = document.getElementById('bookingCarId').value;
    const startDate = document.getElementById('bookingStartDate').value;
    const endDate = document.getElementById('bookingEndDate').value;
    const paymentMethod = document.getElementById('bookingPaymentMethod').value;
    const btn = e.target.querySelector('button[type="submit"]');

    // Validation
    if (!startDate) {
        showToast('Please select a start date', 'error');
        return;
    }
    if (!endDate) {
        showToast('Please select an end date', 'error');
        return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
        showToast('Start date cannot be in the past', 'error');
        return;
    }
    if (end <= start) {
        showToast('End date must be after start date', 'error');
        return;
    }

    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = t('confirming') || 'Confirming booking...';

    try {
        const data = await api.createBooking({
            car_id: carId,
            start_date: startDate,
            end_date: endDate,
            payment_method: paymentMethod,
        });

        closeModal('bookingModal');
        showToast(t('booking_success') || 'Booking created successfully!', 'success');
        document.getElementById('bookingForm').reset();

        // If Stripe, create payment intent
        if (paymentMethod === 'stripe') {
            handleStripePayment(data.booking.id);
        }
    } catch (error) {
        showToast(error.message || t('booking_error') || 'Booking failed', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
});

async function handleStripePayment(bookingId) {
    try {
        const data = await api.createStripeIntent(bookingId);
        showToast('Redirecting to payment...', 'info');
        // In production, use Stripe Elements or redirect to Stripe Checkout
        console.log('Stripe Client Secret:', data.clientSecret);
    } catch (error) {
        showToast('Payment setup failed: ' + error.message, 'error');
    }
}

/* ===========================
   Contact Form
   =========================== */
function initContactForm() {
    document.getElementById('contactForm').addEventListener('submit', (e) => {
        e.preventDefault();
        showToast('Message sent successfully! We will get back to you soon.', 'success');
        document.getElementById('contactForm').reset();
    });
}

/* ===========================
   List Car Form
   =========================== */
function initListCarForm() {
    const imageInput = document.getElementById('carImages');
    const imagePreview = document.getElementById('imagePreview');
    
    // Image upload preview
    if (imageInput) {
        imageInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            
            if (files.length > 5) {
                showToast('Maximum 5 images allowed', 'error');
                e.target.value = '';
                return;
            }
            
            imagePreview.innerHTML = '';
            
            files.forEach((file, index) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const previewDiv = document.createElement('div');
                    previewDiv.className = 'image-preview-item';
                    previewDiv.innerHTML = `
                        <img src="${event.target.result}" alt="Preview ${index + 1}">
                        <button type="button" class="remove-btn" onclick="this.parentElement.remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    `;
                    imagePreview.appendChild(previewDiv);
                };
                reader.readAsDataURL(file);
            });
        });
        
        // Drag and drop
        imageInput.parentElement.addEventListener('dragover', (e) => {
            e.preventDefault();
            imageInput.parentElement.classList.add('drag-over');
        });
        
        imageInput.parentElement.addEventListener('dragleave', () => {
            imageInput.parentElement.classList.remove('drag-over');
        });
        
        imageInput.parentElement.addEventListener('drop', (e) => {
            e.preventDefault();
            imageInput.parentElement.classList.remove('drag-over');
            imageInput.files = e.dataTransfer.files;
            const event = new Event('change', { bubbles: true });
            imageInput.dispatchEvent(event);
        });
    }
    
    // List car form submission
    const listCarForm = document.getElementById('listCarForm');
    if (listCarForm) {
        listCarForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btn = e.target.querySelector('button[type="submit"]');
            const formData = new FormData();
            
            // Add car data
            formData.append('brand', document.getElementById('carBrand').value.trim());
            formData.append('model', document.getElementById('carModel').value.trim());
            formData.append('year', document.getElementById('carYear').value);
            formData.append('category', document.getElementById('carCategory').value);
            formData.append('transmission', document.getElementById('carTransmission').value);
            formData.append('fuel_type', document.getElementById('carFuelType').value);
            formData.append('seats', document.getElementById('carSeats').value);
            formData.append('doors', document.getElementById('carDoors').value);
            formData.append('daily_rate', document.getElementById('carDailyRate').value);
            formData.append('weekly_rate', document.getElementById('carWeeklyRate').value || null);
            formData.append('monthly_rate', document.getElementById('carMonthlyRate').value || null);
            formData.append('location_city', document.getElementById('carLocation').value);
            formData.append('description', document.getElementById('carDescription').value.trim());
            formData.append('license_plate', document.getElementById('carLicensePlate').value.trim());
            formData.append('mileage', document.getElementById('carMileage').value || null);
            formData.append('color', document.getElementById('carColor').value.trim());
            
            // Add images
            const imageInputField = document.getElementById('carImages');
            if (imageInputField.files && imageInputField.files.length > 0) {
                for (let i = 0; i < imageInputField.files.length; i++) {
                    formData.append('images', imageInputField.files[i]);
                }
            }
            
            // Validation
            if (!formData.get('brand') || !formData.get('model')) {
                showToast('Please enter car brand and model', 'error');
                return;
            }
            if (!formData.get('daily_rate') || formData.get('daily_rate') <= 0) {
                showToast('Please enter a valid daily rate', 'error');
                return;
            }
            
            const originalText = btn.textContent;
            btn.disabled = true;
            btn.textContent = 'Listing car...';
            
            try {
                const response = await fetch('http://localhost:5500/api/cars', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${api.token}`
                    },
                    body: formData
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to list car');
                }
                
                const data = await response.json();
                closeModal('listCarModal');
                showToast('Car listed successfully!', 'success');
                listCarForm.reset();
                imagePreview.innerHTML = '';
                
                // Reload cars
                loadFeaturedCars();
            } catch (error) {
                showToast('Error: ' + (error.message || 'Failed to list car'), 'error');
            } finally {
                btn.disabled = false;
                btn.textContent = originalText;
            }
        });
    }
}

/* ===========================
   Newsletter
   =========================== */
document.getElementById('newsletterForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = e.target.querySelector('input').value;
    showToast('Subscribed successfully!', 'success');
    e.target.reset();
});

/* ===========================
   Toast Notifications
   =========================== */
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/* ===========================
   Load More Button
   =========================== */
document.getElementById('loadMoreCars').addEventListener('click', () => {
    loadFeaturedCars({ limit: 12 });
    showToast('Showing all available cars', 'info');
});

// Initialize app
console.log('🚗 Djera - Car Rental Libya');
console.log('📍 Powered by @Alshoaa.ly');