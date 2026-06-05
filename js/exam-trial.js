// 309A Practice Exam Platform - SIGNUP-BASED TRIAL VERSION
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
const TRIAL_STORAGE_KEY = 'cfqBuddyTrial';
const TRIAL_DURATION_DAYS = 7;

// New Trial Signup Functions
function startTrial(event) {
    event.preventDefault();
    
    const name = document.getElementById('user-name').value.trim();
    const email = document.getElementById('user-email').value.trim();
    
    if (!name || !email) {
        alert('Please enter your name and email to start your free trial.');
        return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Please enter a valid email address.');
        return;
    }
    
    // Create trial data
    const trialData = {
        name: name,
        email: email,
        startDate: Date.now(),
        expiryDate: Date.now() + (TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000), // 7 days from now
        tradeType: getTradeType(), // '309a' or '306a'
        isActive: true
    };
    
    // Store trial data
    localStorage.setItem(TRIAL_STORAGE_KEY, JSON.stringify(trialData));
    
    // Show trial active section
    showTrialActiveSection();
    
    // Optional: Send email signup to tracking system
    console.log('Trial started:', { name, email, tradeType: trialData.tradeType });
}

function getTradeType() {
    // Detect which page we're on
    return window.location.pathname.includes('plumber') ? '306a' : '309a';
}

function checkTrialStatus() {
    const trialData = JSON.parse(localStorage.getItem(TRIAL_STORAGE_KEY));
    
    if (!trialData) {
        // No trial - show signup
        showSignupSection();
        return 'no_trial';
    }
    
    const now = Date.now();
    const timeLeft = trialData.expiryDate - now;
    
    if (timeLeft <= 0) {
        // Trial expired
        showTrialExpiredSection();
        return 'expired';
    }
    
    // Trial active
    const daysLeft = Math.ceil(timeLeft / (24 * 60 * 60 * 1000));
    updateTrialCountdown(daysLeft);
    showTrialActiveSection();
    return 'active';
}

function showSignupSection() {
    hideAllSections();
    const section = document.getElementById('trial-signup-section');
    if (section) section.style.display = 'block';
}

function showTrialActiveSection() {
    hideAllSections();
    const section = document.getElementById('trial-active-section');
    if (section) section.style.display = 'block';
}

function showTrialExpiredSection() {
    hideAllSections();
    const section = document.getElementById('trial-expired-section');
    if (section) section.style.display = 'block';
}

function hideAllSections() {
    const sections = ['trial-signup-section', 'trial-active-section', 'trial-expired-section'];
    sections.forEach(id => {
        const section = document.getElementById(id);
        if (section) section.style.display = 'none';
    });
}

function updateTrialCountdown(daysLeft) {
    const countdown = document.getElementById('trial-countdown');
    if (countdown) {
        if (daysLeft === 1) {
            countdown.textContent = `${daysLeft} day remaining`;
        } else {
            countdown.textContent = `${daysLeft} days remaining`;
        }
    }
}

function continueToExam() {
    const status = checkTrialStatus();
    if (status === 'active') {
        // User can access exam - load exam interface
        loadExamInterface();
    } else {
        // Redirect to appropriate screen
        checkTrialStatus();
    }
}

function loadExamInterface() {
    // Hide landing sections and show exam interface
    hideAllSections();
    
    // Show the main exam interface
    const examScreen = document.getElementById('screen-exam');
    const landingScreen = document.getElementById('screen-landing');
    
    if (landingScreen) landingScreen.style.display = 'none';
    if (examScreen) examScreen.style.display = 'block';
    
    // Start with default exam
    startTrialExam();
}

// Modified exam starter for trial users
async function startTrialExam(examType = 'exam1') {
    const status = checkTrialStatus();
    
    if (status !== 'active') {
        checkTrialStatus(); // This will show appropriate screen
        return;
    }
    
    // Load exam data for trial users
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

// Utility function to check if user has specific tier access
function hasAccess(examType) {
    if (isTrialMode) {
        return checkTrialStatus() === 'active';
    }
    
    if (isDemo) return true; // Demo always has access to its limited set
    
    if (!activeTier) return false;
    
    return TIER_ACCESS[activeTier]?.includes(examType) || false;
}

// Verify Gumroad license key
async function verifyLicense(licenseKey) {
    try {
        const response = await fetch('https://api.gumroad.com/v2/licenses/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                'product_permalink': 'FErU7', // This should match your Gumroad product permalink
                'license_key': licenseKey,
                'increment_uses_count': 'false'
            })
        });
        
        const data = await response.json();
        
        if (data.success && data.purchase) {
            const permalink = data.purchase.product_permalink;
            const tier = PRODUCT_TIERS[permalink];
            
            if (tier) {
                activeTier = tier;
                localStorage.setItem('activeTier', tier);
                localStorage.setItem('licenseKey', licenseKey);
                return { success: true, tier };
            }
        }
        
        return { success: false, message: 'Invalid license key' };
        
    } catch (error) {
        console.error('License verification failed:', error);
        return { success: false, message: 'Verification failed. Please try again.' };
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    // Check for existing trial or license on page load
    const savedTier = localStorage.getItem('activeTier');
    if (savedTier) {
        activeTier = savedTier;
    }
    
    // Initialize trial status display
    checkTrialStatus();
});

