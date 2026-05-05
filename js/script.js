/* ============================================
   🏐 HANDBALL TEAM - Main JavaScript
   ============================================ */

// === DOM READY ===
document.addEventListener('DOMContentLoaded', () => {
  initLoader();
  initTheme();
  initNavbar();
  initScrollAnimations();
  initCounters();
  initGalleries();
  initModals();
  initVideoPlayer();
  initFilters();
  initUpload();
  initLazyLoading();
  initToastSystem();
  
  // Fetch dynamic data from API
  initDataFromAPI();
});

// === HELPERS ===
function getAssetPath(relativePath) {
    const isSubdir = window.location.pathname.includes('/equipe/');
    const base = isSubdir ? '../' : '';
    return base + relativePath;
}

// === LOADER ===
function initLoader() {
  const loader = document.getElementById('loader');
  if (!loader) return;

  window.addEventListener('load', () => {
    setTimeout(() => {
      loader.classList.add('hidden');
      document.body.style.overflow = '';
    }, 1200);
  });

  // Fallback
  setTimeout(() => {
    loader.classList.add('hidden');
    document.body.style.overflow = '';
  }, 4000);
}

// === THEME TOGGLE ===
function initTheme() {
  const toggle = document.querySelector('.theme-toggle');
  if (!toggle) return;

  const savedTheme = localStorage.getItem('theme') || 'dark';
  setTheme(savedTheme);

  toggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    setTheme(next);
    showToast(`Mode ${next === 'dark' ? 'sombre' : 'clair'} activé`, 'info');
  });
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  const toggle = document.querySelector('.theme-toggle');
  if (toggle) {
    toggle.innerHTML = theme === 'dark'
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  }
}

// === NAVBAR ===
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  const burger = document.querySelector('.burger');
  const navMobile = document.querySelector('.nav-mobile');
  const navLinks = document.querySelectorAll('.nav-mobile a');

  // Scroll effect
  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
  }

  // Burger menu
  if (burger && navMobile) {
    burger.addEventListener('click', () => {
      burger.classList.toggle('active');
      navMobile.classList.toggle('active');
      document.body.style.overflow = navMobile.classList.contains('active') ? 'hidden' : '';
    });

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        burger.classList.remove('active');
        navMobile.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }

  // Active link highlight — comparaison sur le chemin complet (fix sous-dossiers)
  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav-links a, .nav-mobile a').forEach(link => {
    const href = link.getAttribute('href');
    if (!href || href === '#') return;
    const isActive = currentPath.endsWith('/' + href) ||
                     currentPath.endsWith(href) ||
                     (currentPath.match(/\/$|\/index\.html$/) && href === 'index.html');
    if (isActive) link.classList.add('active');
  });
}

// === SCROLL ANIMATIONS ===
function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Don't unobserve to allow re-animation
      }
    });
  }, observerOptions);

  document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach(el => {
    observer.observe(el);
  });
}

// === COUNTER ANIMATION ===
function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(counter => observer.observe(counter));
}

function animateCounter(element) {
  const target = parseInt(element.getAttribute('data-count'));
  const suffix = element.getAttribute('data-suffix') || '';
  const duration = 2000;
  const start = 0;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease out cubic

    const current = Math.floor(start + (target - start) * eased);
    element.textContent = current + suffix;

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = target + suffix;
    }
  }

  requestAnimationFrame(update);
}

// === GALLERIES ===
function initGalleries() {
  // Image lightbox
  document.querySelectorAll('.gallery-item img, .gallery-grid img').forEach(img => {
    img.addEventListener('click', () => openImageModal(img.src, img.alt));
  });
}

function openImageModal(src, alt) {
  const overlay = document.createElement('div');
  overlay.className = 'image-modal-overlay active';
  overlay.innerHTML = `
    <div class="image-modal-close">&times;</div>
    <img src="${src}" alt="${alt || 'Image'}">
  `;
  document.body.appendChild(overlay);

  const close = overlay.querySelector('.image-modal-close');
  close.addEventListener('click', () => {
    overlay.classList.remove('active');
    setTimeout(() => overlay.remove(), 300);
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.remove('active');
      setTimeout(() => overlay.remove(), 300);
    }
  });
}

// === MODALS ===
function initModals() {
  // Player detail modals
  document.querySelectorAll('[data-player]').forEach(btn => {
    btn.addEventListener('click', () => {
      const playerId = btn.getAttribute('data-player');
      openPlayerModal(playerId);
    });
  });

  // Close modals on overlay click
  document.querySelectorAll('.player-modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
      }
    });
  });

  document.querySelectorAll('.player-modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.player-modal-overlay').classList.remove('active');
    });
  });
}

