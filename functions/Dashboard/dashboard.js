// Dashboard functionality
window.onload = function() {
  // Load header and footer
  fetch('../Header/header.html').then(res => res.text()).then(data => {
    document.getElementById('header').innerHTML = data;
    // Dynamically load header.js after header is in DOM
    const script = document.createElement('script');
    script.src = '../Header/header.js';
    script.onload = function() {
      // Force update nav links after header.js loads
      if (typeof window.updateLoginSettingsLinks === 'function') {
        window.updateLoginSettingsLinks();
      }
    };
    document.body.appendChild(script);
  });
  fetch('../Footer/footer.html').then(res => res.text()).then(data => {
    document.getElementById('footer').innerHTML = data;
  });

  // Example announcements
  const announcements = [
    'Welcome to the School Portal!',
    'Midterm exams start next week.',
    'Check your course schedules.'
  ];
  const list = document.getElementById('announcements');
  announcements.forEach(a => {
    const li = document.createElement('li');
    li.textContent = a;
    list.appendChild(li);
  });
};
