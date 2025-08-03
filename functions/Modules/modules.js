// modules.js - Handles card click for module viewing only

document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.module-card').forEach(card => {
    card.addEventListener('click', function() {
      const module = card.getAttribute('data-module');
      // Redirect to the module view page
      window.location.href = `module-view-${module}.html`;
    });
  });
});
