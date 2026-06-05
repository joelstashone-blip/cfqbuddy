// Native Checkout System - Zero Popups, Zero Redirects
// Seamless Gumroad integration that feels completely native to cfqbuddy.ca

class NativeCheckout {
    constructor() {
        this.products = {
            // 309A Products
            'rxcya': {
                name: '309A Single Exam',
                price: '$15 CAD',
                description: '150 practice questions with detailed explanations',
                gumroadUrl: 'https://309aprep.gumroad.com/l/rxcya'
            },
            'urslua': {
                name: '309A 3-Exam Pack',
                price: '$35 CAD',
                description: 'Three complete practice exams (450 questions)',
                gumroadUrl: 'https://309aprep.gumroad.com/l/urslua'
            },
            'cntarz': {
                name: '309A Complete Bundle',
                price: '$59 CAD',
                description: 'All exams + bonus materials + lifetime access',
                gumroadUrl: 'https://309aprep.gumroad.com/l/cntarz'
            },
            
            // 306A Products  
            'plumber1': {
                name: '306A Single Exam',
                price: '$15 CAD',
                description: '150 plumbing practice questions with NPC references',
                gumroadUrl: 'https://309aprep.gumroad.com/l/plumber1'
            },
            'plumber3': {
                name: '306A 3-Exam Pack', 
                price: '$35 CAD',
                description: 'Three complete plumber practice exams (450 questions)',
                gumroadUrl: 'https://309aprep.gumroad.com/l/plumber3'
            },
            'plumber-bundle': {
                name: '306A Complete Bundle',
                price: '$59 CAD', 
                description: 'All plumber exams + bonus materials + lifetime access',
                gumroadUrl: 'https://309aprep.gumroad.com/l/plumber-bundle'
            }
        };
        
        this.initializeNativeCheckout();
    }
    
