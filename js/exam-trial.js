// 309A Practice Exam Platform - 7-DAY FREE TRIAL VERSION
// State
let examData = null;
let currentQuestion = 0;
let answers = {};
let flagged = new Set();
let timerInterval = null;
let timeRemaining = 0;
let examStarted = false;

let isDemo = false;
let isTrialMode = false;

// Trial Management System
const TRIAL_STORAGE_KEY = 'redSealAcademyTrial';
const TRIAL_DURATION_DAYS = 7;

// Trial Management Functions
function initializeTrial() {
    const trialData = getTrialData();
    
    if (!trialData) {
        // First visit - start new trial
        const trialStart = new Date().toISOString();
        const trialEnd = new Date(Date.now() + (TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000)).toISOString();
        
        const newTrial = {
            startDate: trialStart,
            endDate: trialEnd,
            isActive: true
        };
        
        localStorage.setItem(TRIAL_STORAGE_KEY, JSON.stringify(newTrial));
        updateTrialUI(TRIAL_DURATION_DAYS);
        return true; // Trial is active
    }
    
    // Check if existing trial is still valid
    const now = new Date();
    const trialEndDate = new Date(trialData.endDate);
    
    if (now <= trialEndDate && trialData.isActive) {
        // Trial still active
        const daysRemaining = Math.ceil((trialEndDate - now) / (24 * 60 * 60 * 1000));
        updateTrialUI(daysRemaining);
        return true;
    } else {
        // Trial expired
        updateTrialUI(0);
        return false;
    }
}

function getTrialData() {
    try {
        const data = localStorage.getItem(TRIAL_STORAGE_KEY);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error('Error reading trial data:', e);
        return null;
    }
}

function updateTrialUI(daysRemaining) {
    const trialBanner = document.getElementById('trial-banner');
    const trialStatus = document.getElementById('trial-status');
    
    if (daysRemaining > 0) {
        // Active trial
        if (trialBanner) {
            trialBanner.style.display = 'block';
            trialBanner.innerHTML = `
                <div class="trial-banner-content">
                    🎯 <strong>FREE TRIAL ACTIVE</strong> • ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining
                    <span class="trial-features">Full Access • All 450 Questions • Complete Exam Simulations</span>
                </div>
            `;
        }
        
        if (trialStatus) {
            trialStatus.innerHTML = `
                <div class="trial-status-active">
                    ✅ <strong>Trial Active:</strong> ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} of full access remaining
                </div>
            `;
        }
    } else {
        // Trial expired
        if (trialBanner) {
            trialBanner.style.display = 'block';
            trialBanner.innerHTML = `
                <div class="trial-banner-expired">
                    ⏰ <strong>FREE TRIAL ENDED</strong> • Continue with full access for $79 CAD
                    <a href="#upgrade" class="trial-upgrade-btn">Continue Full Access →</a>
                </div>
            `;
        }
        
        if (trialStatus) {
            trialStatus.innerHTML = `
                <div class="trial-status-expired">
                    🔒 <strong>Trial Expired:</strong> Purchase full access to continue your Red Seal preparation
                </div>
            `;
        }
    }
}

// Gumroad product permalinks → tier mapping
const PRODUCT_TIERS = {
    'rxcya': 'single',      // Single Practice Exam
    'urslua': 'pack3',      // 3-Exam Pack
    'cntarz': 'bundle'      // Complete Bundle
};

// Which exams each tier unlocks
const TIER_ACCESS = {
    single: ['exam1'],
    pack3: ['exam1', 'exam2', 'exam3'],
    bundle: ['exam1', 'exam2', 'exam3']
};

let activeTier = null;

// Modified demo mode — now handles trial access
async function startTrialOrDemo(examType = 'exam1') {
    const trialActive = initializeTrial();
    
    if (trialActive) {
        // Full trial access - load complete exam
        isTrialMode = true;
        isDemo = false;
        try {
            const res = await fetch(`data/${examType}.json`);
            examData = await res.json();
            startExam();
        } catch (e) {
            alert('Failed to load exam. Please try again.');
            console.error(e);
        }
    } else {
        // Trial expired - show upgrade screen
        showTrialExpiredScreen();
    }
}

// Original demo mode for comparison (10 questions only)
async function startLimitedDemo() {
    isDemo = true;
    isTrialMode = false;
    try {
        const res = await fetch('data/demo-questions.json');
        examData = await res.json();
        startExam();
    } catch (e) {
        alert('Failed to load demo. Please try again.');
        console.error(e);
    }
}

function showTrialExpiredScreen() {
    document.getElementById('welcome-screen').style.display = 'none';
    document.getElementById('trial-expired-screen').style.display = 'block';
}

