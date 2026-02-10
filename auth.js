// Show login form and hide other auth forms.
function showLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('forgotForm').style.display = 'none';
    clearAlerts();
}

// Show register form and hide other auth forms.
function showRegister() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('forgotForm').style.display = 'none';
    clearAlerts();
}

// Show forgot-password form and hide other auth forms.
function showForgotPassword() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('forgotForm').style.display = 'block';
    clearAlerts();
}

// Hide all alert banners.
function clearAlerts() {
    document.querySelectorAll('.alert').forEach(a => a.style.display = 'none');
}

// Handle login submission and redirect on success.
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const btn = document.getElementById('loginBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Masuk...';
    
    const result = await signIn(email, password);
    if (result.success) {
        window.location.href = 'index.html';
    } else {
        const err = document.getElementById('loginError');
        err.textContent = result.error;
        err.style.display = 'block';
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Masuk';
    }
}

// Resend email confirmation link for the given email.
async function handleResendConfirmation() {
    clearAlerts();
    const email = document.getElementById('loginEmail').value;
    const info = document.getElementById('resendInfo');
    const err = document.getElementById('loginError');

    if (!email) {
        err.textContent = 'Masukkan email Anda terlebih dahulu.';
        err.style.display = 'block';
        return;
    }

    try {
        info.textContent = 'Mengirim ulang email verifikasi...';
        info.style.display = 'block';

        const { error } = await supabase.auth.resend({
            type: 'signup',
            email: email,
            options: { emailRedirectTo: window.location.origin + '/login.html' }
        });

        if (error) throw error;

        info.textContent = 'Email verifikasi telah dikirim. Silakan cek inbox/spam.';
    } catch (error) {
        info.style.display = 'none';
        err.textContent = error.message || 'Gagal mengirim email verifikasi.';
        err.style.display = 'block';
    }
}

// Handle register submission and show success message.
async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const btn = document.getElementById('registerBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mendaftar...';
    
    const result = await signUp(email, password, name);
    if (result.success) {
        const suc = document.getElementById('registerSuccess');
        suc.textContent = 'Akun berhasil dibuat! Silakan login.';
        suc.style.display = 'block';
        setTimeout(() => showLogin(), 2000);
    } else {
        const err = document.getElementById('registerError');
        err.textContent = result.error;
        err.style.display = 'block';
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-user-plus"></i> Daftar';
    }
}

// Send reset-password email via Supabase.
async function handleForgotPassword(e) {
    e.preventDefault();
    const email = document.getElementById('forgotEmail').value;
    const btn = document.getElementById('forgotBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim...';
    
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        const suc = document.getElementById('forgotSuccess');
        suc.textContent = 'Link reset password telah dikirim ke email Anda!';
        suc.style.display = 'block';
        setTimeout(() => showLogin(), 3000);
    } catch (error) {
        const err = document.getElementById('forgotError');
        err.textContent = error.message;
        err.style.display = 'block';
    }
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-paper-plane"></i> Kirim Link Reset';
}

// Toggle password visibility for a given input.
function togglePassword(id, btn) {
    const input = document.getElementById(id);
    const icon = btn.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

// Update password strength UI based on simple heuristics.
function checkPasswordStrength(pwd) {
    const el = document.getElementById('passwordStrength');
    const fill = document.getElementById('strengthFill');
    const text = document.getElementById('strengthText');
    if (!pwd) {
        el.style.display = 'none';
        return;
    }
    el.style.display = 'block';
    let s = 0;
    if (pwd.length >= 6) s++;
    if (pwd.length >= 10) s++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) s++;
    if (/\d/.test(pwd)) s++;
    if (s <= 1) {
        fill.style.width = '33%';
        fill.style.background = '#EF4444';
        text.textContent = 'Lemah';
        text.style.color = '#EF4444';
    } else if (s <= 3) {
        fill.style.width = '66%';
        fill.style.background = '#FF9F6D';
        text.textContent = 'Sedang';
        text.style.color = '#FF9F6D';
    } else {
        fill.style.width = '100%';
        fill.style.background = '#6BCF7F';
        text.textContent = 'Kuat';
        text.style.color = '#6BCF7F';
    }
}

// Redirect authenticated users away from login page.
document.addEventListener('DOMContentLoaded', async () => {
    const user = await checkAuth();
    if (user && window.location.pathname.includes('login.html')) {
        window.location.href = 'index.html';
    }
});
