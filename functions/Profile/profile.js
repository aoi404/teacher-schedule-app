// Determine API base URL for backend (works for localhost and LAN)
const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:3001'
  : window.location.origin;

// Profile functionality
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

  let allProfiles = [];
  let filteredProfiles = [];

  // Helper to render profiles
  function renderProfiles(profiles) {
    const info = document.getElementById('profileInfo');
    if (!profiles || profiles.length === 0) {
      info.innerHTML = '<p>No teacher profiles found.</p>';
      return;
    }
    profiles.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
    console.log('[DEBUG] Loaded profiles:', profiles.length, profiles);
    info.innerHTML = `<div class="profile-card-list" style="
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      max-width: 1600px;
      margin: 0 auto;
      gap: 2.5em 2em;
      padding: 2em 0 2em 0;
      place-items: start center;
    ">` +
      profiles.map(profile => {
        console.log('[DEBUG] Creating card for profile:', profile);
        // Use the correct property for the unique ID
        const cardId = profile.userId || profile.ID || profile.id || '';
        let statusEmoji = '';
        let statusText = '';
        switch ((profile.status || '').toLowerCase()) {
          case 'available':
            statusEmoji = '✅';
            statusText = 'Available';
            break;
          case 'onbreak':
          case 'on break':
            statusEmoji = '☕';
            statusText = 'On Break';
            break;
          case 'notavailable':
          case 'not available':
            statusEmoji = '❌';
            statusText = 'Not Available';
            break;
          default:
            statusEmoji = '❔';
            statusText = profile.status || 'Unknown';
        }
        let avatarSrc = '';
        if (!profile.avatar || /noprofile\.png$/i.test(profile.avatar) || profile.avatar === '/assets/images/noprofile.png' || profile.avatar === '../assets/images/noprofile.png') {
          avatarSrc = '/assets/images/noprofile.png';
        } else if (profile.avatar.startsWith('/ProfileImages/')) {
          avatarSrc = profile.avatar;
        } else if (profile.avatar.startsWith('http')) {
          avatarSrc = profile.avatar;
        } else if (profile.avatar.match(/\.(png|jpg|jpeg|gif)$/i)) {
          avatarSrc = '/ProfileImages/' + profile.avatar.split('/').pop();
        } else {
          avatarSrc = '/assets/images/noprofile.png';
        }
        // Flip card structure
        return `
        <div class="profile-flip-card" data-id="${cardId}" style="margin: 1.5em 0; width: 95%; max-width: 480px; min-width: 320px; position:relative;perspective:1000px;cursor:pointer;">
          <div class="profile-flip-card-inner" style="transition:transform 0.6s;transform-style:preserve-3d;position:relative;width:100%;height:100%;">
            <div class="profile-flip-card-front" style="backface-visibility:hidden;position:relative;z-index:2;background:#232b3a;border-radius:16px;box-shadow:0 4px 24px rgba(37,99,235,0.10);padding:2.2em 1.5em 1.5em 1.5em;min-height:320px;">
              <div style="position:absolute;top:1.5em;right:2em;width:64px;height:64px;">
                <img src='${avatarSrc}' alt='Avatar' style='width:64px;height:64px;border-radius:50%;object-fit:cover;border:2px solid #60a5fa;background:#fff;aspect-ratio:1/1;' onerror="this.onerror=null;this.src='/assets/images/noprofile.png'">
              </div>
              <h3 style="font-size:1.35em;margin-bottom:0.7em;">${profile.fullName || 'No Name'}</h3>
              <p style="font-size:1.05em;margin-bottom:0.5em;"><span style="font-weight:600;">Grade Level:</span> <span style="color:#60a5fa;">${profile.gradeLevel || ''}</span></p>
              <p style="font-size:1.1em;margin-bottom:0.5em;"><span style="font-weight:600;">Status:</span> <span style="font-size:1.2em;">${statusEmoji}</span> <span style="font-weight:600;">${statusText}</span></p>
              <p style="font-size:1.05em;"><span style="font-weight:600;">Note:</span> <span style="color:#eab308;">${profile.note || ''}</span></p>
              <div style="position:absolute;bottom:1.2em;right:1.2em;font-size:0.98em;color:#60a5fa;opacity:0.7;">Click to view schedule</div>
            </div>
            <div class="profile-flip-card-back" style="backface-visibility:hidden;position:absolute;top:0;left:0;width:100%;height:100%;background:#181f2a;border-radius:16px;box-shadow:0 4px 24px rgba(37,99,235,0.10);padding:2.2em 1.5em 1.5em 1.5em;min-height:320px;transform:rotateY(180deg);display:flex;flex-direction:column;align-items:center;justify-content:center;">
              <h3 style="margin-top:1.5em;">Schedule</h3>
              <div class="profile-schedule-content" data-id="${cardId}" style="margin-top:1em;font-size:1.08em;text-align:left;width:100%;min-height:3em;">Loading...</div>
              <div style="margin-top:2em;font-size:0.98em;color:#60a5fa;opacity:0.7;">Click to flip back</div>
            </div>
          </div>
        </div>
        `;
      }).join('') + '</div>';
    // Add flip event to each card and load schedule from logbook (attach immediately after rendering)
    document.querySelectorAll('.profile-flip-card').forEach(card => {
      card.addEventListener('click', function(e) {
        if (e.target.closest('.profile-schedule-content')) return;
        const flipCard = e.target.closest('.profile-flip-card');
        if (!flipCard) return;
        console.log('[DEBUG] Clicked card HTML:', flipCard.outerHTML);
        flipCard.classList.toggle('flipped');
        const inner = flipCard.querySelector('.profile-flip-card-inner');
        if (flipCard.classList.contains('flipped')) {
          inner.style.transform = 'rotateY(180deg)';
          const id = flipCard.getAttribute('data-id');
          const scheduleDiv = flipCard.querySelector('.profile-schedule-content');
          console.log('[DEBUG] Flipped card, id:', id);
          fetch(`${API_BASE}/schedule`)
            .then(res => res.ok ? res.json() : {})
            .then(schedules => {
              console.log('[DEBUG] Schedules from backend:', schedules);
              const sched = schedules && schedules[id];
              console.log('[DEBUG] sched for id', id, sched);
              if (sched && (sched.content || sched.time)) {
                let html = '';
                if (sched.time) html += `<div><b>Time:</b> ${sched.time}</div>`;
                if (sched.content) html += `<div><b>Content:</b> <pre style='white-space:pre-wrap;font-size:1.08em;display:inline;'>${sched.content}</pre></div>`;
                scheduleDiv.innerHTML = html;
              } else {
                scheduleDiv.innerHTML = '<span style="color:#888;">No schedule set.</span>';
              }
            })
            .catch(() => {
              scheduleDiv.innerHTML = '<span style="color:#888;">No schedule set.</span>';
            });
        } else {
          inner.style.transform = 'rotateY(0deg)';
        }
      });
    });
  }

  // Fetch all teacher profiles from backend
  fetch(`${API_BASE}/teacher-profiles`)
    .then(res => res.json())
    .then(profiles => {
      allProfiles = profiles || [];
      filteredProfiles = allProfiles;
      renderProfiles(filteredProfiles);
    })
    .catch(() => {
      document.getElementById('profileInfo').innerHTML = '<p>Error loading teacher profiles.</p>';
    });

  // Search UI logic
  const toggleBtn = document.getElementById('toggleSearch');
  const searchForm = document.getElementById('searchForm');
  const searchName = document.getElementById('searchName');
  const searchGrade = document.getElementById('searchGrade');
  const searchStatus = document.getElementById('searchStatus');
  const searchButton = document.getElementById('searchButton');
  const resetButton = document.getElementById('resetButton');

  // Show/hide search form with animation and focus
  if (toggleBtn && searchForm) {
    toggleBtn.addEventListener('click', function() {
      if (searchForm.style.display === 'none' || !searchForm.style.display) {
        searchForm.style.display = 'flex';
        searchForm.style.animation = 'fadeInSearch 0.25s';
        searchName && searchName.focus();
      } else {
        searchForm.style.display = 'none';
      }
    });
  }

  function doSearch() {
    const nameVal = (searchName.value || '').toLowerCase().trim();
    const gradeVal = (searchGrade.value || '').toLowerCase().trim();
    const statusVal = (searchStatus.value || '').toLowerCase().trim();
    filteredProfiles = allProfiles.filter(profile => {
      const nameMatch = !nameVal || (profile.fullName || '').toLowerCase().includes(nameVal);
      const gradeMatch = !gradeVal || (profile.gradeLevel || '').toLowerCase().includes(gradeVal);
      const statusMatch = !statusVal || (profile.status || '').toLowerCase().includes(statusVal);
      return nameMatch && gradeMatch && statusMatch;
    });
    renderProfiles(filteredProfiles);
  }

  if (searchButton) searchButton.onclick = doSearch;
  if (searchForm) searchForm.onsubmit = function(e) { e.preventDefault(); doSearch(); };
  if (resetButton) resetButton.onclick = function() {
    searchName.value = '';
    searchGrade.value = '';
    searchStatus.value = '';
    filteredProfiles = allProfiles;
    renderProfiles(filteredProfiles);
  };
};
