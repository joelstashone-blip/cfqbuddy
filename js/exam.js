// 309A Practice Exam Platform
// State
let examData = null;
let currentQuestion = 0;
let answers = {};
let flagged = new Set();
let timerInterval = null;
let timeRemaining = 0;
let examStarted = false;

let isDemo = false;

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

// Demo mode — free 10 questions, then paywall
async function startDemo() {
    isDemo = true;
    try {
        const res = await fetch('data/demo.json');
        examData = await res.json();
        startExam();
    } catch (e) {
        alert('Failed to load demo. Please try again.');
        console.error(e);
    }
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

    if (!verified) {
        showLicenseStatus('Invalid license key. Please check your Gumroad purchase receipt for the correct key.', 'error');
        btn.disabled = false;
        btn.textContent = 'Unlock & Start Exam';
        return;
    }

    // Success! Save license and tier
    localStorage.setItem('cfq_license_key', licenseKey);
    localStorage.setItem('cfq_tier', tier);
    activeTier = tier;

    // Log activation to Google Sheets
    logActivation(licenseKey, tier, productName);

    // Update exam selector based on tier
    updateExamSelector(tier);

    showLicenseStatus(`✅ License verified! You have access to: ${getTierLabel(tier)}`, 'success');

    btn.disabled = false;
    btn.textContent = 'Start Exam';
    isDemo = false;
    loadExam();
}

function getTierLabel(tier) {
    switch(tier) {
        case 'single': return 'Practice Exam 1';
        case 'pack3': return 'All 3 Practice Exams (450 questions)';
        case 'bundle': return 'All 3 Practice Exams + Study Guide';
        default: return tier;
    }
}

function showLicenseStatus(msg, type) {
    const el = document.getElementById('license-status');
    if (!el) return;
    el.textContent = msg;
    el.className = 'license-status ' + type;
    el.style.display = 'block';
}

// Log activation to Google Sheets for tracking
function logActivation(licenseKey, tier, productName) {
    try {
        const endpoint = 'https://script.google.com/macros/s/AKfycby-X1cKflCfgxuBLJTiASDqCqN58Xj3Djni2vyUgcZP4irIiIG02NJpuLzkPK0h831P/exec';
        fetch(endpoint, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'activation',
                licenseKey: licenseKey.substring(0, 8) + '...',  // Partial key for privacy
                tier: tier,
                product: productName,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent.substring(0, 100)
            })
        });
    } catch (e) {
        console.error('Activation log failed:', e);
    }
}

// Show/hide exam options based on tier
function updateExamSelector(tier) {
    const select = document.getElementById('exam-select');
    const allowedExams = TIER_ACCESS[tier];
    for (const opt of select.options) {
        if (allowedExams.includes(opt.value)) {
            opt.disabled = false;
            opt.textContent = opt.textContent.replace(' 🔒', '');
        } else {
            opt.disabled = true;
            if (!opt.textContent.includes('🔒')) {
                opt.textContent += ' 🔒';
            }
        }
    }
    select.value = allowedExams[0];
}

// Check for saved license on page load
function checkSavedCode() {
    const savedKey = localStorage.getItem('cfq_license_key');
    const savedTier = localStorage.getItem('cfq_tier');
    if (savedKey && savedTier) {
        // Re-verify the saved license in the background
        activeTier = savedTier;
        updateExamSelector(savedTier);
        document.getElementById('access-code').value = savedKey;
        showLicenseStatus(`✅ Welcome back! ${getTierLabel(savedTier)} unlocked.`, 'success');

        // Background re-verify (don't block UI)
        reVerifyLicense(savedKey, savedTier);
    }
}

// Silently re-verify a saved license to check it's still valid
async function reVerifyLicense(licenseKey, savedTier) {
    // Find the product permalink for this tier
    const permalink = Object.entries(PRODUCT_TIERS).find(([_, t]) => t === savedTier)?.[0];
    if (!permalink) return;

    try {
        const response = await fetch('https://api.gumroad.com/v2/licenses/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `product_id=${permalink}&license_key=${encodeURIComponent(licenseKey)}&increment_uses_count=false`
        });
        const data = await response.json();

        if (!data.success || data.purchase?.license_disabled || data.purchase?.refunded) {
            // License no longer valid — clear it
            localStorage.removeItem('cfq_license_key');
            localStorage.removeItem('cfq_tier');
            activeTier = null;
            showLicenseStatus('Your license is no longer valid. Please enter a valid license key.', 'error');
            document.getElementById('access-code').value = '';
            // Reset exam selector
            const select = document.getElementById('exam-select');
            for (const opt of select.options) {
                opt.disabled = false;
                opt.textContent = opt.textContent.replace(' 🔒', '');
            }
        }
    } catch (e) {
        // Network error — don't lock out the user, allow offline use
        console.warn('Background license re-verification failed (offline?):', e);
    }
}

