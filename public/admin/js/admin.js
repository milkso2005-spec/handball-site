/* ============================================
   🛡️ ADMIN PANEL - Main JavaScript (API v2.0)
   ============================================ */

// === GLOBALS ===
const API_BASE_URL = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost' 
    ? 'http://127.0.0.1:8000' 
    : '/api';
let currentUser = null;

// === HELPER: API FETCH ===
async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem('adminToken');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        window.location.href = 'login.html';
        return;
    }

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Une erreur est survenue');
    }

    return response.json();
}

// === INIT ===
document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
    initUploadZones();
    initAdminModals();
    checkAuth();
});

// === AUTH CHECK ===
async function checkAuth() {
    const page = window.location.pathname.split('/').pop();
    if (page === 'login.html') return;

    const token = localStorage.getItem('adminToken');
    const savedUser = localStorage.getItem('adminUser');

    if (!token || !savedUser) {
        window.location.href = 'login.html';
        return;
    }

    try {
        currentUser = JSON.parse(savedUser);
        loadDashboard();
        
        // Refresh user info from server to ensure token is still valid
        const user = await apiFetch('/auth/me');
        currentUser = user;
        localStorage.setItem('adminUser', JSON.stringify(user));
        updateSidebarUserInfo();
    } catch (err) {
        console.error('Auth verification failed:', err);
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        window.location.href = 'login.html';
    }
}

// === LOGIN ===
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');
    const submitBtn = document.getElementById('login-submit');
    
    errorEl.classList.remove('visible');
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Identifiants incorrects');
        }

        const data = await response.json();
        localStorage.setItem('adminToken', data.access_token);
        
        // Get user profile
        const user = await apiFetch('/auth/me');
        localStorage.setItem('adminUser', JSON.stringify(user));
        
        showToast(`Bienvenue, ${user.name} !`, 'success');
        
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 800);
    } catch (err) {
        errorEl.textContent = err.message;
        errorEl.classList.add('visible');
    } finally {
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
    }
}

// === LOGOUT ===
function handleLogout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.href = 'login.html';
}

// === SIDEBAR ===
function initSidebar() {
    const burger = document.querySelector('.topbar-burger');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    if (burger && sidebar) {
        burger.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            if (overlay) overlay.classList.toggle('active');
        });
        
        if (overlay) {
            overlay.addEventListener('click', () => {
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
            });
        }
    }
}

function updateSidebarUserInfo() {
    if (!currentUser) return;
    const userName = document.querySelector('.sidebar-user-name');
    const userRole = document.querySelector('.sidebar-user-role');
    const userAvatar = document.querySelector('.sidebar-user-avatar');
    
    if (userName) userName.textContent = currentUser.name;
    if (userRole) userRole.textContent = currentUser.role === 'super-admin' ? 'Super Admin' : 'Admin';
    if (userAvatar) userAvatar.textContent = currentUser.name.charAt(0).toUpperCase();
}

// === DASHBOARD ===
async function loadDashboard() {
    if (!currentUser) return;
    updateSidebarUserInfo();
    
    const page = window.location.pathname.split('/').pop();
    if (page === 'dashboard.html' || page === '') {
        loadStats();
        // loadRecentActivity(); // Optional: could be fetched from a logs endpoint later
    }
    
    if (page === 'manage-users.html') {
        loadAdminsList();
    }
}

async function loadStats() {
    try {
        const stats = await apiFetch('/stats');
        animateCounter('stat-players', stats.players);
        animateCounter('stat-videos', 0); // Need a video table/endpoint later
        animateCounter('stat-competitions', stats.matches);
        animateCounter('stat-trophies', stats.trophies);
    } catch (err) {
        console.error('Failed to load stats:', err);
    }
}

function animateCounter(elementId, target) {
    const el = document.getElementById(elementId);
    if (!el) return;
    
    const duration = 1000;
    const start = performance.now();
    const startVal = parseInt(el.textContent) || 0;
    
    function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(startVal + (target - startVal) * eased);
        if (progress < 1) requestAnimationFrame(update);
        else el.textContent = target;
    }
    requestAnimationFrame(update);
}

// === UPLOAD ZONES ===
function initUploadZones() {
    document.querySelectorAll('.upload-area').forEach(zone => {
        const input = zone.querySelector('input[type="file"]');
        if (!input) return;
        
        zone.addEventListener('click', () => input.click());
        zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
        zone.addEventListener('dragleave', () => { zone.classList.remove('dragover'); });
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('dragover');
            handleFileUpload(e.dataTransfer.files, zone);
        });
        input.addEventListener('change', () => { handleFileUpload(input.files, zone); });
    });
}

