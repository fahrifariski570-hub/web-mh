// Supabase project configuration.
const SUPABASE_URL = 'https://diljdveahysrkrtizpht.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_goVYyAg8OPMtnhmG9EY46g_RyabSfyR';

// Initialize Supabase client for auth and database calls (idempotent).
var supabase = window.__supabaseClient || window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__supabaseClient = supabase;

// Cached user session for UI updates.
let currentUser = null;

// Check the current authenticated user.
async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    currentUser = user;
    updateUI();
    return user;
}

// Update UI based on the current auth state.
function updateUI() {
    const authHidden = document.querySelectorAll('.auth-hidden');
    const authRequired = document.querySelectorAll('.auth-required');
    
    if (currentUser) {
        authHidden.forEach(el => el.style.display = 'none');
        authRequired.forEach(el => el.style.display = '');
        
        // Update user info
        document.querySelectorAll('.user-name').forEach(el => {
            el.textContent = currentUser.user_metadata?.full_name || currentUser.email.split('@')[0];
        });
        
        document.querySelectorAll('.user-email').forEach(el => {
            el.textContent = currentUser.email;
        });
        
        document.querySelectorAll('.user-initial').forEach(el => {
            const name = currentUser.user_metadata?.full_name || currentUser.email;
            el.textContent = name.charAt(0).toUpperCase();
        });
    } else {
        authHidden.forEach(el => el.style.display = '');
        authRequired.forEach(el => el.style.display = 'none');
    }
}

// Register a new user and create a profile record.
async function signUp(email, password, fullName) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName }
            }
        });
        
        if (error) throw error;
        
        // Create profile
        if (data.user) {
            await supabase.from('users').insert([{
                user_id: data.user.id,
                email,
                full_name: fullName
            }]);
        }
        
        return { success: true, user: data.user };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Sign in with email and password.
async function signIn(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        
        currentUser = data.user;
        return { success: true, user: data.user };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Sign out and clear local auth state.
async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        currentUser = null;
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Save a completed quiz result for the user.
async function saveQuizResult(score, percentage, category, answers) {
    try {
        const user = await checkAuth();
        if (!user) throw new Error('Not authenticated');
        
        const { data, error } = await supabase
            .from('quiz_results')
            .insert([{
                user_id: user.id,
                score,
                percentage,
                category,
                answers
            }])
            .select();
        
        if (error) throw error;
        
        return { success: true, data: data[0] };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Fetch recent quiz history for the user.
async function getQuizHistory() {
    try {
        const user = await checkAuth();
        if (!user) throw new Error('Not authenticated');
        
        const { data, error } = await supabase
            .from('quiz_results')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10);
        
        if (error) throw error;
        
        return { success: true, results: data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// OAuth Providers.
async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
    });
}

// GitHub OAuth sign-in.
async function signInWithGithub() {
    await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: { redirectTo: window.location.origin }
    });
}

// Keep UI in sync with auth changes.
supabase.auth.onAuthStateChange((event, session) => {
    currentUser = session?.user || null;
    updateUI();
});

// Initialize auth state on page load.
document.addEventListener('DOMContentLoaded', checkAuth);
