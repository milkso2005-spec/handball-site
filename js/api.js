/* ============================================
   🌐 API CLIENT - Public Data Fetching
   ============================================ */

const API_BASE_URL = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost' 
    ? 'http://127.0.0.1:8000' 
    : '/api';

const API = {
    async getPlayers() {
        try {
            const res = await fetch(`${API_BASE_URL}/players`);
            return res.ok ? await res.json() : [];
        } catch (e) {
            console.error('API Error (Players):', e);
            return [];
        }
    },

    async getMatches() {
        try {
            const res = await fetch(`${API_BASE_URL}/matches`);
            return res.ok ? await res.json() : [];
        } catch (e) {
            console.error('API Error (Matches):', e);
            return [];
        }
    },

    async getTrophies() {
        try {
            const res = await fetch(`${API_BASE_URL}/trophies`);
            return res.ok ? await res.json() : [];
        } catch (e) {
            console.error('API Error (Trophies):', e);
            return [];
        }
    },

    async getHommages() {
        try {
            const res = await fetch(`${API_BASE_URL}/hommages`);
            return res.ok ? await res.json() : [];
        } catch (e) {
            console.error('API Error (Hommages):', e);
            return [];
        }
    }
};

window.HB_API = API;
