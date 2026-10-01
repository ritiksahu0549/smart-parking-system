// Authentication Service Helper
export const auth = {
  getToken() {
    return localStorage.getItem('token');
  },

  getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
    window.dispatchEvent(new Event('auth-change'));
  },

  login(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    window.dispatchEvent(new Event('auth-change'));
  },

  logout(redirect = false) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('auth-change'));
    if (redirect) {
      window.location.href = '/login';
    }
  },

  async fetch(url, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers
    };

    // Support VITE_API_URL for production deployment (e.g. Render backend URL)
    const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
    const requestUrl = url.startsWith('http') ? url : `${apiBase}${url}`;

    try {
      const response = await window.fetch(requestUrl, config);
      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        // Do not force-logout when attempting to log in or register
        if (url.includes('/login') || url.includes('/register')) {
          return data;
        }
        this.logout();
        throw new Error(data.message || 'Unauthorized session. Logged out.');
      }
      
      return data;
    } catch (error) {
      console.error(`API Fetch Error [${requestUrl}]:`, error);
      throw error;
    }
  }
};

export default auth;