    initializeNativeCheckout() {
        // Replace all existing purchase buttons with native checkout
        document.addEventListener('DOMContentLoaded', () => {
            this.replacePurchaseButtons();
        });
        
        // If DOM already loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.replacePurchaseButtons());
        } else {
            this.replacePurchaseButtons();
        }
    }
    
    replacePurchaseButtons() {
        // Find all purchase buttons and replace with native checkout
        const buttons = document.querySelectorAll('button[onclick*="openGumroadOverlay"], .purchase-button, .btn-purchase');
        
        buttons.forEach(button => {
            // Extract product ID from onclick or data attributes
            const productId = this.extractProductId(button);
            if (productId && this.products[productId]) {
                button.onclick = (e) => {
                    e.preventDefault();
                    this.showNativeCheckout(productId);
                };
            }
        });
    }
    
    extractProductId(button) {
        // Try to extract product ID from various sources
        if (button.onclick) {
            const onclickStr = button.onclick.toString();
            const match = onclickStr.match(/openGumroadOverlay\(['"](\w+)['"]\)/);
            if (match) return match[1];
        }
        
        return button.dataset.productId || button.dataset.product;
    }
    
    showNativeCheckout(productId) {
        const product = this.products[productId];
        if (!product) return;
        
        // Create native checkout section that slides down seamlessly
        const checkoutHtml = `
            <div id="native-checkout-${productId}" class="native-checkout-container">
                <div class="checkout-header">
                    <h3>🛒 Complete Your Purchase</h3>
                    <button class="close-checkout" onclick="nativeCheckout.hideCheckout('${productId}')">✕</button>
                </div>
                
                <div class="product-summary">
                    <div class="product-info">
                        <h4>${product.name}</h4>
                        <p>${product.description}</p>
                        <div class="price">${product.price}</div>
                    </div>
                </div>
                
                <div class="checkout-benefits">
                    <div class="benefit-item">✅ <strong>Instant Access</strong> - License key emailed immediately</div>
                    <div class="benefit-item">✅ <strong>Lifetime Access</strong> - No subscriptions, buy once keep forever</div>
                    <div class="benefit-item">✅ <strong>30-Day Guarantee</strong> - Full refund if not satisfied</div>
                    <div class="benefit-item">✅ <strong>Canadian Taxes Included</strong> - Final price, no surprises</div>
                </div>
                
                <div class="gumroad-embed-container">
                    <iframe 
                        id="gumroad-checkout-${productId}"
                        src="${product.gumroadUrl}?embedded=true&as_embed=true"
                        frameborder="0"
                        allowtransparency="true"
                        width="100%"
                        height="600">
                    </iframe>
                </div>
                
                <div class="security-info">
                    <div class="security-item">🔒 <strong>Secure Payment</strong> - Protected by Gumroad's PCI-compliant processing</div>
                    <div class="security-item">📧 <strong>Instant Delivery</strong> - License key sent to your email immediately</div>
                </div>
            </div>
        `;
        
        // Find the purchase button's parent section and insert checkout below it
        const targetSection = this.findTargetSection(productId);
        targetSection.insertAdjacentHTML('afterend', checkoutHtml);
        
        // Smooth scroll to checkout
        const checkoutElement = document.getElementById(`native-checkout-${productId}`);
        checkoutElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Add animation class for slide-down effect
        setTimeout(() => {
            checkoutElement.classList.add('checkout-visible');
        }, 100);
        
        // Hide any other open checkouts
        this.hideOtherCheckouts(productId);
    }
    
    findTargetSection(productId) {
        // Find the appropriate section to insert checkout
        // Look for pricing section or the parent of purchase buttons
        const pricingSection = document.querySelector('.pricing-section, .choose-plan, [class*="plan"]');
        if (pricingSection) return pricingSection;
        
        // Fallback to a main content area
        return document.querySelector('main, .container, body > div') || document.body;
    }
    
    hideCheckout(productId) {
        const checkout = document.getElementById(`native-checkout-${productId}`);
        if (checkout) {
            checkout.classList.add('checkout-hiding');
            setTimeout(() => {
                checkout.remove();
            }, 300);
        }
    }
    
    hideOtherCheckouts(currentProductId) {
        const allCheckouts = document.querySelectorAll('.native-checkout-container');
        allCheckouts.forEach(checkout => {
            if (!checkout.id.includes(currentProductId)) {
                checkout.classList.add('checkout-hiding');
                setTimeout(() => {
                    checkout.remove();
                }, 300);
            }
        });
    }
    
    // Handle successful purchase (called by Gumroad postMessage)
    handlePurchaseSuccess(data) {
        // Show success message
        const successHtml = `
            <div class="purchase-success-banner">
                <div class="success-content">
                    <h3>🎉 Purchase Successful!</h3>
                    <p>Check your email for your license key and access instructions.</p>
                    <div class="success-actions">
                        <button onclick="window.location.reload()" class="btn-primary">Unlock Your Exams</button>
                        <button onclick="this.parentElement.parentElement.parentElement.remove()" class="btn-secondary">Continue Browsing</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('afterbegin', successHtml);
        
        // Auto-scroll to license key section
        setTimeout(() => {
            const licenseSection = document.querySelector('#license-key-section, [class*="license"], [class*="unlock"]');
            if (licenseSection) {
                licenseSection.scrollIntoView({ behavior: 'smooth' });
            }
        }, 2000);
    }
}

// Initialize native checkout system
const nativeCheckout = new NativeCheckout();

// Listen for Gumroad postMessage events
window.addEventListener('message', function(event) {
    if (event.origin === 'https://gumroad.com' || event.origin === 'https://app.gumroad.com') {
        if (event.data.type === 'gumroad:purchase_completed') {
            nativeCheckout.handlePurchaseSuccess(event.data);
        }
    }
});

// Auto-replace buttons when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => nativeCheckout.replacePurchaseButtons(), 500);
    });
} else {
    setTimeout(() => nativeCheckout.replacePurchaseButtons(), 500);
}