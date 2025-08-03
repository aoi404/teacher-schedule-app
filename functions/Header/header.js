// Header functionality placeholder
// Add any header-specific JS here

// Hamburger and mobile nav logic for dynamic header loading
let hamburgerMenuInitialized = false;
function setupHamburgerMenu() {
  if (hamburgerMenuInitialized) return;
  hamburgerMenuInitialized = true;
  setTimeout(function() {
    const hamburger = document.getElementById('hamburgerMenu');
    const mobileNav = document.getElementById('mobileNav');
    // Only run hamburger logic if both elements exist
    if (!hamburger || !mobileNav) {
      console.warn('setupHamburgerMenu: hamburger or mobileNav not found');
      return;
    }
    // Remove any previous event listeners by cloning
    const newHamburger = hamburger.cloneNode(true);
    hamburger.parentNode.replaceChild(newHamburger, hamburger);
    // Click event
    newHamburger.addEventListener('click', (e) => {
      e.stopPropagation();
      if (mobileNav.classList.contains('open')) {
        mobileNav.classList.remove('open');
        mobileNav.style.removeProperty('display');
      } else {
        mobileNav.classList.add('open');
        mobileNav.style.removeProperty('display');
      }
    });
    // Keyboard accessibility
    newHamburger.addEventListener('keydown', (e) => {
      if (e.key === 'k' || e.key === 'K' || e.key === ' ' || e.code === 'Space') {
        if (mobileNav.classList.contains('open')) {
          mobileNav.classList.remove('open');
          mobileNav.style.removeProperty('display');
        } else {
          mobileNav.classList.add('open');
          mobileNav.style.removeProperty('display');
        }
      }
    });
    // Always ensure mobile nav is hidden initially
    mobileNav.classList.remove('open');
    mobileNav.style.removeProperty('display');
    // Prevent auto-opening on mobile view or after theme change
    window.addEventListener('resize', () => {
      mobileNav.classList.remove('open');
      mobileNav.style.removeProperty('display');
    });
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!mobileNav.contains(e.target) && !newHamburger.contains(e.target)) {
        mobileNav.classList.remove('open');
        mobileNav.style.removeProperty('display');
      }
    });
    // Close menu when a link is clicked
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        mobileNav.style.removeProperty('display');
      });
    });
  }, 100);
}
// Run setupHamburgerMenu after header is loaded dynamically
if (document.getElementById('hamburgerMenu')) {
  setupHamburgerMenu();
} else {
  document.addEventListener('DOMContentLoaded', setupHamburgerMenu);
}

window.addEventListener('DOMContentLoaded', function() {
  // Show/hide Login or Settings link based on login status
  function updateLoginSettingsLinks() {
    const nav = document.querySelector('nav');
    const mobileNav = document.querySelector('.mobile-nav');
    if (!nav && !mobileNav) return;
    // Only remove duplicate Settings links, not all
    let foundSettings = false;
    document.querySelectorAll('nav a, .mobile-nav a').forEach(link => {
      if (link.textContent.trim() === 'Settings') {
        if (foundSettings) link.remove();
        foundSettings = true;
      }
    });
    // Show/hide Login links
    const loginLinks = document.querySelectorAll('nav a, .mobile-nav a');
    const isLoggedIn = !!localStorage.getItem('currentUserId');
    loginLinks.forEach(link => {
      if (link.textContent.trim() === 'Login') {
        if (isLoggedIn) {
          const settingsHref = '/functions/Settings/settings.html';
          link.textContent = 'Settings';
          link.href = settingsHref;
          link.style.fontWeight = '600';
          link.style.display = '';
        } else {
          link.textContent = 'Login';
          link.href = '/functions/Login/choose-role.html';
          link.style.fontWeight = '';
          link.style.display = '';
        }
      }
    });
    // If logged in and no Settings link exists, add it
    if (isLoggedIn && !document.querySelector('nav a[href="/functions/Settings/settings.html"]')) {
      const settingsLink = document.createElement('a');
      settingsLink.textContent = 'Settings';
      settingsLink.href = '/functions/Settings/settings.html';
      settingsLink.style.fontWeight = '600';
      nav && nav.appendChild(settingsLink);
      if (mobileNav) {
        // Remove any existing Settings link in mobileNav to avoid duplicates
        mobileNav.querySelectorAll('a').forEach(link => {
          if (link.textContent.trim() === 'Settings' || link.href.endsWith('/functions/Settings/settings.html')) link.remove();
        });
        const mobileSettingsLink = settingsLink.cloneNode(true);
        mobileNav.appendChild(mobileSettingsLink);
      }
    }
  }
  // Run on load and after header loads
  setTimeout(updateLoginSettingsLinks, 100);
  setTimeout(updateLoginSettingsLinks, 300);
  setTimeout(updateLoginSettingsLinks, 600);
  window.addEventListener('storage', updateLoginSettingsLinks);
  window.addEventListener('DOMContentLoaded', updateLoginSettingsLinks);
  updateLoginSettingsLinks();
});

