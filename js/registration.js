// Registration Form Management System
// Handles user registration, tax calculations, and data validation

// Canadian Tax Rates by Province/Territory (2024)
const TAX_RATES = {
    'AB': { gst: 5, pst: 0, total: 5, name: 'Alberta' },
    'BC': { gst: 5, pst: 7, total: 12, name: 'British Columbia' },
    'MB': { gst: 5, pst: 7, total: 12, name: 'Manitoba' },
    'NB': { hst: 15, total: 15, name: 'New Brunswick' },
    'NL': { hst: 15, total: 15, name: 'Newfoundland and Labrador' },
    'NT': { gst: 5, pst: 0, total: 5, name: 'Northwest Territories' },
    'NS': { hst: 15, total: 15, name: 'Nova Scotia' },
    'NU': { gst: 5, pst: 0, total: 5, name: 'Nunavut' },
    'ON': { hst: 13, total: 13, name: 'Ontario' },
    'PE': { hst: 15, total: 15, name: 'Prince Edward Island' },
    'QC': { gst: 5, qst: 9.975, total: 14.975, name: 'Quebec' },
    'SK': { gst: 5, pst: 6, total: 11, name: 'Saskatchewan' },
    'YT': { gst: 5, pst: 0, total: 5, name: 'Yukon' }
};

// Initialize registration form
document.addEventListener('DOMContentLoaded', function() {
    initializeForm();
    setupEventListeners();
});

function initializeForm() {
    // Set default account type
    setAccountType('personal');
    
    // Format phone number as user types
    const phoneInput = document.getElementById('phone');
    phoneInput.addEventListener('input', formatPhoneNumber);
    
    // Format postal codes as user types
    const postalInputs = ['homePostal', 'shippingPostal'];
    postalInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', formatPostalCode);
        }
    });
}

function setupEventListeners() {
    // Account type selection
    document.querySelectorAll('.account-type').forEach(element => {
        element.addEventListener('click', function() {
            const type = this.dataset.type;
            setAccountType(type);
        });
    });

    // Form submission
    document.getElementById('registration-form').addEventListener('submit', handleFormSubmission);
    
    // Real-time validation
    document.getElementById('email').addEventListener('blur', validateEmail);
    document.getElementById('phone').addEventListener('blur', validatePhone);
}

function setAccountType(type) {
    // Update UI
    document.querySelectorAll('.account-type').forEach(element => {
        element.classList.remove('active');
    });
    document.querySelector(`[data-type="${type}"]`).classList.add('active');
    
    // Show/hide business section
    const businessSection = document.getElementById('business-section');
    if (type === 'business') {
        businessSection.classList.add('active');
        // Make business fields required
        document.getElementById('companyName').required = true;
    } else {
        businessSection.classList.remove('active');
        // Make business fields optional
        document.getElementById('companyName').required = false;
    }
}

function updateTaxInfo() {
    const province = document.getElementById('homeProvince').value;
    const taxDisplay = document.getElementById('tax-display');
    const taxRate = document.getElementById('tax-rate');
    const taxBreakdown = document.getElementById('tax-breakdown');
    
    if (province && TAX_RATES[province]) {
        const tax = TAX_RATES[province];
        taxDisplay.style.display = 'block';
        taxRate.textContent = `${tax.total}%`;
        
        let breakdown = '';
        if (tax.hst) {
            breakdown = `HST: ${tax.hst}%`;
        } else {
            breakdown = `GST: ${tax.gst}%`;
            if (tax.pst) {
                breakdown += `, PST: ${tax.pst}%`;
            }
            if (tax.qst) {
                breakdown += `, QST: ${tax.qst}%`;
            }
        }
        taxBreakdown.textContent = breakdown;
    } else {
        taxDisplay.style.display = 'none';
    }
}

function toggleShippingAddress() {
    const checkbox = document.getElementById('sameAsHome');
    const shippingFields = document.getElementById('shipping-fields');
    
    if (checkbox.checked) {
        shippingFields.style.display = 'none';
        // Clear shipping fields when not needed
        clearShippingFields();
    } else {
        shippingFields.style.display = 'block';
        // Copy home address to shipping if empty
        copyHomeToShipping();
    }
}

function clearShippingFields() {
    const fields = ['shippingStreet', 'shippingCity', 'shippingProvince', 'shippingPostal'];
    fields.forEach(fieldId => {
        document.getElementById(fieldId).value = '';
    });
}

