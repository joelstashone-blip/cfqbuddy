// Embedded Native Checkout - Direct Integration
// This version embeds directly in the page with zero dependencies

function initializeNativeCheckout() {
    const products = {
        'rxcya': {
            name: '309A Single Exam',
            price: '$15 CAD',
            description: '150 practice questions with detailed explanations',
            gumroadUrl: 'https://309aprep.gumroad.com/l/rxcya?embedded=true'
        },
        'urslua': {
            name: '309A 3-Exam Pack',
            price: '$35 CAD',
            description: 'Three complete practice exams (450 questions)',
            gumroadUrl: 'https://309aprep.gumroad.com/l/urslua?embedded=true'
        },
        'cntarz': {
            name: '309A Complete Bundle',
            price: '$59 CAD',
            description: 'All exams + bonus materials + lifetime access',
            gumroadUrl: 'https://309aprep.gumroad.com/l/cntarz?embedded=true'
        },
        'plumber1': {
            name: '306A Single Exam',
            price: '$15 CAD',
            description: '150 plumbing practice questions with NPC references',
            gumroadUrl: 'https://309aprep.gumroad.com/l/plumber1?embedded=true'
        },
        'plumber3': {
            name: '306A 3-Exam Pack',
            price: '$35 CAD',
            description: 'Three complete plumber practice exams (450 questions)',
            gumroadUrl: 'https://309aprep.gumroad.com/l/plumber3?embedded=true'
        },
        'plumber-bundle': {
            name: '306A Complete Bundle',
            price: '$59 CAD',
            description: 'All plumber exams + bonus materials + lifetime access',
            gumroadUrl: 'https://309aprep.gumroad.com/l/plumber-bundle?embedded=true'
        }
    };

    // Replace all purchase buttons with native checkout
    document.querySelectorAll('button[data-product-id]').forEach(button => {
        const productId = button.getAttribute('data-product-id');
        if (products[productId]) {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                showNativeCheckout(productId, products[productId]);
            });
        }
    });
}

function showNativeCheckout(productId, product) {
    // Hide any existing checkouts
    document.querySelectorAll('.native-checkout-container').forEach(el => el.remove());
    
    // Create checkout HTML
    const checkoutHtml = `
        <div class="native-checkout-container" id="checkout-${productId}">
            <div class="checkout-header">
                <h3>🛒 Complete Your Purchase</h3>
                <button class="close-checkout" onclick="hideNativeCheckout('${productId}')">✕</button>
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
                    src="${product.gumroadUrl}"
                    frameborder="0"
                    allowtransparency="true"
                    width="100%"
                    height="600"
                    style="border: none; background: white;">
                </iframe>
            </div>
            
            <div class="security-info">
                <div class="security-item">🔒 <strong>Secure Payment</strong> - Protected by Gumroad's PCI-compliant processing</div>
                <div class="security-item">📧 <strong>Instant Delivery</strong> - License key sent to your email immediately</div>
            </div>
        </div>
    `;
    
    // Find insertion point (after pricing section)
    const pricingSection = document.querySelector('#pricing-section') || 
                          document.querySelector('.pricing') || 
                          document.querySelector('main') || 
                          document.body;
    
    pricingSection.insertAdjacentHTML('afterend', checkoutHtml);
    
    // Smooth scroll to checkout
    const checkoutElement = document.getElementById(`checkout-${productId}`);
    checkoutElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Add animation
    setTimeout(() => {
        checkoutElement.style.opacity = '1';
        checkoutElement.style.transform = 'translateY(0)';
    }, 100);
}

function hideNativeCheckout(productId) {
    const checkout = document.getElementById(`checkout-${productId}`);
    if (checkout) {
        checkout.style.opacity = '0';
        checkout.style.transform = 'translateY(-20px)';
        setTimeout(() => checkout.remove(), 300);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeNativeCheckout);
} else {
    initializeNativeCheckout();
}