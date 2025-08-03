// teacher-status.js
// Only allow access if logged in as teacher
window.addEventListener('DOMContentLoaded', function() {
  var users = JSON.parse(localStorage.getItem('users') || '{}');
  var currentId = localStorage.getItem('currentUserId');
  var user = users[currentId];
  if (!user) {
    window.location.href = '../../functions/Login/login.html';
    return;
  }
  var infoDiv = document.getElementById('teacherStatusInfo');
  if (user.role === 'teacher') {
    infoDiv.innerHTML = `<strong>Name:</strong> ${user.name}<br><strong>ID:</strong> ${currentId}<br><strong>Status:</strong> ${user.status || 'Active'}`;
  } else {
    infoDiv.innerHTML = '<span style="color:#d32f2f;font-weight:600;">Not authorized.</span>';
  }

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
});

// Teacher status dropdown (same as settings)
function renderTeacherStatusDropdown(current) {
  const statusMap = {
    available: { color: '#22c55e', label: 'Available', emoji: '✅' },
    notavailable: { color: '#ef4444', label: 'Not Available', emoji: '❌' },
    onbreak: { color: '#f59e42', label: 'On Break', emoji: '☕' }
  };
  let options = Object.entries(statusMap).map(([key, s]) =>
    `<option value="${key}" ${key === current ? 'selected' : ''} style='color:${s.color};'>${s.emoji} ${s.label}</option>`
  ).join('');
  return `<label for='teacherStatusDropdown' style='font-weight:600;margin-right:0.5em;'>Status:</label>
    <select id='teacherStatusDropdown' style='padding:0.3em 1em;border-radius:1em;font-weight:600;border:1.5px solid #ccc;background:#fff;'>${options}</select>`;
}

const teacherStatusDropdownContainer = document.getElementById('teacherStatusDropdownContainer');
if (teacherStatusDropdownContainer) {
  // Default status, can be made dynamic/user-specific
  let currentStatus = localStorage.getItem('teacherProfileStatus') || 'available';
  teacherStatusDropdownContainer.innerHTML = renderTeacherStatusDropdown(currentStatus);
  const dropdown = document.getElementById('teacherStatusDropdown');
  dropdown.addEventListener('change', function() {
    localStorage.setItem('teacherProfileStatus', this.value);
    teacherStatusDropdownContainer.innerHTML = renderTeacherStatusDropdown(this.value);
    document.getElementById('teacherStatusDropdown').addEventListener('change', arguments.callee);
  });
}
