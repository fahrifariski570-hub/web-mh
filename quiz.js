// Quiz question bank and answer choices.
const questions = [
    {q: "Seberapa sering Anda merasa sedih atau tertekan dalam 2 minggu terakhir?", o: ["Tidak pernah", "Beberapa hari", "Lebih dari seminggu", "Hampir setiap hari"]},
    {q: "Apakah Anda kehilangan minat dalam melakukan aktivitas?", o: ["Tidak sama sekali", "Sedikit", "Cukup banyak", "Sangat banyak"]},
    {q: "Bagaimana kualitas tidur Anda akhir-akhir ini?", o: ["Sangat baik", "Baik", "Kurang baik", "Sangat buruk"]},
    {q: "Seberapa sering Anda merasa lelah atau kekurangan energi?", o: ["Jarang", "Kadang-kadang", "Sering", "Hampir setiap hari"]},
    {q: "Apakah Anda mengalami kesulitan berkonsentrasi?", o: ["Tidak", "Sedikit kesulitan", "Cukup sulit", "Sangat sulit"]},
    {q: "Bagaimana perasaan Anda tentang diri sendiri?", o: ["Positif", "Netral", "Agak negatif", "Sangat negatif"]},
    {q: "Seberapa sering Anda merasa cemas atau khawatir berlebihan?", o: ["Tidak pernah", "Sesekali", "Sering", "Hampir selalu"]},
    {q: "Apakah Anda merasa terisolasi atau kesepian?", o: ["Tidak", "Kadang-kadang", "Sering", "Sangat sering"]}
];

// Local storage key for last quiz result on this device.
const LAST_RESULT_KEY = 'mindcare_last_result';

// Current state for navigation and responses.
let currentQuestion = 0;
let answers = [];

// Start the quiz without requiring login.
async function startQuiz() {
    const startScreen = document.getElementById('quizStart');
    if (startScreen) {
        startScreen.style.display = 'none';
    }
    document.getElementById('quizForm').style.display = 'block';
    document.getElementById('quizResult').style.display = 'none';
    document.getElementById('totalQ').textContent = questions.length;
    renderQuestions();
    showQuestion(0);
}

// Build question cards and answer buttons.
function renderQuestions() {
    const container = document.getElementById('questionsContainer');
    container.innerHTML = '';
    questions.forEach((q, i) => {
        const card = document.createElement('div');
        card.className = 'question-card';
        card.id = `q-${i}`;
        card.innerHTML = `<h4>${q.q}</h4>${q.o.map((opt, j) => 
            `<button type="button" class="option-btn" onclick="selectOption(${i}, ${j}, this)">${opt}</button>`
        ).join('')}`;
        container.appendChild(card);
    });
}

// Show a specific question and update progress UI.
function showQuestion(i) {
    document.querySelectorAll('.question-card').forEach((c, idx) => {
        c.classList.toggle('active', idx === i);
    });
    document.getElementById('currentQ').textContent = i + 1;
    document.getElementById('progressBar').style.width = `${((i + 1) / questions.length) * 100}%`;
    document.getElementById('prevBtn').disabled = i === 0;
    document.getElementById('nextBtn').style.display = i === questions.length - 1 ? 'none' : '';
    document.getElementById('submitBtn').style.display = i === questions.length - 1 ? '' : 'none';
}

// Store selected answer and highlight the chosen button.
function selectOption(qIdx, optIdx, btn) {
    answers[qIdx] = optIdx;
    document.querySelectorAll(`#q-${qIdx} .option-btn`).forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
}

// Move to the previous or next question.
function changeQuestion(dir) {
    currentQuestion = Math.max(0, Math.min(questions.length - 1, currentQuestion + dir));
    showQuestion(currentQuestion);
}

