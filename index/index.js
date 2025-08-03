// index.js
// Ensures the hamburger menu works on the index page after dynamic header load
window.addEventListener('DOMContentLoaded', function() {
  // Apply theme globally on every page load
  const theme = localStorage.getItem('siteTheme') || 'system';
  document.body.classList.remove('dark-theme', 'light-theme', 'bee-theme');
  if (theme === 'dark') {
    document.body.classList.add('dark-theme');
  } else if (theme === 'light') {
    document.body.classList.add('light-theme');
  } else if (theme === 'bee') {
    document.body.classList.add('bee-theme');
  }

  // Wait for header to be loaded, then update login/settings links
  const headerCheck = setInterval(function() {
    const hamburger = document.getElementById('hamburgerMenu');
    if (hamburger && typeof setupHamburgerMenu === 'function') {
      setupHamburgerMenu();
    }
    if (typeof window.updateLoginSettingsLinks === 'function') {
      window.updateLoginSettingsLinks();
      clearInterval(headerCheck);
    }
  }, 100);
});