// Validate license key via Gumroad License Verify API
async function validateCode() {
    const licenseKey = document.getElementById('access-code').value.trim();
    const btn = document.getElementById('btn-start');
    const statusEl = document.getElementById('license-status');

    if (!licenseKey) {
        showLicenseStatus('Please enter your license key from your Gumroad receipt.', 'error');
        return;
    }

    // Show loading state
    btn.disabled = true;
    btn.textContent = '🔄 Verifying...';
    showLicenseStatus('Verifying your license key with Gumroad...', 'info');

    // Try each product permalink until we find a match
    let verified = false;
    let tier = null;
    let productName = '';

    for (const [permalink, productTier] of Object.entries(PRODUCT_TIERS)) {
        try {
            const response = await fetch('https://api.gumroad.com/v2/licenses/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `product_id=${permalink}&license_key=${encodeURIComponent(licenseKey)}`
            });

            const data = await response.json();

            if (data.success) {
                verified = true;
                tier = productTier;
                productName = data.purchase?.product_name || permalink;

                // Check if license is disabled
                if (data.purchase?.license_disabled) {
                    showLicenseStatus('This license key has been disabled. Please contact support.', 'error');
                    btn.disabled = false;
                    btn.textContent = 'Unlock & Start Exam';
                    return;
                }

                // Check if refunded
                if (data.purchase?.refunded) {
                    showLicenseStatus('This purchase has been refunded. The license is no longer valid.', 'error');
                    btn.disabled = false;
                    btn.textContent = 'Unlock & Start Exam';
                    return;
                }

                break;
            }
        } catch (e) {
            console.error(`License check failed for ${permalink}:`, e);
        }
    }

    if (verified) {
        // Valid license - upgrade from trial to full access
        activeTier = tier;
        
        // Mark trial as completed (user now has permanent access)
        const trialData = getTrialData();
        if (trialData) {
            trialData.isActive = false;
            trialData.upgradeDate = new Date().toISOString();
            localStorage.setItem(TRIAL_STORAGE_KEY, JSON.stringify(trialData));
        }
        
        showLicenseStatus(`✅ License verified! Welcome to ${productName}. Starting your exam...`, 'success');
        
        setTimeout(() => {
            document.getElementById('welcome-screen').style.display = 'none';
            document.getElementById('exam-menu-screen').style.display = 'block';
        }, 1500);
    } else {
        showLicenseStatus('❌ License key not found. Please check your Gumroad receipt and try again.', 'error');
        btn.disabled = false;
        btn.textContent = 'Unlock & Start Exam';
    }
}

function showLicenseStatus(message, type) {
    const statusEl = document.getElementById('license-status');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.className = `license-status ${type}`;
        statusEl.style.display = 'block';
    }
}

// Modified exam selection to respect trial/license status
async function selectExam(examNum) {
    const trialActive = initializeTrial();
    
    if (trialActive || activeTier) {
        // Trial active or valid license - proceed
        await loadExam(examNum);
    } else {
        // Need to purchase
        showTrialExpiredScreen();
    }
}

// Load exam data
async function loadExam(examNum) {
    try {
        const response = await fetch(`data/exam${examNum}.json`);
        examData = await response.json();
        startExam();
    } catch (error) {
        console.error('Error loading exam:', error);
        alert('Failed to load exam. Please try again.');
    }
}

// Start exam
function startExam() {
    document.getElementById('welcome-screen').style.display = 'none';
    document.getElementById('exam-menu-screen').style.display = 'none';
    document.getElementById('trial-expired-screen').style.display = 'none';
    document.getElementById('exam-container').style.display = 'block';
    
    // Initialize exam state
    currentQuestion = 0;
    answers = {};
    flagged = new Set();
    examStarted = true;
    
    // Set timer based on mode
    if (isDemo) {
        timeRemaining = 10 * 60; // 10 minutes for demo
    } else if (isTrialMode) {
        timeRemaining = 4 * 60 * 60; // 4 hours for trial (full exam)
    } else {
        timeRemaining = 4 * 60 * 60; // 4 hours for licensed version
    }
    
    startTimer();
    displayQuestion();
    updateProgress();
}

// Timer functions
function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();
        
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            alert('Time is up! Your exam will now be submitted.');
            submitExam();
        }
    }, 1000);
    
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const hours = Math.floor(timeRemaining / 3600);
    const minutes = Math.floor((timeRemaining % 3600) / 60);
    const seconds = timeRemaining % 60;
    
    const display = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('timer').textContent = display;
    
    // Warning colors
    if (timeRemaining <= 300) { // 5 minutes
        document.getElementById('timer').style.color = '#ef4444';
    } else if (timeRemaining <= 1800) { // 30 minutes
        document.getElementById('timer').style.color = '#f59e0b';
    }
}

