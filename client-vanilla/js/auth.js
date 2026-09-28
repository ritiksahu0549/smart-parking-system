// Auth Management Service
const auth = {
  getToken() {
    return localStorage.getItem('token');
  },

  getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  },

  async fetch(url, options = {}) {
    const token = this.getToken();
    if (!token) {
      this.logout();
      throw new Error('No authentication token found');
    }

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
      'Authorization': `Bearer ${token}`
    };

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(url, config);
      
      // Auto logout if token expires/invalid
      if (response.status === 401) {
        this.logout();
        return;
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API Fetch Error [${url}]:`, error);
      throw error;
    }
  }
};
