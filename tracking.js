const key = 'mindcare_last_result';

function renderTracking(data, note) {
    const result = document.getElementById('trackingResult');
    result.classList.remove('reveal');
    result.style.display = 'block';
    document.getElementById('trackingEmpty').style.display = 'none';
    // Force reflow so the animation can replay on refreshes.
    void result.offsetWidth;
    result.classList.add('reveal');
    document.getElementById('trackingScore').textContent = `${data.percentage}%`;
    document.getElementById('trackingCategory').textContent = data.category;
    document.getElementById('trackingCategory').style.color = data.color;
    document.getElementById('trackingMessage').textContent = data.message;
    document.getElementById('trackingNote').textContent = note || '';
    document.getElementById('trackingIcon').innerHTML = `<i class="fas ${data.icon}" style="color: ${data.color}"></i>`;
}

function getLocalResult() {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function deriveResult(percentage) {
    if (percentage <= 25) {
        return {
            message: 'Kondisi mental Anda saat ini dalam keadaan baik. Terus jaga dengan pola hidup sehat!',
            icon: 'fa-smile',
            color: '#6BCF7F'
        };
    }
    if (percentage <= 50) {
        return {
            message: 'Anda mengalami beberapa gejala yang perlu diperhatikan. Pertimbangkan berbicara dengan teman atau keluarga.',
            icon: 'fa-meh',
            color: '#FF9F6D'
        };
    }
    if (percentage <= 75) {
        return {
            message: 'Anda menunjukkan tanda-tanda yang cukup signifikan. Disarankan untuk berbicara dengan profesional kesehatan mental.',
            icon: 'fa-frown',
            color: '#F093B0'
        };
    }
    return {
        message: 'Kondisi Anda memerlukan perhatian serius. Segera hubungi profesional atau hotline: 119 ext 8',
        icon: 'fa-sad-tear',
        color: '#EF4444'
    };
}

async function loadTracking() {
    const local = getLocalResult();
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;

    if (user) {
        const { data, error } = await supabase
            .from('quiz_results')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1);

        if (!error && data && data.length) {
            const row = data[0];
            const derived = deriveResult(row.percentage);
            renderTracking({
                percentage: row.percentage,
                category: row.category,
                message: derived.message,
                icon: derived.icon,
                color: derived.color,
                createdAt: row.created_at
            }, `Terakhir diperbarui: ${new Date(row.created_at).toLocaleString('id-ID')}`);
            return;
        }
    }

    if (local) {
        renderTracking(local, `Terakhir diperbarui: ${new Date(local.createdAt).toLocaleString('id-ID')}`);
        return;
    }

    document.getElementById('trackingResult').style.display = 'none';
    document.getElementById('trackingResult').classList.remove('reveal');
    document.getElementById('trackingEmpty').style.display = 'block';
}

document.addEventListener('DOMContentLoaded', loadTracking);