// Calculate results, render summary, and persist to Supabase.
async function submitQuiz() {
    if (answers.length < questions.length) {
        alert('Mohon jawab semua pertanyaan!');
        return;
    }
    const score = answers.reduce((a, b) => a + b, 0);
    const percentage = Math.round((score / (questions.length * 3)) * 100);
    let category, message, icon, color;
    
    if (percentage <= 25) {
        category = "Kesehatan Mental Baik";
        message = "Kondisi mental Anda saat ini dalam keadaan baik. Terus jaga dengan pola hidup sehat!";
        icon = "fa-smile"; color = "#6BCF7F";
    } else if (percentage <= 50) {
        category = "Perlu Perhatian";
        message = "Anda mengalami beberapa gejala yang perlu diperhatikan. Pertimbangkan berbicara dengan teman atau keluarga.";
        icon = "fa-meh"; color = "#FF9F6D";
    } else if (percentage <= 75) {
        category = "Butuh Dukungan";
        message = "Anda menunjukkan tanda-tanda yang cukup signifikan. Disarankan untuk berbicara dengan profesional kesehatan mental.";
        icon = "fa-frown"; color = "#F093B0";
    } else {
        category = "Segera Cari Bantuan";
        message = "Kondisi Anda memerlukan perhatian serius. Segera hubungi profesional atau hotline: 119 ext 8";
        icon = "fa-sad-tear"; color = "#EF4444";
    }
    
    const resultData = {
        score,
        percentage,
        category,
        message,
        icon,
        color,
        createdAt: new Date().toISOString()
    };

    renderResult(resultData);
    saveLocalResult(resultData);

    const user = await checkAuth();
    if (user) {
        await saveQuizResult(score, percentage, category, answers);
        setResultNote(`Hasil tersimpan di akun Anda. Terakhir diperbarui: ${formatDate(resultData.createdAt)}.`);
    } else {
        setResultNote('Hasil tersimpan di perangkat ini. Login untuk menyimpan ke akun.');
    }
}

// Reset UI and state for a fresh attempt.
function resetQuiz() {
    currentQuestion = 0;
    answers = [];
    document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
    document.getElementById('quizResult').style.display = 'none';
    document.getElementById('quizResult').classList.remove('reveal');
    const startScreen = document.getElementById('quizStart');
    if (startScreen) {
        startScreen.style.display = 'block';
    }
    document.getElementById('progressBar').style.width = '0%';
}

// Render result UI from a data object.
function renderResult(data) {
    document.getElementById('quizForm').style.display = 'none';
    const startScreen = document.getElementById('quizStart');
    if (startScreen) {
        startScreen.style.display = 'none';
    }

    const resultDiv = document.getElementById('quizResult');
    resultDiv.classList.remove('reveal');
    resultDiv.style.display = 'block';
    // Force reflow so the animation can replay on repeated results.
    void resultDiv.offsetWidth;
    resultDiv.classList.add('reveal');
    resultDiv.querySelector('.result-icon').innerHTML = `<i class="fas ${data.icon}" style="color: ${data.color}"></i>`;
    document.getElementById('resultScore').textContent = `${data.percentage}%`;
    document.getElementById('resultCategory').textContent = data.category;
    document.getElementById('resultCategory').style.color = data.color;
    document.getElementById('resultMessage').textContent = data.message;
}

// Save the last result locally on this device.
function saveLocalResult(data) {
    localStorage.setItem(LAST_RESULT_KEY, JSON.stringify(data));
    updateLastResultButton();
}

// Get the last result from local storage.
function getLocalResult() {
    try {
        const raw = localStorage.getItem(LAST_RESULT_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

// Show the last saved result (if any).
function showLastResult() {
    const data = getLocalResult();
    if (!data) return;
    renderResult(data);
    setResultNote(`Hasil terakhir tersimpan: ${formatDate(data.createdAt)}.`);
}

// Update the visibility of the "last result" button.
function updateLastResultButton() {
    const btn = document.getElementById('viewLastResultBtn');
    if (!btn) return;
    btn.style.display = getLocalResult() ? '' : 'none';
}

// Set helper note under the result message.
function setResultNote(text) {
    const note = document.getElementById('resultNote');
    if (!note) return;
    note.textContent = text || '';
}

// Format date/time in Indonesian locale.
function formatDate(isoString) {
    return new Date(isoString).toLocaleString('id-ID');
}

document.addEventListener('DOMContentLoaded', updateLastResultButton);
