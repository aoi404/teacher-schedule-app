// Courses functionality
window.onload = function() {
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

  // Example courses
  const courses = [
    { code: 'ABM', name: 'Academic Track - Accountancy, Business and Management (ABM)' },
    { code: 'HUMSS', name: 'Academic Track - Humanities and Social Sciences (HUMSS)' },
    { code: 'STEM', name: 'Academic Track - Science, Technology, Engineering and Mathematics (STEM)' },
    { code: 'CSS', name: 'TVL Track - Computer Systems Servicing (CSS)' },
    { code: 'HE', name: 'TVL Track - Home Economics (HE)' },
    { code: 'SPORTS', name: 'Sports Track' }
  ];
  const list = document.getElementById('courseList');
  courses.forEach(c => {
    const li = document.createElement('li');
    li.textContent = `${c.code}: ${c.name}`;
    list.appendChild(li);
  });
};
