// Standalone schedule logic for schedule.html
const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:3001'
  : `http://${window.location.hostname}:3001`;

window.addEventListener('DOMContentLoaded', function() {
  const scheduleForm = document.getElementById('scheduleChangerForm');
  const scheduleList = document.getElementById('scheduledStatusList');
  let editingIndex = null;

  async function loadScheduledChanges() {
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    const currentId = localStorage.getItem('currentUserId');
    if (!currentId) return;
    let scheduleData = {};
    try {
      const resp = await fetch(`${API_BASE}/schedule?userId=${currentId}`);
      scheduleData = await resp.json();
    } catch (e) { scheduleData = {}; }
    const list = (scheduleData && Array.isArray(scheduleData.schedules)) ? scheduleData.schedules : [];
    renderScheduleList(list);
  }

  function getTypeColor(type) {
    if (type === 'class') return '#2563eb';
    if (type === 'break') return '#f59e42';
    if (type === 'meeting') return '#22c55e';
    if (type === 'custom') return '#a855f7';
    return '#64748b';
  }

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

  async function saveScheduleList(list) {
    const currentId = localStorage.getItem('currentUserId');
    await fetch(`${API_BASE}/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentId, schedules: list })
    });
  }

  if (scheduleForm) {
    scheduleForm.onsubmit = null;
    scheduleForm.addEventListener('submit', async function(e) {
      e.preventDefault();
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
        scheduleForm.querySelector('button[type="submit"]').textContent = 'Add Schedule';
      } else {
        list.push({ type, start, end, label });
      }
      await saveScheduleList(list);
      renderScheduleList(list);
      scheduleForm.reset();
      if (scheduleList) {
        scheduleList.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }

  if (scheduleList) {
    scheduleList.addEventListener('click', async function(e) {
      const target = e.target;
      if (target.classList.contains('editScheduleBtn')) {
        const idx = parseInt(target.dataset.idx);
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

  loadScheduledChanges();
});