async function loadExam() {
    const examId = document.getElementById('exam-select').value;
    try {
        const res = await fetch(`data/${examId}.json`);
        examData = await res.json();
        startExam();
    } catch (e) {
        alert('Failed to load exam data. Please try again.');
        console.error(e);
    }
}

function startExam() {
    examStarted = true;
    timeRemaining = examData.time_limit_minutes * 60;
    answers = {};
    flagged = new Set();
    currentQuestion = 0;

    examData.questions = shuffleArray([...examData.questions]);

    showScreen('screen-exam');
    buildQuestionNav();
    renderQuestion();
    startTimer();
}

function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// Timer
function startTimer() {
    updateTimerDisplay();
    timerInterval = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            submitExam();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const h = Math.floor(timeRemaining / 3600);
    const m = Math.floor((timeRemaining % 3600) / 60);
    const s = timeRemaining % 60;
    const timer = document.getElementById('timer');
    timer.textContent = `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;

    timer.classList.remove('warning', 'danger');
    if (timeRemaining <= 600) timer.classList.add('danger');
    else if (timeRemaining <= 1800) timer.classList.add('warning');
}

// Navigation
function buildQuestionNav() {
    const nav = document.getElementById('question-nav');
    nav.innerHTML = '';
    examData.questions.forEach((_, i) => {
        const btn = document.createElement('button');
        btn.className = 'q-nav-btn';
        btn.textContent = i + 1;
        btn.onclick = () => goToQuestion(i);
        nav.appendChild(btn);
    });
    updateNav();
}

function updateNav() {
    document.querySelectorAll('.q-nav-btn').forEach((btn, i) => {
        btn.className = 'q-nav-btn';
        if (i === currentQuestion) btn.classList.add('active');
        if (answers[i] !== undefined) btn.classList.add('answered');
        if (flagged.has(i)) btn.classList.add('flagged');
    });
    document.getElementById('question-counter').textContent =
        `Question ${currentQuestion + 1} / ${examData.questions.length}`;
}

function goToQuestion(idx) {
    currentQuestion = idx;
    renderQuestion();
    updateNav();
}

function nextQuestion() {
    if (currentQuestion < examData.questions.length - 1) {
        currentQuestion++;
        renderQuestion();
        updateNav();
    }
}

function prevQuestion() {
    if (currentQuestion > 0) {
        currentQuestion--;
        renderQuestion();
        updateNav();
    }
}

function flagQuestion() {
    if (flagged.has(currentQuestion)) {
        flagged.delete(currentQuestion);
    } else {
        flagged.add(currentQuestion);
    }
    const btn = document.getElementById('btn-flag');
    btn.classList.toggle('flagged', flagged.has(currentQuestion));
    updateNav();
}

// Render Question
function renderQuestion() {
    const q = examData.questions[currentQuestion];
    document.getElementById('question-badge').textContent =
        `${q.section} · ${q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1)} · Rule ${q.rule_reference}`;
    document.getElementById('question-text').textContent = q.question;

    const container = document.getElementById('options-container');
    container.innerHTML = '';
    q.options.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        if (answers[currentQuestion] === i) btn.classList.add('selected');
        btn.textContent = opt;
        btn.onclick = () => selectAnswer(i);
        container.appendChild(btn);
    });

    const flagBtn = document.getElementById('btn-flag');
    flagBtn.classList.toggle('flagged', flagged.has(currentQuestion));

    document.getElementById('btn-prev').disabled = currentQuestion === 0;
    document.getElementById('btn-next').disabled = currentQuestion === examData.questions.length - 1;
}

function selectAnswer(idx) {
    answers[currentQuestion] = idx;
    renderQuestion();
    updateNav();
}

// Submit
function confirmSubmit() {
    const unanswered = examData.questions.length - Object.keys(answers).length;
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal">
            <h3>Submit Exam?</h3>
            <p>${unanswered > 0 ? `You have <strong>${unanswered} unanswered questions</strong>. ` : ''}
            Once submitted, you cannot change your answers.</p>
            <div class="modal-actions">
                <button onclick="this.closest('.modal-overlay').remove()">Go Back</button>
                <button class="btn-confirm" onclick="this.closest('.modal-overlay').remove(); submitExam();">Submit</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function submitExam() {
    clearInterval(timerInterval);
    examStarted = false;

    let correct = 0;
    let incorrect = 0;
    let unanswered = 0;
    const results = [];

    examData.questions.forEach((q, i) => {
        const userAnswer = answers[i];
        const isCorrect = userAnswer === q.correct;
        if (userAnswer === undefined) {
            unanswered++;
            results.push({ ...q, userAnswer: null, isCorrect: false, idx: i });
        } else if (isCorrect) {
            correct++;
            results.push({ ...q, userAnswer, isCorrect: true, idx: i });
        } else {
            incorrect++;
            results.push({ ...q, userAnswer, isCorrect: false, idx: i });
        }
    });

    const total = examData.questions.length;
    const percent = Math.round((correct / total) * 100);
    const passed = percent >= examData.pass_percentage;
    const timeUsed = (examData.time_limit_minutes * 60) - timeRemaining;
    const timeUsedMin = Math.floor(timeUsed / 60);
    const timeUsedSec = timeUsed % 60;

    window.examResults = results;

    showScreen('screen-results');

    const badge = document.getElementById('result-badge');
    badge.textContent = passed ? '✅ PASSED' : '❌ DID NOT PASS';
    badge.className = 'result-badge ' + (passed ? 'pass' : 'fail');

    document.getElementById('result-title').textContent =
        passed ? 'Congratulations!' : 'Keep Studying — You\'ll Get There';

    const circle = document.getElementById('score-circle');
    circle.className = 'score-circle ' + (passed ? 'pass' : 'fail');
    document.getElementById('score-percent').textContent = percent + '%';

    document.getElementById('stats-grid').innerHTML = `
        <div class="stat-card"><div class="stat-value" style="color:var(--correct)">${correct}</div><div class="stat-label">Correct</div></div>
        <div class="stat-card"><div class="stat-value" style="color:var(--incorrect)">${incorrect}</div><div class="stat-label">Incorrect</div></div>
        <div class="stat-card"><div class="stat-value" style="color:var(--warning)">${unanswered}</div><div class="stat-label">Unanswered</div></div>
        <div class="stat-card"><div class="stat-value">${timeUsedMin}m ${timeUsedSec}s</div><div class="stat-label">Time Used</div></div>
        <div class="stat-card"><div class="stat-value">${total}</div><div class="stat-label">Total Questions</div></div>
        <div class="stat-card"><div class="stat-value">${examData.pass_percentage}%</div><div class="stat-label">Pass Mark</div></div>
    `;

    if (isDemo) {
        setTimeout(() => {
            document.getElementById('demo-score').textContent = percent + '%';
            showScreen('screen-paywall');
        }, 3000);
    }
}

// Review
function showReview() {
    showScreen('screen-review');
    renderReview('all');
}

function filterReview() {
    const filter = document.getElementById('review-filter').value;
    renderReview(filter);
}

function renderReview(filter) {
    const body = document.getElementById('review-body');
    let results = window.examResults || [];

    if (filter === 'incorrect') results = results.filter(r => !r.isCorrect && r.userAnswer !== null);
    else if (filter === 'correct') results = results.filter(r => r.isCorrect);
    else if (filter === 'flagged') results = results.filter(r => flagged.has(r.idx));

    body.innerHTML = results.map((r, i) => {
        const optionsHtml = r.options.map((opt, oi) => {
            let cls = 'review-option';
            if (oi === r.correct) cls += ' correct-answer';
            if (r.userAnswer === oi && !r.isCorrect) cls += ' user-wrong';
            if (r.userAnswer === oi && r.isCorrect) cls += ' user-correct';
            const icon = oi === r.correct ? ' ✓' : (r.userAnswer === oi && !r.isCorrect ? ' ✗' : '');
            return `<div class="${cls}">${opt}${icon}</div>`;
        }).join('');

        return `
            <div class="review-card ${r.isCorrect ? 'correct' : 'incorrect'}">
                <div class="q-number">Question ${r.idx + 1} · ${r.section} · Rule ${r.rule_reference} ${flagged.has(r.idx) ? '🚩' : ''}</div>
                <div class="q-text">${r.question}</div>
                ${optionsHtml}
                <div class="review-explanation">
                    <strong>Rule ${r.rule_reference}:</strong> ${r.explanation}
                    ${r.userAnswer === null ? '<br><em>(Unanswered)</em>' : ''}
                </div>
            </div>
        `;
    }).join('');

    if (results.length === 0) {
        body.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:40px;">No questions match this filter.</p>';
    }
}

function backToResults() { showScreen('screen-results'); }
function retakeExam() { startExam(); }

// Screen management
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (!examStarted) return;
    if (e.key === 'ArrowRight' || e.key === 'n') nextQuestion();
    if (e.key === 'ArrowLeft' || e.key === 'p') prevQuestion();
    if (e.key === 'f') flagQuestion();
    if (e.key >= '1' && e.key <= '4') selectAnswer(parseInt(e.key) - 1);
});

// Prevent accidental page close
window.addEventListener('beforeunload', (e) => {
    if (examStarted) {
        e.preventDefault();
        e.returnValue = '';
    }
});
// ========== Feedback System ==========
let feedbackRating = 0;

function openFeedback() {
    document.getElementById('feedback-overlay').classList.add('show');
    document.getElementById('feedback-form-view').style.display = 'block';
    document.getElementById('feedback-thanks-view').style.display = 'none';
    document.getElementById('feedback-fab').classList.add('hide');
    feedbackRating = 0;
    document.querySelectorAll('.star-btn').forEach(s => s.classList.remove('active'));
    document.getElementById('fb-category').value = '';
    document.getElementById('fb-comment').value = '';
}

function closeFeedback() {
    document.getElementById('feedback-overlay').classList.remove('show');
    document.getElementById('feedback-fab').classList.remove('hide');
}

function setRating(rating) {
    feedbackRating = rating;
    document.querySelectorAll('.star-btn').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.rating) <= rating);
    });
}

function submitFeedback() {
    const category = document.getElementById('fb-category').value;
    const comment = document.getElementById('fb-comment').value.trim();

    if (feedbackRating === 0) {
        alert('Please select a star rating.');
        return;
    }

    const feedback = {
        rating: feedbackRating,
        category: category || 'none',
        comment: comment,
        exam: document.getElementById('exam-select')?.value || 'unknown',
        score: document.getElementById('score-percent')?.textContent || 'n/a',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent.substring(0, 100)
    };

    saveFeedbackLocal(feedback);
    sendFeedbackRemote(feedback);

    document.getElementById('feedback-form-view').style.display = 'none';
    document.getElementById('feedback-thanks-view').style.display = 'block';

    sessionStorage.setItem('cfq-feedback-given', 'true');
}

function saveFeedbackLocal(fb) {
    try {
        const stored = JSON.parse(localStorage.getItem('cfq-feedback') || '[]');
        stored.push(fb);
        localStorage.setItem('cfq-feedback', JSON.stringify(stored));
    } catch (e) {
        console.error('Failed to save feedback locally:', e);
    }
}

function sendFeedbackRemote(fb) {
    const ENDPOINT = window.CFQ_FEEDBACK_ENDPOINT || localStorage.getItem('cfq-feedback-endpoint') || 'https://script.google.com/macros/s/AKfycby-X1cKflCfgxuBLJTiASDqCqN58Xj3Djni2vyUgcZP4irIiIG02NJpuLzkPK0h831P/exec';
    if (!ENDPOINT) {
        console.log('[Feedback] No remote endpoint configured. Saved locally only.');
        return;
    }
    
    const params = new URLSearchParams({
        rating: fb.rating,
        category: fb.category,
        comment: (fb.comment || '').substring(0, 500),
        exam: fb.exam,
        score: fb.score,
        timestamp: fb.timestamp,
        ua: fb.userAgent
    });

    fetch(ENDPOINT + '?' + params.toString(), { mode: 'no-cors' })
        .then(() => console.log('[Feedback] Sent to Google Sheets'))
        .catch(e => {
            console.warn('[Feedback] Remote send failed, saved locally:', e);
            try {
                const unsent = JSON.parse(localStorage.getItem('cfq-feedback-unsent') || '[]');
                unsent.push(fb);
                localStorage.setItem('cfq-feedback-unsent', JSON.stringify(unsent));
            } catch(err) {}
        });
}

// Retry unsent feedback on page load
(function retrySendFeedback() {
    const ENDPOINT = window.CFQ_FEEDBACK_ENDPOINT || localStorage.getItem('cfq-feedback-endpoint') || 'https://script.google.com/macros/s/AKfycby-X1cKflCfgxuBLJTiASDqCqN58Xj3Djni2vyUgcZP4irIiIG02NJpuLzkPK0h831P/exec';
    if (!ENDPOINT) return;
    try {
        const unsent = JSON.parse(localStorage.getItem('cfq-feedback-unsent') || '[]');
        if (unsent.length === 0) return;
        unsent.forEach(fb => {
            const params = new URLSearchParams({
                rating: fb.rating, category: fb.category,
                comment: (fb.comment || '').substring(0, 500),
                exam: fb.exam, score: fb.score,
                timestamp: fb.timestamp, ua: fb.userAgent
            });
            fetch(ENDPOINT + '?' + params.toString(), { mode: 'no-cors' }).catch(() => {});
        });
        localStorage.removeItem('cfq-feedback-unsent');
        console.log('[Feedback] Retried', unsent.length, 'unsent feedback items');
    } catch(e) {}
})();

// Export feedback as CSV (admin utility)
function exportFeedback() {
    const stored = JSON.parse(localStorage.getItem('cfq-feedback') || '[]');
    if (stored.length === 0) { alert('No feedback stored.'); return; }
    const csv = 'Rating,Category,Comment,Exam,Score,Timestamp\n' +
        stored.map(f => `${f.rating},"${(f.category||'').replace(/"/g,'""')}","${(f.comment||'').replace(/"/g,'""')}",${f.exam},${f.score},${f.timestamp}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'cfq-feedback.csv'; a.click();
    URL.revokeObjectURL(url);
}
