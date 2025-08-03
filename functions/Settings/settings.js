// Determine API base URL for backend (works for localhost and LAN)
const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:3001'
  : `http://${window.location.hostname}:3001`;

window.addEventListener('DOMContentLoaded', function() {
  // Apply theme globally on every page load
  const savedTheme = localStorage.getItem('siteTheme') || 'system';
  applyTheme(savedTheme);

  // Sidebar tab switching and iframe reload
  document.querySelectorAll('.settings-sidebar li').forEach(tab => {
    tab.addEventListener('click', function() {
      document.querySelectorAll('.settings-sidebar li').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.settings-section').forEach(s => s.classList.remove('active'));
      tab.classList.add('active');
      const section = document.getElementById(tab.dataset.section + '-section');
      if (section) section.classList.add('active');
      // Show/hide iframe for profile
      if (tab.dataset.section === 'profile') {
        const pf = document.getElementById('profileFrame');
        if (pf) pf.style.display = '';
      } else {
        const pf = document.getElementById('profileFrame');
        if (pf) pf.style.display = 'none';
      }
    });
  });

  // Load correct profile form (teacher or student)
  function loadProfileForm() {
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    const currentId = localStorage.getItem('currentUserId');
    const user = users[currentId];
    const container = document.getElementById('profileFormContainer');
    // Debug logging
    console.log('[DEBUG] loadProfileForm:', { currentId, user, container });
    if (!container) return;
    if (!user) {
      container.innerHTML = `<div style="color:#d32f2f;font-weight:600;font-size:1.1em;margin:2em 0;">User not found. Please log in again or register an account.</div>`;
      return;
    }
    // --- AUTO-SYNC AVATAR TO BACKEND IF NEEDED ---
    if (user.role === 'teacher' && user.avatar) {
      // Fetch backend profile
      fetch(`${API_BASE}/teacher-profile/${currentId}`)
        .then(res => res.json())
        .then(profile => {
          if (!profile.avatar || profile.avatar !== user.avatar) {
            // Sync avatar to backend
            fetch(`${API_BASE}/teacher-profile`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: currentId,
                fullName: user.name,
                status: profile.status || user.status || 'available',
                note: user.note || profile.note || '',
                gradeLevel: user.gradeLevel || profile.gradeLevel || '',
                avatar: user.avatar
              })
            });
          }
        })
        .catch(() => {/* ignore errors, just fallback to normal */});
    }
    let avatarImg = '';
    let namePreview = '';
    // Avatar with hover edit overlay
    if (user.avatar) {
      avatarImg = `
        <div class="avatar-edit-wrapper">
          <img id="profileAvatarPreview" src="${user.avatar}" alt="Avatar">
          <div class="avatar-edit-overlay" tabindex="0" title="Change avatar">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="11" fill="rgba(0,0,0,0.08)"/><path d="M12.5 7.5l4 4-7 7H5.5v-3.5l7-7z"/><path d="M15.5 10.5l-2-2"/></svg>
          </div>
        </div>
      `;
    } else {
      avatarImg = `<div class="avatar-edit-wrapper"><img id="profileAvatarPreview" src="/assets/images/noprofile.png" alt="No Avatar"><div class="avatar-edit-overlay" tabindex="0" title="Change avatar"><svg width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='#fff' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='11' fill='rgba(0,0,0,0.08)'/><path d='M12.5 7.5l4 4-7 7H5.5v-3.5l7-7z'/><path d='M15.5 10.5l-2-2'/></svg></div></div>`;
    }
    namePreview = `<span id="profileNamePreview" style="font-size:1.25rem;font-weight:600;margin-left:1.2rem;vertical-align:middle;">${user.name || ''}</span>`;
    if (user.role === 'teacher') {
      container.innerHTML = `
        <div style="display:flex;align-items:center;margin-bottom:1.5rem;gap:1.2rem;">${avatarImg}${namePreview}</div>
        <form id="teacherProfileForm">
          <label for="teacherAvatar">Avatar</label>
          <input type="file" id="teacherAvatar" accept="image/*" style="display:none;">
          <label for="teacherName">Full Name</label>
          <input type="text" id="teacherName" value="${user.name || ''}" placeholder="Enter your name">
          <div id="inlineProfileStatusDropdownContainer"></div>
          <label for="teacherGradeLevel">Grade Level</label>
          <input type="text" id="teacherGradeLevel" value="${user.gradeLevel || ''}" placeholder="Enter your grade level">
          <label for="teacherNote">Note</label>
          <textarea id="teacherNote" placeholder="Add a note (optional)">${user.note || ''}</textarea>
          <button type="submit">Save</button>
        </form>
      `;
      // Overlay click/focus triggers file input
      const overlay = container.querySelector('.avatar-edit-overlay');
      const fileInput = container.querySelector('#teacherAvatar');
      if (overlay && fileInput) {
        overlay.addEventListener('click', () => fileInput.click());
        overlay.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInput.click();
          }
        });
        // Update avatar preview immediately after file selection
        fileInput.addEventListener('change', function() {
          if (fileInput.files && fileInput.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
              const img = container.querySelector('#profileAvatarPreview');
              if (img) img.src = e.target.result;
            };
            reader.readAsDataURL(fileInput.files[0]);
          }
        });
      }
      // Render status dropdown inline (between avatar and note)
      if (user.role === 'teacher') {
        let currentStatus = localStorage.getItem('teacherProfileStatus') || 'available';
        document.getElementById('inlineProfileStatusDropdownContainer').innerHTML = renderProfileStatusDropdown(currentStatus);
        const dropdown = document.getElementById('profileStatusDropdown');
        dropdown.addEventListener('change', function() {
          localStorage.setItem('teacherProfileStatus', this.value);
          document.getElementById('inlineProfileStatusDropdownContainer').innerHTML = renderProfileStatusDropdown(this.value);
          document.getElementById('profileStatusDropdown').addEventListener('change', arguments.callee);
        });
      }
      document.getElementById('teacherProfileForm').onsubmit = async function(e) {
        e.preventDefault();
        user.name = document.getElementById('teacherName').value.trim();
        user.note = document.getElementById('teacherNote').value.trim();
        user.gradeLevel = document.getElementById('teacherGradeLevel').value.trim();
        const fileInput = document.getElementById('teacherAvatar');
        let avatarChanged = false;
        if (fileInput.files && fileInput.files[0]) {
          const ext = fileInput.files[0].name.split('.').pop();
          const formData = new FormData();
          formData.append('avatar', fileInput.files[0]);
          formData.append('userId', currentId);
          const resp = await fetch(`${API_BASE}/upload/avatar`, {
            method: 'POST',
            body: formData
          });
          const data = await resp.json();
          if (data.filename) {
            // Always use absolute path for avatar
            user.avatar = data.filename.startsWith('http') || data.filename.startsWith('/') ? data.filename : '/ProfileImages/' + data.filename;
            avatarChanged = true;
          }
        }
        // Get teacher status from dropdown
        const statusDropdown = document.getElementById('profileStatusDropdown');
        const teacherStatus = statusDropdown ? statusDropdown.value : '';
        // Log teacher profile to backend
        const teacherProfile = {
          id: currentId,
          fullName: user.name,
          status: teacherStatus,
          note: user.note || '',
          gradeLevel: user.gradeLevel || '',
          avatar: user.avatar || '' // <-- include avatar
        };
        await fetch(`${API_BASE}/log/teacher-profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(teacherProfile)
        });
        // Also save teacher profile as JSON for backend
        await fetch(`${API_BASE}/teacher-profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentId,
            fullName: user.name,
            status: teacherStatus,
            note: user.note || '',
            gradeLevel: user.gradeLevel || '',
            avatar: user.avatar || '' // <-- include avatar
          })
        });
        users[currentId] = user;
        localStorage.setItem('users', JSON.stringify(users));
        // No need to update preview here, just reload form
        loadProfileForm();
        alert('Profile updated!');
      };
      // Live update name preview
      document.getElementById('teacherName').addEventListener('input', function(e) {
        document.getElementById('profileNamePreview').textContent = e.target.value;
      });
    } else {
      container.innerHTML = `
        <h2>Student Profile</h2>
        <div style="display:flex;align-items:center;margin-bottom:1.5rem;">${avatarImg}${namePreview}</div>
        <form id="studentProfileForm">
          <label for="studentName">Full Name</label>
          <input type="text" id="studentName" value="${user.name || ''}" placeholder="Enter your name">
          <label for="studentAvatar">Avatar</label>
          <input type="file" id="studentAvatar" accept="image/*">
          <button type="submit">Save</button>
        </form>
      `;
      document.getElementById('studentProfileForm').onsubmit = async function(e) {
        e.preventDefault();
        user.name = document.getElementById('studentName').value.trim();
        const fileInput = document.getElementById('studentAvatar');
        if (fileInput.files && fileInput.files[0]) {
          const formData = new FormData();
          formData.append('avatar', fileInput.files[0]);
          formData.append('userId', currentId);
          const resp = await fetch(`${API_BASE}/upload/avatar`, {
            method: 'POST',
            body: formData
          });
          const data = await resp.json();
          if (data.filename) {
            user.avatar = data.filename.startsWith('http') || data.filename.startsWith('/') ? data.filename : '/ProfileImages/' + data.filename;
          }
        }
        users[currentId] = user;
        localStorage.setItem('users', JSON.stringify(users));
        loadProfileForm();
        alert('Profile updated!');
      };
      // Live update name preview
      document.getElementById('studentName').addEventListener('input', function(e) {
        document.getElementById('profileNamePreview').textContent = e.target.value;
      });
    }
    // Set profile heading dynamically
    const heading = document.getElementById('profileHeading');
    if (heading) heading.textContent = user.role === 'teacher' ? 'Teacher Profile' : 'Student Profile';
  }
  loadProfileForm();

  // Profile status indicator
  function renderProfileStatus(status) {
    const statusMap = {
      available: { color: '#22c55e', label: 'Available' },
      notavailable: { color: '#ef4444', label: 'Not Available' },
      onbreak: { color: '#f59e42', label: 'On Break' }
    };
    const s = statusMap[status] || statusMap['notavailable'];
    return `<span style="display:inline-block;padding:0.35em 1.1em;border-radius:1em;font-weight:600;background:${s.color}22;color:${s.color};border:1.5px solid ${s.color};margin-right:0.5em;">● ${s.label}</span>`;
  }

  // Profile status dropdown
  function renderProfileStatusDropdown(current) {
    const statusMap = {
      available: { color: '#22c55e', label: 'Available', emoji: '✅' },
      notavailable: { color: '#ef4444', label: 'Not Available', emoji: '❌' },
      onbreak: { color: '#f59e42', label: 'On Break', emoji: '☕' }
    };
    let options = Object.entries(statusMap).map(([key, s]) =>
      `<option value="${key}" ${key === current ? 'selected' : ''} style='color:${s.color};'>${s.emoji} ${s.label}</option>`
    ).join('');
    return `<label for='profileStatusDropdown' style='font-weight:600;margin-right:0.5em;'>Status:</label>
      <select id='profileStatusDropdown' style='padding:0.3em 1em;border-radius:1em;font-weight:600;border:1.5px solid #ccc;background:#fff;'>${options}</select>`;
  }

  const profileStatusContainer = document.getElementById('profileStatusContainer');
  const profileStatusDropdownContainer = document.getElementById('profileStatusDropdownContainer');
  if (profileStatusContainer) {
    // Example: you can replace 'available' with dynamic status if needed
    profileStatusContainer.innerHTML =
      renderProfileStatus('available') +
      renderProfileStatus('notavailable') +
      renderProfileStatus('onbreak');
  }
  // Only show status dropdown for teachers
  const users = JSON.parse(localStorage.getItem('users') || '{}');
  const currentId = localStorage.getItem('currentUserId');
  const user = users[currentId];
  if (profileStatusDropdownContainer) {
    // Hide the old status dropdown if the inline one is present
    profileStatusDropdownContainer.style.display = 'none';
  }

  // Theme switching
  const themeForm = document.getElementById('themeForm');
  const themeSelect = document.getElementById('themeSelect');
  if (themeForm && themeSelect) {
    // Add bee theme option if not present
    if (!themeSelect.querySelector('option[value="bee"]')) {
      const beeOption = document.createElement('option');
      beeOption.value = 'bee';
      beeOption.textContent = 'Bee';
      themeSelect.appendChild(beeOption);
    }
    // Load saved theme
    const savedTheme = localStorage.getItem('siteTheme') || 'system';
    themeSelect.value = savedTheme;
    applyTheme(savedTheme);
    themeForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const theme = themeSelect.value;
      localStorage.setItem('siteTheme', theme);
      applyTheme(theme);
    });
    themeSelect.addEventListener('change', function() {
      applyTheme(themeSelect.value);
    });
  }

  function applyTheme(theme) {
    document.body.classList.remove('dark-theme', 'light-theme', 'bee-theme');
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else if (theme === 'bee') {
      document.body.classList.add('bee-theme');
    } // else system: no class
    // Save to localStorage for all pages
    localStorage.setItem('siteTheme', theme);
    // --- Fix: Always hide mobile nav if not mobile view ---
    var mobileNav = document.getElementById('mobileNav');
    if (mobileNav && window.innerWidth > 1024) {
      mobileNav.classList.remove('open');
      mobileNav.style.removeProperty('display');
    }
  }

  // Logout functionality
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      // Remove user session
      localStorage.removeItem('currentUserId');
      // Optionally clear other session data
      // Redirect to index page
      window.location.href = '/index/index.html';
    });
  }

  // Account form logic
  const accountForm = document.getElementById('accountForm');
  if (accountForm) {
    accountForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const users = JSON.parse(localStorage.getItem('users') || '{}');
      const currentId = localStorage.getItem('currentUserId');
      const user = users[currentId];
      if (!user) {
        alert('User not found.');
        return;
      }
      const email = document.getElementById('accountEmail').value.trim();
      const oldPassword = document.getElementById('accountOldPassword').value;
      const newPassword = document.getElementById('accountNewPassword').value;
      let emailUpdated = false;
      // Email registration for recovery
      if (email) {
        user.email = email;
        emailUpdated = true;
      }
      // Password change logic
      if (oldPassword && newPassword) {
        if (user.password !== oldPassword) {
          alert('Old password is incorrect.');
          return;
        }
        if (oldPassword === newPassword) {
          alert('New password must be different from old password.');
          return;
        }
        // Log password change to backend
        fetch('http://localhost:3001/log/password-change', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentId, oldPassword, newPassword })
        });
        // Update password in backend accounts.json
        fetch('http://localhost:3001/update-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentId, newPassword })
        });
        user.password = newPassword;
      }
      users[currentId] = user;
      localStorage.setItem('users', JSON.stringify(users));
      // Log for support (unique id and password always, email only if updated)
      const logData = { userId: currentId, password: user.password };
      if (emailUpdated) logData.email = user.email;
      fetch('http://localhost:3001/log/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData)
      });
      alert('Account updated!');
      accountForm.reset();
    });
  }

  // --- Class & Activity Schedule logic ---
  const scheduleForm = document.getElementById('scheduleChangerForm');
  const scheduleList = document.getElementById('scheduledStatusList');
  let editingIndex = null;

  // Helper: Fetch and render scheduled changes
  async function loadScheduledChanges() {
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    const currentId = localStorage.getItem('currentUserId');
    if (!currentId) return;
    // Fetch from backend
    let scheduleData = {};
    try {
      const resp = await fetch(`${API_BASE}/schedule?userId=${currentId}`);
      scheduleData = await resp.json();
    } catch (e) { scheduleData = {}; }
    const list = (scheduleData && Array.isArray(scheduleData.schedules)) ? scheduleData.schedules : [];
    renderScheduleList(list);
  }

  // Helper: Color for type
  function getTypeColor(type) {
    if (type === 'class') return '#2563eb';
    if (type === 'break') return '#f59e42';
    if (type === 'meeting') return '#22c55e';
    if (type === 'custom') return '#a855f7';
    return '#64748b';
  }

  // Helper: Render schedule list
  function renderScheduleList(list) {
    if (!scheduleList) return;
    if (!list.length) {
      scheduleList.innerHTML = '<li style="color:#888;">No schedules set.</li>';
      return;
    }
    scheduleList.innerHTML = '<ul style="list-style:none;padding:0;margin:0;">' +
      list.map((item, idx) => {
        const color = getTypeColor(item.type);
        return `<li data-idx="${idx}" style="margin-bottom:0.7em;padding:0.7em 1em;border-radius:8px;background:${color}22;display:flex;align-items:center;justify-content:space-between;">
          <div>
            <span style="font-weight:700;color:${color};">${item.label}</span>
            <span style="margin-left:1em;font-size:1.05em;color:#fff;background:${color};padding:0.2em 0.7em;border-radius:1em;">${item.type.charAt(0).toUpperCase() + item.type.slice(1)}</span>
            <span style="margin-left:1.2em;color:#2563eb;font-weight:600;">${item.start} - ${item.end}</span>
          </div>
          <div>
            <button class="editScheduleBtn" data-idx="${idx}" style="margin-right:0.7em;background:#fff;color:${color};border:none;padding:0.3em 1em;border-radius:6px;cursor:pointer;font-weight:600;">Edit</button>
            <button class="deleteScheduleBtn" data-idx="${idx}" style="background:#d32f2f;color:#fff;border:none;padding:0.3em 1em;border-radius:6px;cursor:pointer;font-weight:600;">Delete</button>
          </div>
        </li>`;
      }).join('') + '</ul>';
  }

  // Helper: Save schedule list to backend
  async function saveScheduleList(list) {
    const currentId = localStorage.getItem('currentUserId');
    await fetch(`${API_BASE}/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentId, schedules: list })
    });
  }

  // Add or update schedule
  if (scheduleForm) {
    const addBtn = document.getElementById('addScheduleBtn');
    if (addBtn) {
      addBtn.onclick = async function() {
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        const currentId = localStorage.getItem('currentUserId');
        const user = users[currentId];
        if (!user) {
          alert('User not found.');
          return;
        }
        const type = document.getElementById('scheduleType').value;
        const start = document.getElementById('scheduleStart').value;
        const end = document.getElementById('scheduleEnd').value;
        const label = document.getElementById('scheduleLabel').value.trim();
        if (!type || !start || !end || !label) {
          alert('Please fill in all fields.');
          return;
        }
        let scheduleData = {};
        try {
          const resp = await fetch(`${API_BASE}/schedule?userId=${currentId}`);
          scheduleData = await resp.json();
        } catch (e) { scheduleData = {}; }
        let list = (scheduleData && Array.isArray(scheduleData.schedules)) ? scheduleData.schedules : [];

        if (editingIndex !== null) {
          list[editingIndex] = { type, start, end, label };
          editingIndex = null;
          addBtn.textContent = 'Add Schedule';
        } else {
          list.push({ type, start, end, label });
        }
        await saveScheduleList(list);
        renderScheduleList(list);
        // Reset fields
        document.getElementById('scheduleType').value = 'class';
        document.getElementById('scheduleStart').value = '';
        document.getElementById('scheduleEnd').value = '';
        document.getElementById('scheduleLabel').value = '';
        if (scheduleList) {
          scheduleList.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      };
    }
  }

  // Edit/delete handlers
  if (scheduleList) {
    scheduleList.addEventListener('click', async function(e) {
      const target = e.target;
      if (target.classList.contains('editScheduleBtn')) {
        const idx = parseInt(target.dataset.idx);
        // Fetch current list
        const currentId = localStorage.getItem('currentUserId');
        let scheduleData = {};
        try {
          const resp = await fetch(`${API_BASE}/schedule?userId=${currentId}`);
          scheduleData = await resp.json();
        } catch (e) { scheduleData = {}; }
        let list = (scheduleData && Array.isArray(scheduleData.schedules)) ? scheduleData.schedules : [];
        const item = list[idx];
        if (!item) return;
        document.getElementById('scheduleType').value = item.type;
        document.getElementById('scheduleStart').value = item.start;
        document.getElementById('scheduleEnd').value = item.end;
        document.getElementById('scheduleLabel').value = item.label;
        editingIndex = idx;
        scheduleForm.querySelector('button[type="submit"]').textContent = 'Update Schedule';
      } else if (target.classList.contains('deleteScheduleBtn')) {
        const idx = parseInt(target.dataset.idx);
        // Fetch current list
        const currentId = localStorage.getItem('currentUserId');
        let scheduleData = {};
        try {
          const resp = await fetch(`${API_BASE}/schedule?userId=${currentId}`);
          scheduleData = await resp.json();
        } catch (e) { scheduleData = {}; }
        let list = (scheduleData && Array.isArray(scheduleData.schedules)) ? scheduleData.schedules : [];
        list.splice(idx, 1);
        await saveScheduleList(list);
        renderScheduleList(list);
        scheduleForm.reset();
        editingIndex = null;
        scheduleForm.querySelector('button[type="submit"]').textContent = 'Add Schedule';
      }
    });
  }

  // Initial load
  loadScheduledChanges();
});