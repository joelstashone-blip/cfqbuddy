// 309A Practice Exam Platform
// State
let examData = null;
let currentQuestion = 0;
let answers = {};
let flagged = new Set();
let timerInterval = null;
let timeRemaining = 0;
let examStarted = false;

// Valid access codes (in production, validate server-side or use Gumroad license keys)
const VALID_CODES = ['309A-PREP-2024', '309A-FREE-DEMO', 'TEST-CODE-1234'];

function validateCode() {
    const code = document.getElementById('access-code').value.trim().toUpperCase();
    if (VALID_CODES.includes(code) || code.length >= 8) {
        loadExam();
    } else {
        alert('Invalid access code. Please check your email from Gumroad for your code.');
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
    timeRemaining = examData.time_limit_minutes * 60; // 4 hours in seconds
    answers = {};
    flagged = new Set();
    currentQuestion = 0;

    // Shuffle questions
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
    if (timeRemaining <= 600) timer.classList.add('danger');      // Last 10 min
    else if (timeRemaining <= 1800) timer.classList.add('warning'); // Last 30 min
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

    // Calculate results
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

    // Store for review
    window.examResults = results;

    // Show results
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
    // Reset form
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

    // Store locally
    saveFeedbackLocal(feedback);

    // Send to Google Sheets (via Apps Script web app)
    sendFeedbackRemote(feedback);

    // Show thanks
    document.getElementById('feedback-form-view').style.display = 'none';
    document.getElementById('feedback-thanks-view').style.display = 'block';

    // Track that user gave feedback this session
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
    // Google Apps Script endpoint
    const ENDPOINT = window.CFQ_FEEDBACK_ENDPOINT || localStorage.getItem('cfq-feedback-endpoint') || 'https://script.google.com/macros/s/AKfycby-X1cKflCfgxuBLJTiASDqCqN58Xj3Djni2vyUgcZP4irIiIG02NJpuLzkPK0h831P/exec';
    if (!ENDPOINT) {
        console.log('[Feedback] No remote endpoint configured. Saved locally only.');
        return;
    }
    
    // Use GET with URL params (Apps Script doGet) — works with no-cors
    const params = new URLSearchParams({
        rating: fb.rating,
        category: fb.category,
        comment: (fb.comment || '').substring(0, 500),
        exam: fb.exam,
        score: fb.score,
        timestamp: fb.timestamp,
        ua: fb.userAgent
    });

    // Fire-and-forget — don't block the UI
    fetch(ENDPOINT + '?' + params.toString(), { mode: 'no-cors' })
        .then(() => console.log('[Feedback] Sent to Google Sheets'))
        .catch(e => {
            console.warn('[Feedback] Remote send failed, saved locally:', e);
            // Mark as unsent for retry later
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