function copyHomeToShipping() {
    const mappings = {
        'homeStreet': 'shippingStreet',
        'homeCity': 'shippingCity', 
        'homeProvince': 'shippingProvince',
        'homePostal': 'shippingPostal'
    };
    
    Object.entries(mappings).forEach(([homeField, shippingField]) => {
        const homeValue = document.getElementById(homeField).value;
        if (homeValue && !document.getElementById(shippingField).value) {
            document.getElementById(shippingField).value = homeValue;
        }
    });
}

function formatPhoneNumber(event) {
    let value = event.target.value.replace(/\D/g, '');
    
    if (value.length >= 6) {
        value = `(${value.slice(0,3)}) ${value.slice(3,6)}-${value.slice(6,10)}`;
    } else if (value.length >= 3) {
        value = `(${value.slice(0,3)}) ${value.slice(3)}`;
    }
    
    event.target.value = value;
}

function formatPostalCode(event) {
    let value = event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    if (value.length > 3) {
        value = `${value.slice(0,3)} ${value.slice(3,6)}`;
    }
    
    event.target.value = value;
}

function validateEmail() {
    const email = document.getElementById('email').value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (email && !emailRegex.test(email)) {
        showFieldError('email', 'Please enter a valid email address');
        return false;
    }
    
    clearFieldError('email');
    return true;
}

function validatePhone() {
    const phone = document.getElementById('phone').value;
    const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/;
    
    if (phone && !phoneRegex.test(phone)) {
        showFieldError('phone', 'Please enter a valid phone number: (xxx) xxx-xxxx');
        return false;
    }
    
    clearFieldError('phone');
    return true;
}

function validatePostalCode(postalCode) {
    const postalRegex = /^[A-Z][0-9][A-Z] [0-9][A-Z][0-9]$/;
    return postalRegex.test(postalCode);
}

function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    field.style.borderColor = '#e74c3c';
    
    // Remove existing error message
    clearFieldError(fieldId);
    
    // Add new error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.display = 'block';
    errorDiv.textContent = message;
    field.parentNode.appendChild(errorDiv);
}

function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    field.style.borderColor = '#e1e5e9';
    
    // Remove error message
    const errorMsg = field.parentNode.querySelector('.error-message');
    if (errorMsg) {
        errorMsg.remove();
    }
}

function validateForm() {
    let isValid = true;
    const errors = [];
    
    // Required field validation
    const requiredFields = [
        { id: 'firstName', name: 'First Name' },
        { id: 'lastName', name: 'Last Name' },
        { id: 'email', name: 'Email' },
        { id: 'phone', name: 'Phone' },
        { id: 'homeStreet', name: 'Home Street Address' },
        { id: 'homeCity', name: 'Home City' },
        { id: 'homeProvince', name: 'Home Province' },
        { id: 'homePostal', name: 'Home Postal Code' }
    ];
    
    // Check if business account and add required business fields
    const isBusinessAccount = document.querySelector('.account-type.active').dataset.type === 'business';
    if (isBusinessAccount) {
        requiredFields.push({ id: 'companyName', name: 'Company Name' });
    }
    
    requiredFields.forEach(field => {
        const element = document.getElementById(field.id);
        if (!element.value.trim()) {
            showFieldError(field.id, `${field.name} is required`);
            errors.push(`${field.name} is required`);
            isValid = false;
        } else {
            clearFieldError(field.id);
        }
    });
    
    // Validate email format
    if (!validateEmail()) {
        isValid = false;
        errors.push('Invalid email format');
    }
    
    // Validate phone format
    if (!validatePhone()) {
        isValid = false;
        errors.push('Invalid phone format');
    }
    
    // Validate postal codes
    const homePostal = document.getElementById('homePostal').value;
    if (homePostal && !validatePostalCode(homePostal)) {
        showFieldError('homePostal', 'Invalid postal code format (A1A 1A1)');
        isValid = false;
        errors.push('Invalid home postal code');
    }
    
    const sameAsHome = document.getElementById('sameAsHome').checked;
    if (!sameAsHome) {
        const shippingPostal = document.getElementById('shippingPostal').value;
        if (shippingPostal && !validatePostalCode(shippingPostal)) {
            showFieldError('shippingPostal', 'Invalid postal code format (A1A 1A1)');
            isValid = false;
            errors.push('Invalid shipping postal code');
        }
    }
    
    // Validate terms acceptance
    if (!document.getElementById('terms').checked) {
        isValid = false;
        errors.push('You must accept the Terms of Service');
    }
    
    // Validate at least one trade interest
    const tradeCheckboxes = document.querySelectorAll('input[name="trades"]:checked');
    if (tradeCheckboxes.length === 0) {
        isValid = false;
        errors.push('Please select at least one trade of interest');
    }
    
    return { isValid, errors };
}

