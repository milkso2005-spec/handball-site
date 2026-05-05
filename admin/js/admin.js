/* ============================================
   🛡️ ADMIN PANEL - Main JavaScript
   ============================================ */

// === GLOBALS ===
const API_BASE_URL = (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost')
    ? 'http://127.0.0.1:8000'
    : '/api';

let currentUser = null;
let authToken = null;
let isAdminReady = false;

// === INIT ===
document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  initUploadZones();
  initAdminModals();
  checkAuth();
});

// === AUTH CHECK ===
function checkAuth() {
  const page = window.location.pathname.split('/').pop();
  if (page === 'login.html') return;

  authToken = sessionStorage.getItem('authToken');
  const savedUser = sessionStorage.getItem('adminUser');
  if (!authToken || !savedUser) {
    window.location.href = 'login.html';
    return;
  }

  currentUser = JSON.parse(savedUser);
  isAdminReady = true;
  loadDashboard();
}

// === AUTHENTICATED FETCH ===
async function apiFetch(endpoint, options = {}) {
  const headers = options.headers || {};
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  return fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
}

// === LOGIN ===
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');
  const submitBtn = document.getElementById('login-submit');

  errorEl.classList.remove('visible');

  if (!email || !password) {
    errorEl.textContent = 'Veuillez remplir tous les champs.';
    errorEl.classList.add('visible');
    return;
  }

  // Show loading state
  if (submitBtn) submitBtn.disabled = true;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      const data = await res.json();
      authToken = data.access_token;
      sessionStorage.setItem('authToken', authToken);

      // Fetch user profile
      const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      if (meRes.ok) {
        const user = await meRes.json();
        sessionStorage.setItem('adminUser', JSON.stringify(user));
        showToast(`Bienvenue, ${user.name} !`, 'success');
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 800);
      }
    } else {
      const err = await res.json().catch(() => ({}));
      errorEl.textContent = err.detail || 'Email ou mot de passe incorrect.';
      errorEl.classList.add('visible');
    }
  } catch (err) {
    errorEl.textContent = 'Impossible de contacter le serveur.';
    errorEl.classList.add('visible');
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

// === LOGOUT ===
function handleLogout() {
  sessionStorage.removeItem('adminUser');
  sessionStorage.removeItem('authToken');
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

// === DASHBOARD ===
function loadDashboard() {
  if (!currentUser) return;

  const userName = document.querySelector('.sidebar-user-name');
  const userRole = document.querySelector('.sidebar-user-role');
  const userAvatar = document.querySelector('.sidebar-user-avatar');

  if (userName) userName.textContent = currentUser.name || currentUser.email;
  if (userRole) userRole.textContent = currentUser.role === 'super-admin' ? 'Super Admin' : 'Admin';
  if (userAvatar) userAvatar.textContent = (currentUser.name || currentUser.email)[0].toUpperCase();

  loadStats();
  loadRecentActivity();
}

async function loadStats() {
  try {
    const res = await apiFetch('/stats');
    if (res.ok) {
      const stats = await res.json();
      animateCounter('stat-players', stats.players || 0);
      animateCounter('stat-videos', 24); // no video model yet
      animateCounter('stat-competitions', stats.matches || 0);
      animateCounter('stat-trophies', stats.trophies || 0);
    }
  } catch (e) {
    // Fallback to static values if API is unreachable
    animateCounter('stat-players', 13);
    animateCounter('stat-videos', 24);
    animateCounter('stat-competitions', 8);
    animateCounter('stat-trophies', 23);
  }
}

function animateCounter(elementId, target) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const duration = 1500;
  const start = performance.now();

  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(eased * target);
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

function loadRecentActivity() {
  addActivityLog('success', 'Systeme pret pour ajout de donnees');
}

function addActivityLog(type, text) {
  const container = document.getElementById('activity-list');
  if (!container) return;
  const item = document.createElement('div');
  item.className = 'activity-item';
  item.innerHTML = `
    <div class="activity-dot ${type}"></div>
    <div class="activity-text"><p>${text}</p></div>
    <div class="activity-time">A l'instant</div>
  `;
  container.insertBefore(item, container.firstChild);
}

function initAdminModals() {
  document.querySelectorAll('.admin-modal-close').forEach(btn => {
    btn.addEventListener('click', () => btn.closest('.admin-modal-overlay').classList.remove('active'));
  });
}

function switchTab(group, id) {
  document.querySelectorAll(`[data-tab-group="${group}"]`).forEach(t => t.classList.remove('active'));
  document.querySelectorAll(`[data-tab-content="${group}"]`).forEach(c => c.style.display = 'none');
  document.querySelector(`[data-tab-group="${group}"][data-tab="${id}"]`)?.classList.add('active');
  const content = document.getElementById(id);
  if (content) content.style.display = 'block';
}

function initUploadZones() {
  document.querySelectorAll('.upload-area').forEach(zone => {
    const input = zone.querySelector('input[type="file"]');
    if (!input) return;
    zone.addEventListener('click', () => input.click());
    input.addEventListener('change', () => handleFileUpload(input.files, zone));
  });
}

function handleFileUpload(files, zone) {
  Array.from(files).forEach(file => {
    uploadToFastAPI(file, zone);
  });
}

async function uploadToFastAPI(file, zone) {
  const progressEl = zone.parentElement.querySelector('.upload-progress');
  if (progressEl) progressEl.classList.add('visible');

  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await apiFetch('/upload', {
      method: 'POST',
      body: formData,
    });
    if (res.ok) {
      const data = await res.json();
      showToast('Upload reussi !', 'success');
      if (progressEl) progressEl.classList.remove('visible');
      return data.url;
    }
  } catch (e) {
    showToast('Erreur d\'upload', 'error');
    if (progressEl) progressEl.classList.remove('visible');
  }
}

function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container-admin');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container-admin';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast-admin ${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// ══════════════════════════════════════════════════════════════
//  CRUD FUNCTIONS — All use authenticated API calls
// ══════════════════════════════════════════════════════════════

async function addPlayer(e) {
  e.preventDefault();
  const form = e.target;
  const name = form.querySelector('#player-name').value.trim();
  const poste = form.querySelector('#player-poste').value;
  const category = form.querySelector('#player-category').value;
  const photoInput = form.querySelector('input[type="file"]');

  let photoUrl = 'assets/images/player-action.png';
  if (photoInput && photoInput.files.length) {
    photoUrl = await uploadToFastAPI(photoInput.files[0], form);
  }

  try {
    const res = await apiFetch('/players', {
      method: 'POST',
      body: JSON.stringify({ name, poste, category, photo_url: photoUrl }),
    });
    if (res.ok) {
      showToast('Joueur ajoute !', 'success');
      addActivityLog('success', `Joueur "${name}" ajoute`);
      form.reset();
    } else {
      showToast('Erreur lors de l\'ajout', 'error');
    }
  } catch (err) {
    showToast('Erreur lors de l\'ajout', 'error');
  }
}

async function addMatch(e) {
  e.preventDefault();
  const form = e.target;
  const payload = {
    home_team: form.querySelector('#match-home').value.trim(),
    away_team: form.querySelector('#match-away').value.trim(),
    home_score: parseInt(form.querySelector('#score-home').value) || 0,
    away_score: parseInt(form.querySelector('#score-away').value) || 0,
    status: form.querySelector('#match-status').value,
    competition: form.querySelector('#match-competition').value,
  };

  try {
    const res = await apiFetch('/matches', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      showToast('Match ajoute !', 'success');
      addActivityLog('success', `Match ${payload.home_team} vs ${payload.away_team} ajoute`);
      form.reset();
    } else {
      showToast('Erreur lors de l\'ajout du match', 'error');
    }
  } catch (err) {
    showToast('Erreur lors de l\'ajout du match', 'error');
  }
}

async function addTrophy(e) {
  e.preventDefault();
  const form = e.target;
  const payload = {
    year: form.querySelector('#trophy-year').value.trim(),
    name: form.querySelector('#trophy-name').value.trim(),
    description: form.querySelector('#trophy-description')?.value.trim() || '',
  };

  try {
    const res = await apiFetch('/trophies', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      showToast('Trophee ajoute !', 'success');
      addActivityLog('success', `Trophee "${payload.name}" ajoute`);
      form.reset();
    } else {
      showToast('Erreur lors de l\'ajout du trophee', 'error');
    }
  } catch (err) {
    showToast('Erreur lors de l\'ajout du trophee', 'error');
  }
}

async function addHommage(e) {
  e.preventDefault();
  const form = e.target;
  const payload = {
    name: form.querySelector('#hommage-name').value.trim(),
    subtitle: form.querySelector('#hommage-subtitle')?.value.trim() || '',
    message: form.querySelector('#hommage-message').value.trim(),
  };

  try {
    const res = await apiFetch('/hommages', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      showToast('Hommage publie !', 'success');
      addActivityLog('success', `Hommage pour "${payload.name}" publie`);
      form.reset();
    } else {
      showToast('Erreur lors de la publication', 'error');
    }
  } catch (err) {
    showToast('Erreur lors de la publication', 'error');
  }
}
