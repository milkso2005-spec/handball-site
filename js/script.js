/* ==============================
   PUBLIC SITE – MAIN SCRIPT
   ============================== */

const API_BASE_URL = (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost')
    ? 'http://127.0.0.1:8000'
    : '/api';

// ---------- INITIALISATION ----------
document.addEventListener('DOMContentLoaded', () => {
  initLoader();
  initLazyLoading();
  initDataFromAPI();
  initVideoPlayer();
  initFilters();
});

// ---------- LOADER ----------
function initLoader() {
  const loader = document.querySelector('.loader');
  if (loader) loader.style.display = 'none';
}

// ---------- LAZY-LOADING ----------
function initLazyLoading() {
  const lazyImages = document.querySelectorAll('img[loading="lazy"]');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src || img.src;
          obs.unobserve(img);
        }
      });
    });
    lazyImages.forEach(img => observer.observe(img));
  }
}

// ---------- DYNAMIC DATA ----------
let playersData = {};

async function initDataFromAPI() {
  try {
    const res = await fetch(`${API_BASE_URL}/players`);
    if (res.ok) {
      const players = await res.json();
      players.forEach(p => {
        playersData[`api-${p.id}`] = {
          name: p.name,
          role: p.poste,
          photo: p.photo_url || 'assets/images/player-action.png',
          bio: p.bio || '',
          stats: {
            buts: p.stats_buts || 0,
            matches: p.stats_matches || 0,
            passes: p.stats_passes || 0,
          },
          years: p.years || '',
        };
      });
      console.log('✅ Joueurs chargés depuis l\'API');
    }
  } catch (e) {
    console.warn('⚠️ Impossible de récupérer les joueurs depuis l\'API');
  }
}

// ---------- MODALS ----------
function openPlayerModal(playerId) {
  const player = playersData[playerId];
  if (!player) return;

  let overlay = document.querySelector('.player-modal-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'player-modal-overlay';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.remove('active');
    });
  }

  overlay.innerHTML = `
    <div class="player-modal">
      <div class="player-modal-header">
        <img src="${player.photo}" alt="${player.name}">
        <button class="player-modal-close">&times;</button>
      </div>
      <div class="player-modal-body">
        <h2 class="player-modal-name">${player.name}</h2>
        <p class="player-modal-role">${player.role} • ${player.years}</p>
        <p class="player-modal-bio">${player.bio}</p>
        <div class="player-modal-stats-grid">
          <div class="stat-box"><div class="stat-box-value">${player.stats.buts}</div><div class="stat-box-label">Buts</div></div>
          <div class="stat-box"><div class="stat-box-value">${player.stats.matches}</div><div class="stat-box-label">Matchs</div></div>
          <div class="stat-box"><div class="stat-box-value">${player.stats.passes}</div><div class="stat-box-label">Passes D.</div></div>
        </div>
      </div>
    </div>
  `;

  overlay.querySelector('.player-modal-close').addEventListener('click', () => {
    overlay.classList.remove('active');
  });
  requestAnimationFrame(() => overlay.classList.add('active'));
}

// ---------- VIDEO PLAYER ----------
function initVideoPlayer() {
  const mainPlayer = document.getElementById('main-video-player');
  const videoCards = document.querySelectorAll('.video-card');
  if (!mainPlayer) return;

  videoCards.forEach(card => {
    card.addEventListener('click', () => {
      const src = card.getAttribute('data-video-src');
      if (src) {
        mainPlayer.innerHTML = `<iframe src="${src}" allowfullscreen></iframe>`;
        mainPlayer.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  });
}

// ---------- FILTERS ----------
function initFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const filterItems = document.querySelectorAll('[data-filter]');
  if (!filterBtns.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.getAttribute('data-filter');
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterItems.forEach(item => {
        const cat = item.getAttribute('data-filter');
        item.style.display = cat === filter || filter === 'all' ? 'block' : 'none';
      });
    });
  });
}
