// Toggle dropdown menu for the logged in user.
function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    dropdown.classList.toggle('show');
}

// Sign out the user and return to the home page.
async function handleLogout() {
    if (confirm('Yakin ingin keluar?')) {
        await signOut();
        window.location.href = 'index.html';
    }
}

// Open history modal and render the latest quiz results.
async function showHistory() {
    const modal = new bootstrap.Modal(document.getElementById('historyModal'));
    modal.show();
    const content = document.getElementById('historyContent');
    content.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div><p class="mt-3">Memuat...</p></div>';
    
    const result = await getQuizHistory();
    if (result.success && result.results.length > 0) {
        content.innerHTML = result.results.map(r => `
            <div class="card mb-3">
                <div class="card-body">
                    <h5>${r.category} - ${r.percentage}%</h5>
                    <p class="text-muted">Skor: ${r.score}/24 • ${new Date(r.created_at).toLocaleDateString('id-ID')}</p>
                </div>
            </div>
        `).join('');
    } else {
        content.innerHTML = '<div class="text-center py-5"><p>Belum ada riwayat quiz</p></div>';
    }
}

// Close the user dropdown when clicking outside the menu.
document.addEventListener('click', e => {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown && !e.target.closest('.user-menu-container')) {
        dropdown.classList.remove('show');
    }
});

// Show feature detail modal or open feature pages when a feature card is clicked.
document.addEventListener('DOMContentLoaded', () => {
    const featureMap = {
        asesmen: {
            title: 'Question Mental',
            body: 'Kuesioner singkat untuk memahami kondisi emosional dan tingkat stres Anda secara mandiri.'
        },
        konsultasi: {
            title: 'Konsultasi Ahli',
            body: 'Arahkan diri ke dukungan profesional untuk mendapatkan saran dan penanganan yang tepat.'
        },
        tracking: {
            title: 'Tracking Progress',
            body: 'Pantau perubahan kondisi dari waktu ke waktu agar Anda tahu perkembangan diri Anda.'
        }
    };

    document.querySelectorAll('.feature-card').forEach(card => {
        card.addEventListener('click', () => {
            const key = card.getAttribute('data-feature');
            const data = featureMap[key];
            if (key === 'asesmen') {
                window.location.href = 'quiz.html';
                return;
            }
            if (key === 'konsultasi') {
                window.location.href = 'consultation.html';
                return;
            }
            if (key === 'tracking') {
                window.location.href = 'tracking.html';
                return;
            }
            if (!data) return;

            const title = document.getElementById('featureModalTitle');
            const body = document.getElementById('featureModalBody');
            title.textContent = data.title;
            body.textContent = data.body;

            const modal = new bootstrap.Modal(document.getElementById('featureModal'));
            modal.show();
        });
    });
});
