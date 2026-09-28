import React, { useState, useEffect } from 'react';

const ThemeToggle = () => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.body.classList.remove('light-theme');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    // Notify charts and other listening components
    window.dispatchEvent(new Event('theme-changed'));
  };

  return (
    <button 
      className="theme-toggle-btn" 
      onClick={toggleTheme} 
      title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
      type="button"
      aria-label="Toggle visual theme"
    >
      <div className="theme-toggle-track">
        <i className="fa-solid fa-moon dark-icon"></i>
        <i className="fa-solid fa-sun light-icon"></i>
        <div className={`theme-toggle-thumb ${theme === 'light' ? 'light' : 'dark'}`}>
          <i className={`fa-solid ${theme === 'light' ? 'fa-sun' : 'fa-moon'}`}></i>
        </div>
      </div>
    </button>
  );
};

export default ThemeToggle;