// Display current question
function displayQuestion() {
    const question = examData.questions[currentQuestion];
    
    document.getElementById('question-number').textContent = currentQuestion + 1;
    document.getElementById('total-questions').textContent = examData.questions.length;
    document.getElementById('question-text').textContent = question.question;
    
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    
    question.options.forEach((option, index) => {
        const div = document.createElement('div');
        div.className = 'option';
        
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'answer';
        radio.value = index;
        radio.id = `option-${index}`;
        
        const savedAnswer = answers[currentQuestion];
        if (savedAnswer !== undefined && savedAnswer === index) {
            radio.checked = true;
        }
        
        radio.addEventListener('change', () => {
            answers[currentQuestion] = index;
            updateProgress();
        });
        
        const label = document.createElement('label');
        label.htmlFor = `option-${index}`;
        label.textContent = option;
        
        div.appendChild(radio);
        div.appendChild(label);
        optionsContainer.appendChild(div);
    });
    
    // Update flag button
    const flagBtn = document.getElementById('flag-question');
    if (flagged.has(currentQuestion)) {
        flagBtn.textContent = '🏳️ Unflag';
        flagBtn.classList.add('flagged');
    } else {
        flagBtn.textContent = '🏁 Flag for Review';
        flagBtn.classList.remove('flagged');
    }
    
    // Update navigation buttons
    document.getElementById('prev-question').disabled = currentQuestion === 0;
    document.getElementById('next-question').disabled = currentQuestion === examData.questions.length - 1;
}

// Navigation functions
function previousQuestion() {
    if (currentQuestion > 0) {
        currentQuestion--;
        displayQuestion();
        updateProgress();
    }
}

function nextQuestion() {
    if (currentQuestion < examData.questions.length - 1) {
        currentQuestion++;
        displayQuestion();
        updateProgress();
    }
}

function jumpToQuestion(questionNum) {
    currentQuestion = questionNum - 1;
    displayQuestion();
    updateProgress();
    
    // Close modal
    document.getElementById('progress-modal').style.display = 'none';
}

// Flag question for review
function flagQuestion() {
    if (flagged.has(currentQuestion)) {
        flagged.delete(currentQuestion);
    } else {
        flagged.add(currentQuestion);
    }
    displayQuestion();
    updateProgress();
}

// Update progress display
function updateProgress() {
    const answered = Object.keys(answers).length;
    const total = examData.questions.length;
    const percentage = Math.round((answered / total) * 100);
    
    document.getElementById('progress-bar').style.width = `${percentage}%`;
    document.getElementById('progress-text').textContent = `${answered}/${total} answered (${percentage}%)`;
    
    // Update question grid in modal
    updateQuestionGrid();
}

function updateQuestionGrid() {
    const grid = document.getElementById('question-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    for (let i = 0; i < examData.questions.length; i++) {
        const button = document.createElement('button');
        button.textContent = i + 1;
        button.className = 'question-nav-btn';
        
        if (answers[i] !== undefined) {
            button.classList.add('answered');
        }
        
        if (flagged.has(i)) {
            button.classList.add('flagged');
        }
        
        if (i === currentQuestion) {
            button.classList.add('current');
        }
        
        button.onclick = () => jumpToQuestion(i + 1);
        grid.appendChild(button);
    }
}

// Show/hide progress modal
function showProgress() {
    document.getElementById('progress-modal').style.display = 'block';
    updateQuestionGrid();
}

function hideProgress() {
    document.getElementById('progress-modal').style.display = 'none';
}

// Submit exam
function submitExam() {
    clearInterval(timerInterval);
    
    const answered = Object.keys(answers).length;
    const total = examData.questions.length;
    
    if (answered < total) {
        const unanswered = total - answered;
        if (!confirm(`You have ${unanswered} unanswered questions. Submit anyway?`)) {
            startTimer(); // Resume timer
            return;
        }
    }
    
    // Calculate results
    let correct = 0;
    for (let i = 0; i < examData.questions.length; i++) {
        const userAnswer = answers[i];
        if (userAnswer !== undefined && userAnswer === examData.questions[i].correct) {
            correct++;
        }
    }
    
    const score = Math.round((correct / total) * 100);
    
    // Show results
    showResults(correct, total, score);
}

