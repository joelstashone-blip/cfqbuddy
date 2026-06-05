// Gumroad Overlay Integration
// Seamless checkout without leaving cfqbuddy.ca

// Gumroad Product Mapping
const GUMROAD_PRODUCTS = {
    // 309A Electrician Products
    'rxcya': {
        url: 'https://309aprep.gumroad.com/l/rxcya',
        title: '309A Single Exam - $15 CAD',
        description: 'One complete 150-question exam with explanations'
    },
    'urslua': {
        url: 'https://309aprep.gumroad.com/l/urslua', 
        title: '309A 3-Exam Pack - $35 CAD',
        description: 'Three complete practice exams (Most Popular)'
    },
    'cntarz': {
        url: 'https://309aprep.gumroad.com/l/cntarz',
        title: '309A Complete Bundle - $59 CAD', 
        description: 'All practice materials + advanced features'
    },
    '309a-single': {
        url: 'https://cfqbuddy.gumroad.com/l/309a-single',
        title: '309A Full Access - $79 CAD',
        description: 'Lifetime access to all 309A materials'
    },
    
    // 306A Plumber Products  
    'plumber1': {
        url: 'https://309aprep.gumroad.com/l/plumber1',
        title: '306A Single Exam - $15 CAD',
        description: 'One complete 150-question plumber exam'
    },
    'plumber3': {
        url: 'https://309aprep.gumroad.com/l/plumber3',
        title: '306A 3-Exam Pack - $35 CAD', 
        description: 'Three complete plumber practice exams'
    },
    'plumber-bundle': {
        url: 'https://309aprep.gumroad.com/l/plumber-bundle',
        title: '306A Complete Bundle - $59 CAD',
        description: 'All plumber practice materials + advanced features'
    },
    '306a-single': {
        url: 'https://cfqbuddy.gumroad.com/l/306a-single', 
        title: '306A Full Access - $79 CAD',
        description: 'Lifetime access to all 306A materials'
    }
};