// Exam Functions (Core Logic)
function startExam() {
    if (!examData || !examData.questions) {
        alert('Exam data not loaded. Please try again.');
        return;
    }

    // Reset exam state
    currentQuestion = 0;
    answers = {};
    flagged = new Set();
    examStarted = false;

    // Show exam screen
    document.getElementById('screen-landing').style.display = 'none';
    document.getElementById('screen-exam').style.display = 'block';

    // Initialize exam interface
    updateQuestionCounter();
    showQuestion(0);
    
    // Start timer if it's a full exam
    if (!isDemo && examData.timeLimit) {
        startTimer(examData.timeLimit);
    } else if (isDemo) {
        // Demo mode - hide timer
        const timerElement = document.getElementById('timer');
        if (timerElement) timerElement.style.display = 'none';
    }
    
    examStarted = true;
}

function showQuestion(questionIndex) {
    if (!examData || !examData.questions || questionIndex >= examData.questions.length) {
        return;
    }

    const question = examData.questions[questionIndex];
    currentQuestion = questionIndex;
    
    // Update question display
    document.getElementById('question-number').textContent = questionIndex + 1;
    document.getElementById('total-questions').textContent = examData.questions.length;
    document.getElementById('question-text').innerHTML = question.question;
    
    // Clear previous answers
    const answersContainer = document.getElementById('answers-container');
    answersContainer.innerHTML = '';
    
    // Display answer options
    question.options.forEach((option, index) => {
        const optionLetter = String.fromCharCode(65 + index); // A, B, C, D
        const isSelected = answers[questionIndex] === optionLetter;
        
        const answerDiv = document.createElement('div');
        answerDiv.className = `answer-option ${isSelected ? 'selected' : ''}`;
        answerDiv.onclick = () => selectAnswer(optionLetter);
        
        answerDiv.innerHTML = `
            <span class="option-letter">${optionLetter}</span>
            <span class="option-text">${option}</span>
        `;
        
        answersContainer.appendChild(answerDiv);
    });
    
    // Update flag button
    const flagButton = document.getElementById('flag-question');
    if (flagButton) {
        flagButton.className = flagged.has(questionIndex) ? 'flagged' : '';
        flagButton.textContent = flagged.has(questionIndex) ? '🚩 Flagged' : '🏳️ Flag';
    }
    
    // Update navigation buttons
    updateNavigationButtons();
}

function selectAnswer(optionLetter) {
    answers[currentQuestion] = optionLetter;
    
    // Update UI
    const answerOptions = document.querySelectorAll('.answer-option');
    answerOptions.forEach((option, index) => {
        const letter = String.fromCharCode(65 + index);
        option.classList.toggle('selected', letter === optionLetter);
    });
    
    updateQuestionCounter();
}

function updateQuestionCounter() {
    const answered = Object.keys(answers).length;
    const total = examData.questions.length;
    const flaggedCount = flagged.size;
    
    document.getElementById('answered-count').textContent = answered;
    document.getElementById('total-count').textContent = total;
    
    if (flaggedCount > 0) {
        document.getElementById('flagged-count').textContent = ` (${flaggedCount} flagged)`;
    } else {
        document.getElementById('flagged-count').textContent = '';
    }
}

function updateNavigationButtons() {
    const prevButton = document.getElementById('prev-question');
    const nextButton = document.getElementById('next-question');
    
    if (prevButton) {
        prevButton.disabled = currentQuestion === 0;
    }
    
    if (nextButton) {
        nextButton.disabled = currentQuestion === examData.questions.length - 1;
    }
}

function previousQuestion() {
    if (currentQuestion > 0) {
        showQuestion(currentQuestion - 1);
    }
}

function nextQuestion() {
    if (currentQuestion < examData.questions.length - 1) {
        showQuestion(currentQuestion + 1);
    }
}

function toggleFlag() {
    if (flagged.has(currentQuestion)) {
        flagged.delete(currentQuestion);
    } else {
        flagged.add(currentQuestion);
    }
    
    const flagButton = document.getElementById('flag-question');
    if (flagButton) {
        flagButton.className = flagged.has(currentQuestion) ? 'flagged' : '';
        flagButton.textContent = flagged.has(currentQuestion) ? '🚩 Flagged' : '🏳️ Flag';
    }
    
    updateQuestionCounter();
}

function jumpToQuestion(questionIndex) {
    if (questionIndex >= 0 && questionIndex < examData.questions.length) {
        showQuestion(questionIndex);
    }
}