// === API DATA INIT ===
async function initDataFromAPI() {
    const page = window.location.pathname.split('/').pop();

    if (page === 'index.html' || page === '') {
        renderFeaturedPlayers();
        renderRecentMatches();
    } else if (page === 'actifs.html' || page === 'equipe/actifs.html') {
        renderAllPlayers('actif');
    } else if (page === 'anciens.html' || page === 'equipe/anciens.html') {
        renderAllPlayers('ancien');
    } else if (page === 'nouveaux.html' || page === 'equipe/nouveaux.html') {
        renderAllPlayers('nouveau');
    } else if (page === 'competition.html') {
        renderCompetitionMatches();
    } else if (page === 'sacre.html') {
        renderTrophies();
    } else if (page === 'hommage.html') {
        renderHommages();
    }
}

// === RENDERING FUNCTIONS ===

async function renderFeaturedPlayers() {
    const container = document.querySelector('.player-grid');
    if (!container) return;

    const players = await HB_API.getPlayers();
    if (players.length === 0) return;

    // Filter a few to show on homepage
    const featured = players.slice(0, 3);
    container.innerHTML = featured.map((p, i) => renderPlayerCard(p, i)).join('');
    initModals(); // Re-init modals for new elements
    initScrollAnimations();
}

async function renderAllPlayers(categoryFilter) {
    const container = document.querySelector('.player-grid');
    if (!container) return;

    const players = await HB_API.getPlayers();
    const filtered = categoryFilter 
        ? players.filter(p => p.category.toLowerCase().includes(categoryFilter))
        : players;

    if (filtered.length === 0) {
        container.innerHTML = '<p class="no-data">Aucun joueur trouvé pour cette catégorie.</p>';
        return;
    }

    container.innerHTML = filtered.map((p, i) => renderPlayerCard(p, i)).join('');
    initModals();
    initScrollAnimations();
}

function renderPlayerCard(p, index) {
    // Save to global data for modal access
    playersData[`api-${p.id}`] = {
        name: p.name,
        role: p.poste,
        photo: p.photo_url || '../assets/images/player-action.png',
        bio: p.bio || `Joueur de la catégorie ${p.category}`,
        stats: { buts: p.stats_buts || 0, matches: p.stats_matches || 0, passes: p.stats_passes || 0 },
        years: p.years || '2024 - Présent'
    };

    return `
        <div class="player-card reveal" style="transition-delay: ${index * 0.1}s" data-position="${p.poste.toLowerCase()}">
          <div class="player-card-img">
            <img src="${p.photo_url || getAssetPath('assets/images/player-action.png')}" alt="${p.name}">
            <span class="player-position">${p.poste}</span>
          </div>
          <div class="player-card-body">
            <h3 class="player-name">${p.name}</h3>
            <p class="player-role">${p.poste} - ${p.category}</p>
            <div class="player-stats">
              <div class="player-stat">
                <div class="player-stat-value">${p.stats_buts || 0}</div>
                <div class="player-stat-label">Buts</div>
              </div>
              <div class="player-stat">
                <div class="player-stat-value">${p.stats_matches || 0}</div>
                <div class="player-stat-label">Matchs</div>
              </div>
            </div>
            <button class="btn btn-primary btn-sm mt-2" data-player="api-${p.id}" style="width:100%;">Voir Plus</button>
          </div>
        </div>
    `;
}

async function renderRecentMatches() {
    const container = document.querySelector('.competition-list');
    if (!container || !window.location.pathname.match(/index\.html$|^ \/$/)) return;

    const matches = await HB_API.getMatches();
    if (matches.length === 0) return;

    container.innerHTML = matches.slice(0, 3).map((m, i) => renderMatchCard(m, i)).join('');
    initScrollAnimations();
}

async function renderCompetitionMatches() {
    const container = document.querySelector('.competition-list');
    if (!container || !window.location.pathname.includes('competition.html')) return;

    const matches = await HB_API.getMatches();
    if (matches.length === 0) {
        container.innerHTML = '<p class="no-data">Aucun match programmé.</p>';
        return;
    }

    container.innerHTML = matches.map((m, i) => renderMatchCard(m, i)).join('');
    initScrollAnimations();
}