async function handleFormSubmission(event) {
    event.preventDefault();
    
    const registerBtn = document.getElementById('register-btn');
    const formError = document.getElementById('form-error');
    const successMessage = document.getElementById('success-message');
    
    // Reset messages
    formError.style.display = 'none';
    successMessage.style.display = 'none';
    
    // Validate form
    const validation = validateForm();
    if (!validation.isValid) {
        formError.textContent = validation.errors.join(', ');
        formError.style.display = 'block';
        return;
    }
    
    // Disable submit button
    registerBtn.disabled = true;
    registerBtn.textContent = '⏳ Creating Account...';
    
    try {
        // Collect form data
        const formData = collectFormData();
        
        // Submit to registration system
        const result = await submitRegistration(formData);
        
        if (result.success) {
            // Show success message
            successMessage.innerHTML = `
                <strong>🎉 Account Created Successfully!</strong><br>
                Welcome ${formData.firstName}! Your 7-day free trial starts now.<br>
                <a href="index.html" style="color: #27ae60; font-weight: bold;">Continue to Exams →</a>
            `;
            successMessage.style.display = 'block';
            
            // Clear form
            document.getElementById('registration-form').reset();
            
            // Store user session
            localStorage.setItem('cfqBuddyUser', JSON.stringify({
                id: result.userId,
                name: `${formData.firstName} ${formData.lastName}`,
                email: formData.email,
                accountType: formData.accountType,
                trialStarted: Date.now(),
                trialExpiry: Date.now() + (7 * 24 * 60 * 60 * 1000)
            }));
            
        } else {
            throw new Error(result.message || 'Registration failed');
        }
        
    } catch (error) {
        console.error('Registration error:', error);
        formError.textContent = error.message || 'Registration failed. Please try again.';
        formError.style.display = 'block';
    } finally {
        // Re-enable submit button
        registerBtn.disabled = false;
        registerBtn.textContent = '🚀 Create Account & Start Trial';
    }
}

function collectFormData() {
    const accountType = document.querySelector('.account-type.active').dataset.type;
    const sameAsHome = document.getElementById('sameAsHome').checked;
    
    // Get selected trades
    const selectedTrades = Array.from(document.querySelectorAll('input[name="trades"]:checked'))
        .map(cb => cb.value);
    
    const formData = {
        // Account info
        accountType: accountType,
        
        // Personal info
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        
        // Home address
        homeAddress: {
            street: document.getElementById('homeStreet').value,
            city: document.getElementById('homeCity').value,
            province: document.getElementById('homeProvince').value,
            postalCode: document.getElementById('homePostal').value
        },
        
        // Shipping address
        shippingAddress: sameAsHome ? null : {
            street: document.getElementById('shippingStreet').value,
            city: document.getElementById('shippingCity').value,
            province: document.getElementById('shippingProvince').value,
            postalCode: document.getElementById('shippingPostal').value
        },
        
        // Tax info
        taxInfo: TAX_RATES[document.getElementById('homeProvince').value],
        
        // Trade interests
        trades: selectedTrades,
        
        // Marketing preferences
        marketingOptIn: document.getElementById('marketing').checked,
        
        // Registration timestamp
        registrationDate: new Date().toISOString()
    };
    
    // Add business info if business account
    if (accountType === 'business') {
        formData.businessInfo = {
            companyName: document.getElementById('companyName').value,
            businessNumber: document.getElementById('businessNumber').value,
            gstHst: document.getElementById('gstHst').value,
            industry: document.getElementById('industry').value
        };
    }
    
    return formData;
}

async function submitRegistration(formData) {
    // In a real implementation, this would submit to your backend
    // For now, we'll simulate the registration process
    
    return new Promise((resolve) => {
        setTimeout(() => {
            // Simulate successful registration
            resolve({
                success: true,
                userId: 'user_' + Date.now(),
                message: 'Account created successfully'
            });
        }, 1500);
    });
    
    // Real implementation would look like:
    /*
    const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    });
    
    return await response.json();
    */
}

// Utility functions for integration with existing trial system
function startTrialFromRegistration() {
    const userData = JSON.parse(localStorage.getItem('cfqBuddyUser'));
    if (userData) {
        // Create trial data in existing format
        const trialData = {
            name: userData.name,
            email: userData.email,
            startDate: userData.trialStarted,
            expiryDate: userData.trialExpiry,
            tradeType: userData.trades?.includes('309A') ? '309a' : '306a',
            isActive: true,
            userId: userData.id
        };
        
        localStorage.setItem('cfqBuddyTrial', JSON.stringify(trialData));
        
        // Redirect to appropriate exam page
        const redirectUrl = userData.trades?.includes('309A') ? 'index.html' : 'plumber.html';
        window.location.href = redirectUrl;
    }
}