async function handleFileUpload(files, zone) {
    if (files.length === 0) return;
    const file = files[0];
    const maxSize = 100 * 1024 * 1024; // 100MB

    if (file.size > maxSize) {
        showToast(`Fichier "${file.name}" trop volumineux (max 100MB)`, 'error');
        return;
    }

    const progressEl = zone.parentElement.querySelector('.upload-progress');
    const fill = progressEl?.querySelector('.progress-fill');
    const text = progressEl?.querySelector('.progress-text');

    if (progressEl) progressEl.classList.add('visible');
    if (fill) fill.style.width = '30%';
    if (text) text.textContent = 'Upload en cours...';

    const formData = new FormData();
    formData.append('file', file);

    try {
        const token = localStorage.getItem('adminToken');
        const res = await fetch(`${API_BASE_URL}/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        if (!res.ok) throw new Error('Upload échoué');

        const data = await res.json();
        showToast('Fichier uploadé !', 'success');
        if (fill) fill.style.width = '100%';
        if (text) text.textContent = '✅ Terminé';
        
        // Store URL in a hidden input if exists or return it
        const hiddenInput = zone.parentElement.querySelector('input[type="hidden"]');
        if (hiddenInput) hiddenInput.value = data.url;
        
        setTimeout(() => progressEl?.classList.remove('visible'), 2000);
        return data.url;
    } catch (err) {
        showToast(err.message, 'error');
        if (progressEl) progressEl.classList.remove('visible');
    }
}

// === CONTENT MANAGEMENT ===

async function addPlayer(e) {
    e.preventDefault();
    const form = e.target;
    const data = {
        name: form.querySelector('#player-name').value.trim(),
        poste: form.querySelector('#player-poste').value,
        category: form.querySelector('#player-category').value,
        bio: form.querySelector('textarea')?.value.trim(),
        photo_url: form.querySelector('input[type="hidden"]')?.value || "assets/images/player-action.png"
    };

    try {
        await apiFetch('/players', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        showToast('Joueur ajouté !', 'success');
        form.reset();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function addMatch(e) {
    e.preventDefault();
    const form = e.target;
    const data = {
        home_team: form.querySelector('#match-home').value.trim(),
        away_team: form.querySelector('#match-away').value.trim(),
        home_score: parseInt(form.querySelector('#score-home').value),
        away_score: parseInt(form.querySelector('#score-away').value),
        status: form.querySelector('#match-status').value,
        competition: form.querySelector('#match-competition').value
    };

    try {
        await apiFetch('/matches', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        showToast('Match ajouté !', 'success');
        form.reset();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function addTrophy(e) {
    e.preventDefault();
    const form = e.target;
    const data = {
        year: form.querySelector('#trophy-year').value.trim(),
        name: form.querySelector('#trophy-name').value.trim(),
        description: form.querySelector('#trophy-description')?.value.trim()
    };

    try {
        await apiFetch('/trophies', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        showToast('Trophée ajouté !', 'success');
        form.reset();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function addHommage(e) {
    e.preventDefault();
    const form = e.target;
    const data = {
        name: form.querySelector('#hommage-name').value.trim(),
        subtitle: form.querySelector('#hommage-subtitle')?.value.trim(),
        message: form.querySelector('#hommage-message').value.trim()
    };

    try {
        await apiFetch('/hommages', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        showToast('Hommage ajouté !', 'success');
        form.reset();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// === ADMIN MANAGEMENT ===

async function loadAdminsList() {
    const tableBody = document.querySelector('.admin-table tbody');
    if (!tableBody) return;

    try {
        const admins = await apiFetch('/admins');
        tableBody.innerHTML = admins.map(admin => `
            <tr>
                <td>
                    <div class="table-user">
                        <div class="table-user-avatar">${admin.name.charAt(0).toUpperCase()}</div>
                        <div>
                            <div class="table-user-name">${admin.name}</div>
                            <div class="table-user-email">${admin.email}</div>
                        </div>
                    </div>
                </td>
                <td><span class="status-badge ${admin.role}">${admin.role === 'super-admin' ? '👑 Super Admin' : '🛡️ Admin'}</span></td>
                <td><span class="status-badge active">Actif</span></td>
                <td>${new Date(admin.created_at).toLocaleDateString()}</td>
                <td>
                    <div class="table-actions">
                        ${currentUser.role === 'super-admin' && admin.id !== currentUser.id ? 
                            `<button class="delete" title="Supprimer" onclick="deleteAdmin(${admin.id})">🗑️</button>` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        showToast('Erreur chargement admins', 'error');
    }
}

async function addAdmin(e) {
    e.preventDefault();
    const form = e.target;
    const data = {
        name: form.querySelector('#admin-name').value.trim(),
        email: form.querySelector('#admin-email').value.trim(),
        password: form.querySelector('#admin-password').value,
        role: form.querySelector('#admin-role').value
    };

    try {
        await apiFetch('/admins', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        showToast('Administrateur créé !', 'success');
        form.reset();
        loadAdminsList();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function deleteAdmin(id) {
    if (!confirm('Supprimer cet administrateur ?')) return;

    try {
        await apiFetch(`/admins/${id}`, { method: 'DELETE' });
        showToast('Admin supprimé', 'success');
        loadAdminsList();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// === UI HELPERS ===

function initAdminModals() {
    document.querySelectorAll('.admin-modal-close').forEach(btn => {
        btn.addEventListener('click', () => btn.closest('.admin-modal-overlay').classList.remove('active'));
    });
}

function switchTab(tabGroup, tabId) {
    document.querySelectorAll(`[data-tab-group="${tabGroup}"]`).forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll(`[data-tab-content="${tabGroup}"]`).forEach(content => content.style.display = 'none');
    document.querySelector(`[data-tab-group="${tabGroup}"][data-tab="${tabId}"]`)?.classList.add('active');
    const content = document.getElementById(tabId);
    if (content) content.style.display = 'block';
}

function showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container-admin');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container-admin';
        document.body.appendChild(container);
    }
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    const toast = document.createElement('div');
    toast.className = `toast-admin ${type}`;
    toast.innerHTML = `
        <span class="toast-admin-icon">${icons[type] || 'ℹ️'}</span>
        <span class="toast-admin-text">${message}</span>
        <button class="toast-admin-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}