function renderMatchCard(m, index) {
    const statusClass = m.status.toLowerCase() === 'en direct' ? 'live' : 
                       (m.status.toLowerCase() === 'terminé' ? 'finished' : 'upcoming');
    
    return `
        <div class="match-card reveal" style="transition-delay: ${index * 0.1}s" data-filter="${statusClass}">
          <div class="match-team home">
            <div class="match-team-logo">🏐</div>
            <div>
              <div class="match-team-name">${m.home_team}</div>
              <div class="match-team-sub">Domicile</div>
            </div>
          </div>
          <div class="match-score">
            <span class="match-status ${statusClass}">${m.status}</span>
            <div class="match-score-display">
              <span class="${m.home_score > m.away_score ? 'score-win' : ''}">${m.home_score}</span>
              <span style="color: var(--text-muted);">-</span>
              <span class="${m.away_score > m.home_score ? 'score-win' : ''}">${m.away_score}</span>
            </div>
            <div class="match-date">${m.competition || 'Championnat National'}</div>
          </div>
          <div class="match-team away">
            <div class="match-team-logo">⚡</div>
            <div>
              <div class="match-team-name">${m.away_team}</div>
              <div class="match-team-sub">Extérieur</div>
            </div>
          </div>
        </div>
    `;
}

async function renderTrophies() {
    const container = document.querySelector('.timeline');
    if (!container) return;

    const trophies = await HB_API.getTrophies();
    if (trophies.length === 0) return;

    container.innerHTML = trophies.map((t, i) => `
        <div class="timeline-item reveal" style="transition-delay: ${i * 0.1}s">
          <div class="timeline-dot"></div>
          <div class="timeline-content">
            <div class="timeline-year">${t.year}</div>
            <h3 class="timeline-title">🏆 ${t.name}</h3>
            <p class="timeline-desc">${t.description || "Félicitations à toute l'équipe pour ce sacre mérité lors de la saison " + t.year + "."}</p>
          </div>
        </div>
    `).join('');
    initScrollAnimations();
}

async function renderHommages() {
    const container = document.querySelector('.card-grid');
    if (!container) return;

    const hommages = await HB_API.getHommages();
    if (hommages.length === 0) return;

    container.innerHTML = hommages.map(h => `
        <div class="hommage-card reveal">
            <div class="hommage-card-img">
                <img src="${getAssetPath('assets/images/team-photo.png')}" alt="${h.name}">
            </div>
            <div class="hommage-card-body">
                <h3 class="hommage-card-name">${h.name}</h3>
                ${h.subtitle ? `<p style="margin-top: 4px; font-size: 13px; color: var(--gray-500);">${h.subtitle}</p>` : ''}
                <p class="hommage-card-message">"${h.message}"</p>
            </div>
        </div>
    `).join('');
    initScrollAnimations();
}

let playersData = {};


function openPlayerModal(playerId) {
  const player = playersData[playerId];
  if (!player) return;

  let overlay = document.querySelector('.player-modal-overlay');

  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'player-modal-overlay';
    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
      }
    });
  }

  overlay.innerHTML = `
    <div class="player-modal">
      <div class="player-modal-header">
        <img src="${player.photo}" alt="${player.name}" loading="lazy">
        <button class="player-modal-close">&times;</button>
      </div>
      <div class="player-modal-body">
        <h2 class="player-modal-name">${player.name}</h2>
        <p class="player-modal-role">${player.role} • ${player.years}</p>
        <p class="player-modal-bio">${player.bio}</p>
        <div class="player-modal-stats-grid">
          <div class="stat-box">
            <div class="stat-box-value">${player.stats.buts}</div>
            <div class="stat-box-label">Buts</div>
          </div>
          <div class="stat-box">
            <div class="stat-box-value">${player.stats.matches}</div>
            <div class="stat-box-label">Matchs</div>
          </div>
          <div class="stat-box">
            <div class="stat-box-value">${player.stats.passes}</div>
            <div class="stat-box-label">Passes D.</div>
          </div>
        </div>
        <div class="player-modal-gallery">
          <h4>Moments Marquants</h4>
          <div class="gallery-grid">
            <img src="assets/images/player-action.png" alt="Action" loading="lazy" onclick="openImageModal(this.src, '${player.name}')">
            <img src="assets/images/team-photo.png" alt="Équipe" loading="lazy" onclick="openImageModal(this.src, 'Photo équipe')">
            <img src="assets/images/celebration.png" alt="Célébration" loading="lazy" onclick="openImageModal(this.src, 'Célébration')">
          </div>
        </div>
      </div>
    </div>
  `;

  overlay.querySelector('.player-modal-close').addEventListener('click', () => {
    overlay.classList.remove('active');
  });

  requestAnimationFrame(() => overlay.classList.add('active'));
}