// Timer Functions
function startTimer(minutes) {
    timeRemaining = minutes * 60;
    updateTimerDisplay();
    
    timerInterval = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();
        
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            autoSubmitExam();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const hours = Math.floor(timeRemaining / 3600);
    const minutes = Math.floor((timeRemaining % 3600) / 60);
    const seconds = timeRemaining % 60;
    
    const display = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('timer').textContent = display;
    
    // Change color when time is running low
    const timerElement = document.getElementById('timer');
    if (timeRemaining < 300) { // Last 5 minutes
        timerElement.style.color = '#ff4444';
    } else if (timeRemaining < 1800) { // Last 30 minutes
        timerElement.style.color = '#ff8800';
    }
}

function autoSubmitExam() {
    alert('Time\'s up! Your exam will be automatically submitted.');
    submitExam();
}

// Exam Submission and Results
function submitExam() {
    if (Object.keys(answers).length === 0) {
        alert('Please answer at least one question before submitting.');
        return;
    }
    
    // Stop timer
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    // Calculate results
    const results = calculateResults();
    
    // Show results screen
    displayResults(results);
}

function calculateResults() {
    let correct = 0;
    let incorrect = 0;
    const details = [];
    
    examData.questions.forEach((question, index) => {
        const userAnswer = answers[index];
        const correctAnswer = question.correct;
        const isCorrect = userAnswer === correctAnswer;
        
        if (userAnswer) {
            if (isCorrect) {
                correct++;
            } else {
                incorrect++;
            }
        }
        
        details.push({
            questionNumber: index + 1,
            userAnswer: userAnswer || 'Not answered',
            correctAnswer: correctAnswer,
            isCorrect: isCorrect,
            explanation: question.explanation,
            reference: question.reference
        });
    });
    
    const total = examData.questions.length;
    const percentage = Math.round((correct / total) * 100);
    const passed = percentage >= 70; // Red Seal passing grade
    
    return {
        correct,
        incorrect,
        total,
        percentage,
        passed,
        details
    };
}

function displayResults(results) {
    // Hide exam screen, show results screen
    document.getElementById('screen-exam').style.display = 'none';
    document.getElementById('screen-results').style.display = 'block';
    
    // Update results summary
    document.getElementById('score-percentage').textContent = `${results.percentage}%`;
    document.getElementById('score-fraction').textContent = `${results.correct}/${results.total}`;
    document.getElementById('pass-status').textContent = results.passed ? 'PASS' : 'FAIL';
    document.getElementById('pass-status').className = results.passed ? 'pass' : 'fail';
    
    // Generate detailed breakdown
    const breakdown = document.getElementById('results-breakdown');
    breakdown.innerHTML = '';
    
    results.details.forEach(detail => {
        const questionDiv = document.createElement('div');
        questionDiv.className = `result-question ${detail.isCorrect ? 'correct' : 'incorrect'}`;
        
        questionDiv.innerHTML = `
            <div class="question-header">
                <strong>Question ${detail.questionNumber}</strong>
                <span class="result-badge ${detail.isCorrect ? 'correct' : 'incorrect'}">
                    ${detail.isCorrect ? '✓' : '✗'}
                </span>
            </div>
            <div class="answer-comparison">
                <div>Your answer: <strong>${detail.userAnswer}</strong></div>
                <div>Correct answer: <strong>${detail.correctAnswer}</strong></div>
            </div>
            ${detail.explanation ? `<div class="explanation">${detail.explanation}</div>` : ''}
            ${detail.reference ? `<div class="reference">Reference: ${detail.reference}</div>` : ''}
        `;
        
        breakdown.appendChild(questionDiv);
    });
}

// Reset for new attempt
function resetExam() {
    currentQuestion = 0;
    answers = {};
    flagged = new Set();
    examStarted = false;
    
    // Hide all screens except landing
    const screens = ['screen-results', 'screen-exam'];
    screens.forEach(screenId => {
        const screen = document.getElementById(screenId);
        if (screen) screen.style.display = 'none';
    });
    
    // Show landing screen and check trial status
    const landingScreen = document.getElementById('screen-landing');
    if (landingScreen) landingScreen.style.display = 'block';
    
    // Reset timer
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    // Re-check trial status
    checkTrialStatus();
}

// Trial expired screen handler
function showTrialExpiredScreen() {
    // Hide all other screens
    const screens = ['screen-landing', 'screen-exam', 'screen-results'];
    screens.forEach(screenId => {
        const screen = document.getElementById(screenId);
        if (screen) screen.style.display = 'none';
    });
    
    // Show the expired section
    showTrialExpiredSection();
}

// License entry functions (for users who purchase)
function showLicenseEntry() {
    const licenseKey = prompt('Enter your license key from your Gumroad purchase confirmation:');
    
    if (licenseKey) {
        verifyLicense(licenseKey).then(result => {
            if (result.success) {
                alert(`License verified! You now have access to the ${result.tier} tier.`);
                // Reload to show new access
                location.reload();
            } else {
                alert(result.message);
            }
        });
    }
}