window.updateLoginSettingsLinks = function updateLoginSettingsLinks() {
  const nav = document.querySelector('nav');
  const mobileNav = document.querySelector('.mobile-nav');
  if (!nav && !mobileNav) return;
  // Only remove duplicate Settings links, not all
  let foundSettings = false;
  document.querySelectorAll('nav a, .mobile-nav a').forEach(link => {
    if (link.textContent.trim() === 'Settings') {
      if (foundSettings) link.remove();
      foundSettings = true;
    }
  });
  // Show/hide Login links
  const loginLinks = document.querySelectorAll('nav a, .mobile-nav a');
  const isLoggedIn = !!localStorage.getItem('currentUserId');
  loginLinks.forEach(link => {
    if (link.textContent.trim() === 'Login') {
      if (isLoggedIn) {
        const settingsHref = '/functions/Settings/settings.html';
        link.textContent = 'Settings';
        link.href = settingsHref;
        link.style.fontWeight = '600';
        link.style.display = '';
      } else {
        link.textContent = 'Login';
        link.href = '/functions/Login/choose-role.html';
        link.style.fontWeight = '';
        link.style.display = '';
      }
    }
  });
  // If logged in and no Settings link exists in mobile nav, add it
  if (isLoggedIn && mobileNav && !Array.from(mobileNav.querySelectorAll('a')).some(link => link.href && link.href.endsWith('/functions/Settings/settings.html'))) {
    // Remove any existing Settings link in mobileNav to avoid duplicates
    mobileNav.querySelectorAll('a').forEach(link => {
      if (link.textContent.trim() === 'Settings' || (link.href && link.href.endsWith('/functions/Settings/settings.html'))) link.remove();
    });
    const mobileSettingsLink = document.createElement('a');
    mobileSettingsLink.textContent = 'Settings';
    mobileSettingsLink.href = '/functions/Settings/settings.html';
    mobileSettingsLink.style.fontWeight = '600';
    mobileNav.appendChild(mobileSettingsLink);
  }
}

// Apply theme globally on every page load
function applyGlobalTheme() {
  const theme = localStorage.getItem('siteTheme') || 'system';
  document.body.classList.remove('dark-theme', 'light-theme', 'bee-theme');
  if (theme === 'dark') {
    document.body.classList.add('dark-theme');
  } else if (theme === 'light') {
    document.body.classList.add('light-theme');
  } else if (theme === 'bee') {
    document.body.classList.add('bee-theme');
  }
}

// Apply theme immediately on script load
applyGlobalTheme();

// Also apply theme after DOMContentLoaded (for static loads)
window.addEventListener('DOMContentLoaded', applyGlobalTheme);

// Also observe for header insertion (for dynamic loads)
const headerObserver = new MutationObserver(applyGlobalTheme);
headerObserver.observe(document.body, { childList: true, subtree: true });