// === VIDEO PLAYER ===
function initVideoPlayer() {
  const mainPlayer = document.getElementById('main-video-player');
  const videoCards = document.querySelectorAll('.video-card');

  if (!mainPlayer) return;

  videoCards.forEach(card => {
    card.addEventListener('click', () => {
      const videoSrc = card.getAttribute('data-video-src');
      const videoType = card.getAttribute('data-video-type') || 'iframe';

      if (videoSrc) {
        if (videoType === 'iframe') {
          mainPlayer.innerHTML = `<iframe src="${videoSrc}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
        } else {
          mainPlayer.innerHTML = `<video src="${videoSrc}" controls autoplay style="width:100%;height:100%;object-fit:cover;"></video>`;
        }

        // Scroll to player
        mainPlayer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        showToast('Lecture vidéo démarrée', 'success');
      }
    });
  });
}

// === FILTERS ===
function initFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const filterItems = document.querySelectorAll('[data-filter]');

  if (!filterBtns.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.getAttribute('data-filter');

      // Update active state
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Filter items
      filterItems.forEach(item => {
        const category = item.getAttribute('data-filter');

        if (filter === 'all' || category === filter) {
          item.style.display = '';
          item.style.animation = 'fadeInUp 0.5s ease-out both';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });

  // Player position filters
  const positionBtns = document.querySelectorAll('.position-filter');
  const playerCards = document.querySelectorAll('[data-position]');

  positionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const position = btn.getAttribute('data-position');

      positionBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      playerCards.forEach(card => {
        const cardPosition = card.getAttribute('data-position');

        if (position === 'all' || cardPosition === position) {
          card.style.display = '';
          card.style.animation = 'fadeInUp 0.5s ease-out both';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

// === UPLOAD ===
function initUpload() {
  const uploadZone = document.getElementById('upload-zone');
  const fileInput = document.getElementById('file-input');

  if (!uploadZone || !fileInput) return;

  uploadZone.addEventListener('click', () => fileInput.click());

  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
  });

  uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('dragover');
  });

  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
  });

  fileInput.addEventListener('change', () => {
    handleFiles(fileInput.files);
  });
}

function handleFiles(files) {
  Array.from(files).forEach(file => {
    if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
      showToast(`Fichier "${file.name}" prêt pour l'upload`, 'success');
      // In production, upload to Cloudinary/Firebase/Supabase here
      // Example with Cloudinary:
      // uploadToCloudinary(file);
    } else {
      showToast(`Type de fichier non supporté: ${file.name}`, 'error');
    }
  });
}

// Placeholder for Cloudinary upload
function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'handball_team');

  fetch('https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload', {
    method: 'POST',
    body: formData
  })
  .then(response => response.json())
  .then(data => {
    showToast('Upload réussi!', 'success');
    console.log('Cloudinary URL:', data.secure_url);
  })
  .catch(error => {
    showToast('Erreur lors de l\'upload', 'error');
    console.error('Upload error:', error);
  });
}

// === LAZY LOADING ===
function initLazyLoading() {
  const lazyImages = document.querySelectorAll('img[data-src]');

  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      });
    }, { rootMargin: '100px' });

    lazyImages.forEach(img => imageObserver.observe(img));
  } else {
    // Fallback
    lazyImages.forEach(img => {
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    });
  }
}

// === TOAST SYSTEM ===
let toastContainer;

function initToastSystem() {
  toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }
}

function showToast(message, type = 'info') {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️'
  };

  toast.innerHTML = `
    <span>${icons[type] || 'ℹ️'}</span>
    <span>${message}</span>
    <button class="toast-close" onclick="this.parentElement.classList.add('removing'); setTimeout(() => this.parentElement.remove(), 300);">&times;</button>
  `;

  toastContainer.appendChild(toast);

  // Auto remove after 4 seconds
  setTimeout(() => {
    if (toast.parentElement) {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 300);
    }
  }, 4000);
}

// === SMOOTH SCROLL ===
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const targetId = this.getAttribute('href');
    if (targetId === '#') return;

    const target = document.querySelector(targetId);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// === KEYBOARD SHORTCUTS ===
document.addEventListener('keydown', (e) => {
  // Escape to close modals
  if (e.key === 'Escape') {
    document.querySelectorAll('.player-modal-overlay.active, .image-modal-overlay.active').forEach(modal => {
      modal.classList.remove('active');
    });
  }

  // D for dark mode toggle
  if (e.key === 'd' && !e.ctrlKey && !e.metaKey && e.target.tagName !== 'INPUT') {
    const toggle = document.querySelector('.theme-toggle');
    if (toggle) toggle.click();
  }
});

// === PERFORMANCE: Debounce scroll events ===
function debounce(func, wait = 10) {
  let timeout;
  return function executedFunction(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// === COPYRIGHT YEAR (auto-update) ===
document.querySelectorAll('.footer-bottom-text').forEach(el => {
  el.innerHTML = el.innerHTML.replace(/\b20\d{2}\b/, new Date().getFullYear());
});