function showResults(correct, total, score) {
    document.getElementById('exam-container').style.display = 'none';
    document.getElementById('results-screen').style.display = 'block';
    
    document.getElementById('final-score').textContent = `${score}%`;
    document.getElementById('score-details').textContent = `${correct} out of ${total} questions correct`;
    
    const passThreshold = 70;
    const statusEl = document.getElementById('pass-status');
    
    if (score >= passThreshold) {
        statusEl.textContent = '🎉 PASS! You\'re ready for the Red Seal exam.';
        statusEl.className = 'pass-status pass';
    } else {
        statusEl.textContent = `❌ More study needed. Passing score is ${passThreshold}%.`;
        statusEl.className = 'pass-status fail';
    }
    
    // Show mode-specific messaging
    const modeMessage = document.getElementById('mode-message');
    if (isDemo) {
        modeMessage.innerHTML = `
            <p><strong>This was a limited demo.</strong></p>
            <p>Ready for the complete preparation? Unlock all 450+ questions and full-length practice exams.</p>
            <div style="margin-top: 20px;">
                <a href="#upgrade" class="upgrade-btn">Unlock Complete Program - $79 CAD</a>
            </div>
        `;
    } else if (isTrialMode) {
        const trialData = getTrialData();
        const trialEndDate = new Date(trialData.endDate);
        const now = new Date();
        const daysRemaining = Math.ceil((trialEndDate - now) / (24 * 60 * 60 * 1000));
        
        if (daysRemaining > 0) {
            modeMessage.innerHTML = `
                <p><strong>Trial Mode:</strong> ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining</p>
                <p>Continue practicing with full access, or secure permanent access now!</p>
                <div style="margin-top: 20px;">
                    <a href="#upgrade" class="upgrade-btn">Get Permanent Access - $79 CAD</a>
                </div>
            `;
        } else {
            modeMessage.innerHTML = `
                <p><strong>Free Trial Complete!</strong></p>
                <p>Continue your Red Seal preparation with permanent access.</p>
                <div style="margin-top: 20px;">
                    <a href="#upgrade" class="upgrade-btn">Continue Full Access - $79 CAD</a>
                </div>
            `;
        }
    } else {
        modeMessage.innerHTML = `
            <p><strong>Licensed Version:</strong> Full access to all features</p>
            <p>Keep practicing until you consistently score 80%+ on all exams!</p>
        `;
    }
}

// Reset for new attempt
function resetExam() {
    currentQuestion = 0;
    answers = {};
    flagged = new Set();
    examStarted = false;
    
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    document.getElementById('results-screen').style.display = 'none';
    document.getElementById('exam-container').style.display = 'none';
    document.getElementById('exam-menu-screen').style.display = 'block';
}

// Return to main menu
function returnToMenu() {
    currentQuestion = 0;
    answers = {};
    flagged = new Set();
    examStarted = false;
    
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    document.getElementById('exam-container').style.display = 'none';
    document.getElementById('results-screen').style.display = 'none';
    document.getElementById('welcome-screen').style.display = 'block';
    
    // Refresh trial status
    initializeTrial();
}

// Initialize app when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Initialize trial system on page load
    const trialActive = initializeTrial();
    
    // Update UI based on trial status
    const startTrialBtn = document.getElementById('start-trial-btn');
    const startDemoBtn = document.getElementById('start-demo-btn');
    
    if (trialActive) {
        if (startTrialBtn) {
            startTrialBtn.textContent = '🚀 Continue Your Trial';
        }
    } else {
        if (startTrialBtn) {
            startTrialBtn.textContent = '💳 Get Full Access - $79 CAD';
            startTrialBtn.onclick = () => showTrialExpiredScreen();
        }
    }
});

// Add trial-specific CSS classes and styling
const trialCSS = `
.trial-banner-content {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    padding: 12px 20px;
    text-align: center;
    border-radius: 8px;
    margin-bottom: 20px;
}

.trial-features {
    font-size: 0.9em;
    opacity: 0.9;
    margin-left: 10px;
}

.trial-banner-expired {
    background: linear-gradient(135deg, #dc2626, #b91c1c);
    color: white;
    padding: 12px 20px;
    text-align: center;
    border-radius: 8px;
    margin-bottom: 20px;
}

.trial-upgrade-btn {
    background: white;
    color: #dc2626;
    padding: 8px 16px;
    border-radius: 6px;
    text-decoration: none;
    font-weight: bold;
    margin-left: 15px;
}

.trial-status-active {
    background: #ecfdf5;
    border: 1px solid #10b981;
    color: #047857;
    padding: 15px;
    border-radius: 8px;
    margin-bottom: 20px;
}

.trial-status-expired {
    background: #fef2f2;
    border: 1px solid #dc2626;
    color: #b91c1c;
    padding: 15px;
    border-radius: 8px;
    margin-bottom: 20px;
}

.upgrade-btn {
    background: linear-gradient(135deg, #dc2626, #b91c1c);
    color: white;
    padding: 15px 30px;
    border-radius: 8px;
    text-decoration: none;
    font-weight: bold;
    display: inline-block;
    transition: transform 0.2s;
}

.upgrade-btn:hover {
    transform: translateY(-2px);
}
`;

// Inject trial CSS
const styleSheet = document.createElement('style');
styleSheet.textContent = trialCSS;
document.head.appendChild(styleSheet);