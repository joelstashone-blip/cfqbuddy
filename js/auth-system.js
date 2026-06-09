// Authentication System - Site-wide login protection
// Handles user authentication, session management, and content access control

class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.userDatabase = this.loadUserDatabase();
        this.initializeAuth();
    }
    
    // Load user database from localStorage (simulates backend database)
    loadUserDatabase() {
        const stored = localStorage.getItem('cfqBuddyUserDatabase');
        if (stored) {
            return JSON.parse(stored);
        }
        
        // Default demo users
        const defaultDB = {
            'demo@cfqbuddy.ca': {
                id: 'user_demo',
                username: 'demo',
                email: 'demo@cfqbuddy.ca',
                password: 'demo123', // In real system, this would be hashed
                name: 'Demo User',
                accountType: 'personal',
                trades: ['309A', '306A', '307A'],
                trialStarted: Date.now(),
                trialExpiry: Date.now() + (7 * 24 * 60 * 60 * 1000),
                registeredDate: Date.now(),
                hasAccess: true
            }
        };
        
        this.saveUserDatabase(defaultDB);
        return defaultDB;
    }
    
    // Save user database to localStorage
    saveUserDatabase(database) {
        localStorage.setItem('cfqBuddyUserDatabase', JSON.stringify(database));
    }
    
    // Initialize authentication system
    initializeAuth() {
        // Check if user is logged in
        const userData = localStorage.getItem('cfqBuddyUser');
        if (userData) {
            try {
                this.currentUser = JSON.parse(userData);
                
                // Verify session is still valid
                if (this.isSessionValid()) {
                    console.log('✅ User authenticated:', this.currentUser.username || this.currentUser.email);
                    return true;
                } else {
                    console.log('❌ Session expired, logging out');
                    this.logout();
                    return false;
                }
            } catch (error) {
                console.error('Error parsing user data:', error);
                this.logout();
                return false;
            }
        }
        return false;
    }
    
    // Check if current session is valid
    isSessionValid() {
        if (!this.currentUser) return false;
        
        // Check if trial has expired
        if (this.currentUser.trialExpiry && Date.now() > this.currentUser.trialExpiry) {
            return false;
        }
        
        return true;
    }
    
    // Register new user
    async registerUser(userData) {
        const { username, email, password, name, accountType } = userData;
        
        // Check if username or email already exists
        const existingByEmail = Object.values(this.userDatabase).find(user => user.email === email);
        const existingByUsername = Object.values(this.userDatabase).find(user => user.username === username);
        
        if (existingByEmail) {
            throw new Error('An account with this email already exists');
        }
        
        if (existingByUsername) {
            throw new Error('This username is already taken');
        }
        
        // Create new user
        const userId = 'user_' + Date.now();
        const newUser = {
            id: userId,
            username: username.toLowerCase(),
            email: email.toLowerCase(),
            password: password, // In real system, hash this
            name: name,
            accountType: accountType || 'personal',
            trades: [],
            trialStarted: Date.now(),
            trialExpiry: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
            registeredDate: Date.now(),
            hasAccess: true
        };
        
        // Add to database
        this.userDatabase[email] = newUser;
        this.saveUserDatabase(this.userDatabase);
        
        return newUser;
    }
    
    // Login user
    async login(identifier, password) {
        // identifier can be username or email
        const user = this.findUserByIdentifier(identifier);
        
        if (!user) {
            throw new Error('User not found');
        }
        
        if (user.password !== password) {
            throw new Error('Invalid password');
        }
        
        // Check if trial has expired
        if (user.trialExpiry && Date.now() > user.trialExpiry && !user.hasAccess) {
            throw new Error('Your trial has expired. Please purchase access to continue.');
        }
        
        // Login successful
        this.currentUser = user;
        localStorage.setItem('cfqBuddyUser', JSON.stringify(user));
        
        console.log('✅ Login successful:', user.username);
        return user;
    }
    
    // Find user by username or email
    findUserByIdentifier(identifier) {
        const lowerIdentifier = identifier.toLowerCase();
        
        // Try finding by email first
        let user = this.userDatabase[lowerIdentifier];
        if (user) return user;
        
        // Try finding by username
        user = Object.values(this.userDatabase).find(u => u.username === lowerIdentifier);
        return user;
    }
    
    // Logout user
    logout() {
        this.currentUser = null;
        localStorage.removeItem('cfqBuddyUser');
        console.log('👋 User logged out');
        
        // Redirect to login page if not already there
        if (!window.location.pathname.includes('login.html') && 
            !window.location.pathname.includes('register.html') &&
            !window.location.pathname.includes('index.html')) {
            window.location.href = 'login.html';
        }
    }
    
    // Check if user is logged in
    isLoggedIn() {
        return this.currentUser !== null && this.isSessionValid();
    }
    
    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }
    
    // Check if user has access to specific content
    hasAccess(tradeCode = null) {
        if (!this.isLoggedIn()) return false;
        
        // Check if trial expired
        if (this.currentUser.trialExpiry && Date.now() > this.currentUser.trialExpiry) {
            return this.currentUser.hasAccess;
        }
        
        return true; // Trial or paid access
    }
    
    // Require authentication - call this on protected pages
    requireAuth() {
        if (!this.isLoggedIn()) {
            console.log('🔒 Authentication required, redirecting to login');
            
            // Store current page for redirect after login
            localStorage.setItem('cfqBuddyRedirectAfterLogin', window.location.pathname);
            
            // Redirect to login
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }
    
    // Show/hide content based on authentication
    updateUIForAuth() {
        const user = this.getCurrentUser();
        
        if (user) {
            // Update user info displays
            const userNameElements = document.querySelectorAll('.user-name');
            userNameElements.forEach(el => {
                el.textContent = user.name || user.username;
            });
            
            const usernameElements = document.querySelectorAll('.username');
            usernameElements.forEach(el => {
                el.textContent = '@' + user.username;
            });
            
            // Show/hide auth-related elements
            const loginElements = document.querySelectorAll('.show-when-logged-out');
            loginElements.forEach(el => el.style.display = 'none');
            
            const loggedInElements = document.querySelectorAll('.show-when-logged-in');
            loggedInElements.forEach(el => el.style.display = 'block');
            
            // Add logout functionality
            const logoutButtons = document.querySelectorAll('.logout-btn');
            logoutButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.logout();
                });
            });
        }
    }
}

// Global auth system
window.authSystem = new AuthSystem();

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Update UI for authentication state
    window.authSystem.updateUIForAuth();
    
    // Require auth for protected pages (exclude public pages)
    const publicPages = ['login.html', 'register.html', 'privacy-policy.html', 'terms-of-service.html'];
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // If it's the root index.html, allow access (it's the marketing page)
    // But protect exam content and gamification
    if (!publicPages.includes(currentPage)) {
        if (currentPage.includes('exam') || 
            currentPage.includes('gamified') || 
            currentPage.includes('plumber.html') ||
            (currentPage === 'index.html' && window.location.hash)) {
            window.authSystem.requireAuth();
        }
    }
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthSystem;
}