// Create overlay HTML structure
function createGumroadOverlay() {
    const overlayHTML = `
        <div id="gumroad-overlay" class="gumroad-overlay" style="display: none;">
            <div class="gumroad-overlay-backdrop" onclick="closeGumroadOverlay()"></div>
            <div class="gumroad-overlay-container">
                <div class="gumroad-overlay-header">
                    <h3 id="gumroad-product-title">Complete Your Purchase</h3>
                    <button onclick="closeGumroadOverlay()" class="gumroad-close-btn">&times;</button>
                </div>
                <div class="gumroad-overlay-content">
                    <p id="gumroad-product-description">Secure checkout powered by Gumroad</p>
                    <div class="gumroad-benefits">
                        <div class="benefit-item">✅ <strong>Instant Access</strong> - License key emailed immediately</div>
                        <div class="benefit-item">✅ <strong>Lifetime Access</strong> - No subscriptions, buy once keep forever</div>
                        <div class="benefit-item">✅ <strong>30-Day Guarantee</strong> - Full refund if not satisfied</div>
                        <div class="benefit-item">✅ <strong>Canadian Taxes Included</strong> - Final price, no surprises</div>
                    </div>
                    <iframe id="gumroad-iframe" src="" frameborder="0" width="100%" height="400"></iframe>
                    <div class="gumroad-loading">
                        <div class="loading-spinner"></div>
                        <p>Loading secure checkout...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add to page if not already present
    if (!document.getElementById('gumroad-overlay')) {
        document.body.insertAdjacentHTML('beforeend', overlayHTML);
        addGumroadOverlayStyles();
    }
}

// Add CSS styles for the overlay
function addGumroadOverlayStyles() {
    const styles = `
        <style id="gumroad-overlay-styles">
        .gumroad-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 10000;
            animation: fadeIn 0.3s ease-out;
        }
        
        .gumroad-overlay-backdrop {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(4px);
        }
        
        .gumroad-overlay-container {
            position: relative;
            width: 90%;
            max-width: 600px;
            max-height: 90vh;
            margin: 5vh auto;
            background: #fff;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            overflow: hidden;
            animation: slideUp 0.3s ease-out;
        }
        
        .gumroad-overlay-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .gumroad-overlay-header h3 {
            margin: 0;
            font-size: 20px;
            font-weight: 600;
        }
        
        .gumroad-close-btn {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            font-size: 18px;
            cursor: pointer;
            transition: background 0.2s;
        }
        
        .gumroad-close-btn:hover {
            background: rgba(255, 255, 255, 0.3);
        }
        
        .gumroad-overlay-content {
            padding: 0;
            position: relative;
        }
        
        .gumroad-benefits {
            padding: 20px;
            background: #f8f9fa;
            border-bottom: 1px solid #e9ecef;
        }
        
        .benefit-item {
            margin: 8px 0;
            font-size: 14px;
            color: #333;
        }
        
        .gumroad-loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            z-index: 1;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 15px;
        }
        
        #gumroad-iframe {
            min-height: 400px;
            border: none;
            background: white;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes slideUp {
            from { 
                opacity: 0;
                transform: translateY(50px) scale(0.95);
            }
            to { 
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        /* Mobile Responsive */
        @media (max-width: 768px) {
            .gumroad-overlay-container {
                width: 95%;
                margin: 2vh auto;
                max-height: 96vh;
            }
            
            .gumroad-overlay-header {
                padding: 15px;
            }
            
            .gumroad-overlay-header h3 {
                font-size: 18px;
            }
            
            .gumroad-benefits {
                padding: 15px;
            }
            
            .benefit-item {
                font-size: 13px;
            }
        }
        
        /* Button styles to match existing design */
        .btn-buy, .btn-demo.purchase-btn {
            cursor: pointer;
            border: none;
            transition: all 0.2s ease;
        }
        
        .btn-buy:hover, .btn-demo.purchase-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        /* Purchase Success Notification */
        .purchase-success {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 11000;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease-out;
        }
        
        .success-content {
            background: white;
            padding: 40px;
            border-radius: 12px;
            text-align: center;
            max-width: 400px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        
        .success-icon {
            font-size: 48px;
            margin-bottom: 20px;
        }
        
        .success-content h3 {
            color: #4caf50;
            margin: 0 0 15px 0;
        }
        
        .btn-success {
            background: #4caf50;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            margin-top: 20px;
        }
        
        .btn-success:hover {
            background: #45a049;
        }
        </style>
    `;
    
    if (!document.getElementById('gumroad-overlay-styles')) {
        document.head.insertAdjacentHTML('beforeend', styles);
    }
}

// Open Gumroad overlay with specific product
function openGumroadOverlay(productId) {
    const product = GUMROAD_PRODUCTS[productId];
    
    if (!product) {
        console.error('Product not found:', productId);
        // Fallback to direct Gumroad link
        window.open('https://309aprep.gumroad.com/', '_blank');
        return;
    }
    
    // Create overlay if it doesn't exist
    createGumroadOverlay();
    
    // Update product details
    document.getElementById('gumroad-product-title').textContent = product.title;
    document.getElementById('gumroad-product-description').textContent = product.description;
    
    // Show overlay
    const overlay = document.getElementById('gumroad-overlay');
    overlay.style.display = 'block';
    
    // Prevent body scrolling
    document.body.style.overflow = 'hidden';
    
    // Load Gumroad checkout in iframe
    const iframe = document.getElementById('gumroad-iframe');
    const loading = overlay.querySelector('.gumroad-loading');
    
    // Show loading state
    loading.style.display = 'block';
    iframe.style.opacity = '0';
    
    // Set iframe source with embed parameters
    const embedUrl = `${product.url}?embed=true&as_embed=true`;
    iframe.src = embedUrl;
    
    // Handle iframe load
    iframe.onload = function() {
        setTimeout(() => {
            loading.style.display = 'none';
            iframe.style.opacity = '1';
        }, 1000);
    };
    
    // Track overlay open event
    if (typeof gtag !== 'undefined') {
        gtag('event', 'begin_checkout', {
            currency: 'CAD',
            value: parsePrice(product.title),
            items: [{
                item_id: productId,
                item_name: product.title,
                category: 'exam_prep',
                quantity: 1
            }]
        });
    }
}

// Close Gumroad overlay
function closeGumroadOverlay() {
    const overlay = document.getElementById('gumroad-overlay');
    if (overlay) {
        overlay.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Clear iframe to stop any ongoing processes
        const iframe = document.getElementById('gumroad-iframe');
        if (iframe) {
            iframe.src = 'about:blank';
        }
    }
}

// Extract price from title for analytics
function parsePrice(title) {
    const match = title.match(/\$(\d+)/);
    return match ? parseInt(match[1]) : 0;
}

// Handle escape key to close overlay
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeGumroadOverlay();
    }
});

// Listen for Gumroad purchase completion messages
window.addEventListener('message', function(event) {
    // Gumroad sends success messages when purchase completes
    if (event.origin === 'https://gumroad.com' && event.data && event.data.type === 'purchase_success') {
        // Close overlay and show success message
        closeGumroadOverlay();
        
        // Show success notification
        showPurchaseSuccess(event.data);
        
        // Track purchase completion
        if (typeof gtag !== 'undefined') {
            gtag('event', 'purchase', {
                transaction_id: event.data.transaction_id,
                currency: 'CAD',
                value: event.data.amount
            });
        }
    }
});

// Show purchase success notification
function showPurchaseSuccess(data) {
    const successHTML = `
        <div id="purchase-success-notification" class="purchase-success">
            <div class="success-content">
                <div class="success-icon">🎉</div>
                <h3>Purchase Successful!</h3>
                <p>Check your email for your license key and access instructions.</p>
                <button onclick="closePurchaseSuccess()" class="btn-success">Continue</button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', successHTML);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        closePurchaseSuccess();
    }, 10000);
}

// Close purchase success notification
function closePurchaseSuccess() {
    const notification = document.getElementById('purchase-success-notification');
    if (notification) {
        notification.remove();
    }
}

// Initialize overlay system when page loads
document.addEventListener('DOMContentLoaded', function() {
    createGumroadOverlay();
});