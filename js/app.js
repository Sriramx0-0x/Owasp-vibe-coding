/* VolunteerHub — MVP Application Logic */
(function () {
  const STORAGE_KEY = 'volunteerhub_shifts_v1';
  const REMINDER_KEY = 'volunteerhub_reminders_v1';
  const COMMENT_KEY = 'volunteerhub_comments_v1';

  const SEED_SHIFTS = [
    { id: 's1', role: 'Registration Desk', date: '2026-11-15', startTime: '08:00', endTime: '12:00', location: 'Main Lobby - Hall A', required: 4, volunteers: [] },
    { id: 's2', role: 'Tech Support', date: '2026-11-15', startTime: '10:00', endTime: '14:00', location: 'Workshop Room B', required: 3, volunteers: [] },
    { id: 's3', role: 'Mentor Guide', date: '2026-11-15', startTime: '13:00', endTime: '17:00', location: 'Mentor Lounge', required: 5, volunteers: [] },
    { id: 's4', role: 'Catering Assistant', date: '2026-11-15', startTime: '11:00', endTime: '15:00', location: 'Cafeteria', required: 2, volunteers: [] },
    { id: 's5', role: 'Cleanup Crew', date: '2026-11-15', startTime: '17:00', endTime: '20:00', location: 'Entire Venue', required: 6, volunteers: [] }
  ];

  let shifts = [];
  let reminders = [];
  let comments = [];
  let currentFilter = 'all';
  let calDate = new Date();

  function load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    shifts = raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(SEED_SHIFTS));
    if (!raw) save();
  }
  function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(shifts)); }

  function loadReminders() {
    const raw = localStorage.getItem(REMINDER_KEY);
    reminders = raw ? JSON.parse(raw) : [];
  }
  function saveReminders() { localStorage.setItem(REMINDER_KEY, JSON.stringify(reminders)); }

  function loadComments() {
    const raw = localStorage.getItem(COMMENT_KEY);
    comments = raw ? JSON.parse(raw) : [];
  }
  function saveComments() { localStorage.setItem(COMMENT_KEY, JSON.stringify(comments)); }

  function addActivity(text, type = 'info') {
    activityLog.unshift({ text, type, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
    if (activityLog.length > 50) activityLog.pop();
    renderActivityList();
  }

  let activityLog = [];

  function escapeHtml(text) {
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
  }
  function fmtTime(t) { return t || '—'; }
  function fmtDate(d) {
    if (!d) return '—';
    return new Date(d + 'T00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  }
  function shiftStatus(shift) {
    const signed = shift.volunteers.length;
    if (signed >= shift.required) return 'filled';
    if (signed > 0) return 'understaffed';
    return 'vacant';
  }

  const toastContainer = (() => {
    let el = document.getElementById('toastContainer');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toastContainer';
      el.className = 'toast-container';
      document.body.appendChild(el);
    }
    return el;
  })();

  function toast({ type = 'info', title, desc, duration = 4000 }) {
    const id = 't' + Date.now() + Math.random().toString(36).slice(2, 6);
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    el.id = id;
    const icons = { ok: '✓', err: '✕', info: '!' };
    el.innerHTML = '<span class="toast-icon">' + icons[type] + '</span>' +
      '<div class="toast-body"><div class="toast-title">' + escapeHtml(title) + '</div>' +
      (desc ? '<div class="toast-desc">' + escapeHtml(desc) + '</div>' : '') + '</div>' +
      '<span class="toast close-btn" onclick="appCloseToast(\'' + id + '\')">✕</span>';
    toastContainer.appendChild(el);
    setTimeout(() => appCloseToast(id), duration);
    return id;
  }
  window.appCloseToast = function (id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('exit');
    setTimeout(() => { if (el.parentElement) el.parentElement.removeChild(el); }, 350);
  };

  function confetti() {
    const container = document.getElementById('confetti');
    const colors = ['#2563eb', '#059669', '#d97706', '#f472b6', '#34d399', '#a78bfa', '#fbbf24'];
    for (let i = 0; i < 60; i++) {
      const p = document.createElement('div');
      p.className = 'confetti-piece';
      p.style.left = Math.random() * 100 + 'vw';
      p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      p.style.animationDelay = (Math.random() * 0.6) + 's';
      p.style.animationDuration = (1.2 + Math.random() * 1.2) + 's';
      container.appendChild(p);
      setTimeout(() => p.remove(), 2000);
    }
  }

  const sidebar = document.getElementById('sidebar');
  const resizeHandle = document.getElementById('sidebarResize');
  const menuToggle = document.getElementById('menuToggle');
  let isResizing = false;

  document.querySelector('.brand').addEventListener('click', () => {
    if (window.innerWidth > 900) sidebar.classList.toggle('collapsed');
  });
  menuToggle.addEventListener('click', (e) => { e.stopPropagation(); sidebar.classList.toggle('open'); });

  resizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });
  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    const w = Math.min(Math.max(e.clientX, 76), 420);
    document.documentElement.style.setProperty('--sidebar-width', w + 'px');
  });
  document.addEventListener('mouseup', () => {
    isResizing = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  });

  function updateClock() {
    const now = new Date();
    document.getElementById('liveTime').textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  setInterval(updateClock, 1000);
  updateClock();

  const navItems = document.querySelectorAll('.nav-item');
  const views = document.querySelectorAll('.view');
  const pageTitle = document.getElementById('pageTitle');
  const pageSub = document.getElementById('pageSub');

  const titles = {
    dashboard: ['Overview', 'Staffing health across all role shifts at a glance.'],
    shifts: ['Role Shifts', 'Define roles, timings, locations, and required headcount.'],
    signup: ['Volunteer Sign Up', 'Register for an open shift with available spots.'],
    checkin: ['Check In', 'Mark signed-up volunteers as present at the event.'],
    settings: ['Data & Reset', 'Seed, export, or reset your volunteer data.'],
    calendar: ['Event Calendar', 'Manage reminders and upcoming event schedules.'],
    comments: ['Volunteer Feedback', 'Share updates and feedback with other volunteers.']
  };

  function showView(id) {
    views.forEach(v => { v.style.display = 'none'; v.classList.remove('visible'); });
    const target = document.getElementById('view-' + id);
    if (target) {
      target.style.display = 'block';
      requestAnimationFrame(() => target.classList.add('visible'));
    }
    navItems.forEach(n => n.classList.toggle('active', n.getAttribute('data-view') === id));
    const [t, s] = titles[id] || titles.dashboard;
    pageTitle.textContent = t;
    pageSub.textContent = s;
    if (window.innerWidth <= 900) sidebar.classList.remove('open');
    if (id === 'dashboard') renderDashboard();
    if (id === 'shifts') renderShifts();
    if (id === 'signup') renderSignup();
    if (id === 'checkin') renderCheckIn();
    if (id === 'calendar') renderCalendar();
    if (id === 'comments') renderComments();
  }

  navItems.forEach(n => {
    n.addEventListener('click', (e) => { e.preventDefault(); showView(n.getAttribute('data-view')); });
  });

  function observeReveals() {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
  }


  function renderDashboard() {
    const total = shifts.length;
    const signedUp = shifts.reduce((a, s) => a + s.volunteers.length, 0);
    let filled = 0, vacant = 0, understaffed = 0;
    shifts.forEach(s => { const st = shiftStatus(s); if (st === 'filled') filled++; else if (st === 'vacant') vacant++; else understaffed++; });

    document.getElementById('statTotalShifts').textContent = total;
    document.getElementById('statSignedUp').textContent = signedUp;
    document.getElementById('statFilled').textContent = filled;
    document.getElementById('statVacant').textContent = vacant;
    document.getElementById('statUnderstaffed').textContent = understaffed;
    document.getElementById('miniTotal').textContent = total;
    document.getElementById('miniSigned').textContent = signedUp;
    document.getElementById('liveCount').textContent = signedUp;
    const liveCountEl = document.getElementById('liveCount');
    const btn = document.getElementById('badgeToggle');
    if (btn) btn.querySelector('#liveCount').textContent = signedUp;
    renderBadgeMenu();

    const totalCap = shifts.reduce((a, s) => a + s.required, 0) || 1;
    const fillPct = Math.round((signedUp / totalCap) * 100);
    const fills = document.querySelectorAll('.stat-bar-fill');
    if (fills[0]) fills[0].style.setProperty('--p', '100%');
    if (fills[1]) fills[1].style.setProperty('--p', fillPct + '%');
    if (fills[2]) fills[2].style.setProperty('--p', total ? Math.round((filled / total) * 100) + '%' : '0%');
    if (fills[3]) fills[3].style.setProperty('--p', total ? Math.round((vacant / total) * 100) + '%' : '0%');
    if (fills[4]) fills[4].style.setProperty('--p', total ? Math.round((understaffed / total) * 100) + '%' : '0%');

    const wrap = document.getElementById('statusTable');
    let filtered = shifts.filter(s => currentFilter === 'all' || shiftStatus(s) === currentFilter);
    let html = '<table><thead><tr><th>Role</th><th>Date</th><th>Time</th><th>Location</th><th>Signed Up</th><th>Required</th><th>Status</th></tr></thead><tbody>';
    if (filtered.length === 0) {
      html += '<tr><td colspan="7" class="empty-state"><span class="emoji">📭</span><h3>No matching roles</h3><p class="small">Try a different filter or add a new shift.</p></td></tr>';
    } else {
      filtered.forEach(s => {
        const st = shiftStatus(s);
        const cls = st === 'filled' ? 'filled' : st === 'vacant' ? 'vacant' : 'understaffed';
        const label = st === 'filled' ? 'Filled' : st === 'vacant' ? 'Vacant' : 'Understaffed';
        const icon = st === 'filled' ? '●' : st === 'vacant' ? '○' : '⚠';
        html += '<tr><td><strong>' + escapeHtml(s.role) + '</strong></td><td>' + fmtDate(s.date) + '</td><td>' + fmtTime(s.startTime) + ' – ' + fmtTime(s.endTime) + '</td><td class="small">' + escapeHtml(s.location) + '</td><td>' + s.volunteers.length + '</td><td>' + s.required + '</td><td><span class="status ' + cls + '"><span class="dot"></span>' + icon + ' ' + label + '</span></td></tr>';
      });
    }
    html += '</tbody></table>';
    wrap.innerHTML = html;
    renderChart();
    renderActivityList();
    renderUpcoming();
  }

  function renderChart() {
    const wrap = document.getElementById('staffingChart');
    wrap.innerHTML = '';
    shifts.forEach(s => {
      const st = shiftStatus(s);
      const pct = s.required ? Math.round((s.volunteers.length / s.required) * 100) : 0;
      const color = st === 'filled' ? 'var(--success)' : 'var(--warning)';
      const bar = document.createElement('div');
      bar.className = 'chart-bar';
      bar.innerHTML = '<div class="chart-bar-fill" style="height:' + pct + '%;background:' + color + '"></div>' +
        '<span class="chart-label">' + escapeHtml(s.role).slice(0, 10) + '</span>';
      wrap.appendChild(bar);
    });
  }

  function renderActivityList() {
    const wrap = document.getElementById('activityList');
    if (!wrap) return;
    const recent = activityLog.slice(0, 6);
    if (recent.length === 0) {
      wrap.innerHTML = '<div class="empty-state" style="padding:28px 16px"><span class="emoji" style="font-size:2rem">—</span><h3 style="font-size:1rem">No activity yet</h3></div>';
      return;
    }
    wrap.innerHTML = recent.map(a => '<div class="activity-item"><div class="activity-avatar">' + (a.type === 'ok' ? '✓' : a.type === 'err' ? '✕' : '!') + '</div><div class="activity-body"><div class="activity-text">' + escapeHtml(a.text) + '</div><div class="activity-meta">' + a.time + '</div></div></div>').join('');
  }

  function renderUpcoming() {
    const wrap = document.getElementById('upcomingList');
    if (!wrap) return;
    const now = new Date();
    const upcoming = reminders.filter(r => new Date(r.date + 'T' + r.time) >= now).sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time)).slice(0, 6);
    if (upcoming.length === 0) {
      wrap.innerHTML = '<div class="empty-state" style="padding:24px 16px"><span class="emoji" style="font-size:2rem">📭</span><h3 style="font-size:1rem">No upcoming reminders</h3><p class="small">Add a reminder from the Calendar.</p></div>';
      return;
    }
    wrap.innerHTML = upcoming.map(r => {
      const dt = new Date(r.date + 'T' + r.time);
      const shift = r.shiftId ? shifts.find(s => s.id === r.shiftId) : null;
      return '<div class="upcoming-item"><div class="upcoming-dot ' + (r.shiftId ? 'shift' : '') + '"></div><div class="upcoming-content"><span class="upcoming-title">' + escapeHtml(r.title) + '</span><span class="upcoming-meta">' + dt.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) + ' • ' + dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + '</span>' + (shift ? '<span class="upcoming-shift">Shift: ' + escapeHtml(shift.role) + '</span>' : '') + '</div><div class="upcoming-actions"><button class="btn-icon" onclick="appDeleteReminder(\'' + r.id + '\')" title="Delete">🗑</button></div></div>';
    }).join('');
  }

  function renderBadgeMenu() {
    const list = document.getElementById('badgeMenuList');
    if (!list) return;
    let checkedIn = [];
    shifts.forEach(s => {
      s.volunteers.forEach(v => {
        if (v.checkedIn) {
          checkedIn.push({ name: v.name, role: s.role });
        }
      });
    });
    if (checkedIn.length === 0) {
      list.innerHTML = '<div class="badge-menu-empty">No volunteers checked in</div>';
    } else {
      list.innerHTML = checkedIn.map(c => '<div class="badge-menu-item"><div class="badge-menu-item-name">' + escapeHtml(c.name) + '</div><div class="badge-menu-item-role">' + escapeHtml(c.role) + '</div></div>').join('');
    }
  }

  document.querySelectorAll('.chip').forEach(c => {
    c.addEventListener('click', () => {
      document.querySelectorAll('.chip').forEach(x => x.classList.remove('chip-active'));
      c.classList.add('chip-active');
      currentFilter = c.getAttribute('data-filter');
      renderDashboard();
    });
  });


  function renderShifts() {
    const wrap = document.getElementById('shiftsTable');
    const search = document.getElementById('shiftSearch').value.toLowerCase();
    let filtered = shifts.filter(s => s.role.toLowerCase().includes(search) || s.location.toLowerCase().includes(search));
    let html = '<table><thead><tr><th>Role</th><th>Date</th><th>Time</th><th>Location</th><th>Signed / Required</th><th>Status</th><th>Volunteers</th><th>Actions</th></tr></thead><tbody>';
    if (filtered.length === 0) {
      html += '<tr><td colspan="8" class="empty-state"><span class="emoji">📭</span><h3>No shifts found</h3><p class="small">Try a different search or add a new shift.</p></td></tr>';
    } else {
      filtered.forEach(s => {
        const st = shiftStatus(s);
        const cls = st === 'filled' ? 'filled' : st === 'vacant' ? 'vacant' : 'understaffed';
        const label = st === 'filled' ? 'Filled' : st === 'vacant' ? 'Vacant' : 'Understaffed';
        const vols = s.volunteers.length ? s.volunteers.map(v => '<span class="vol-chip ' + (v.checkedIn ? 'checked' : '') + '" title="' + escapeHtml(v.email) + '"><span class="dot"></span>' + escapeHtml(v.name) + (v.checkedIn ? ' ✓' : '') + '</span>').join(' ') : '<span class="small">— no volunteers yet —</span>';
        html += '<tr><td><strong>' + escapeHtml(s.role) + '</strong></td><td>' + fmtDate(s.date) + '</td><td>' + fmtTime(s.startTime) + ' – ' + fmtTime(s.endTime) + '</td><td class="small">' + escapeHtml(s.location) + '</td><td><strong>' + s.volunteers.length + '</strong> / ' + s.required + '</td><td><span class="status ' + cls + '"><span class="dot"></span>' + label + '</span></td><td>' + vols + '</td><td><button class="btn btn-danger btn-sm" onclick="appDeleteShift(\'' + s.id + '\')" title="Delete shift"><span>🗑</span> Delete</button></td></tr>';
      });
    }
    html += '</tbody></table>';
    wrap.innerHTML = html;
  }

  document.getElementById('shiftSearch').addEventListener('input', renderShifts);

  window.appDeleteShift = function (id) {
    if (!confirm('Delete this shift? All volunteers signed up will be removed.')) return;
    shifts = shifts.filter(s => s.id !== id);
    save();
    renderShifts(); renderDashboard(); renderSignup(); renderCheckIn();
    toast({ type: 'info', title: 'Shift deleted', desc: 'The role shift has been removed.' });
    addActivity('Deleted shift', 'err');
  };

  const addShiftModal = document.getElementById('addShiftModal');
  const shiftBackdrop = document.getElementById('shiftBackdrop');
  const openAddShift = document.getElementById('openAddShift');
  const closeShift = document.getElementById('closeShift');
  const cancelShift = document.getElementById('cancelShift');
  const addShiftForm = document.getElementById('addShiftForm');

  function openModal() { addShiftModal.style.display = 'block'; document.body.style.overflow = 'hidden'; }
  function closeModal() { addShiftModal.style.display = 'none'; document.body.style.overflow = ''; addShiftForm.reset(); }

  openAddShift.addEventListener('click', openModal);
  closeShift.addEventListener('click', closeModal);
  cancelShift.addEventListener('click', closeModal);
  shiftBackdrop.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && addShiftModal.style.display === 'block') closeModal(); });

  addShiftForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = new FormData(addShiftForm);
    const role = form.get('role').trim();
    const date = form.get('date');
    const startTime = form.get('startTime');
    const endTime = form.get('endTime');
    const location = form.get('location').trim();
    const required = parseInt(form.get('required'), 10) || 1;
    if (!role || !date || !startTime || !endTime || !location) {
      toast({ type: 'err', title: 'Incomplete form', desc: 'Please fill in all fields before creating the shift.' });
      return;
    }
    if (new Date(date + 'T' + endTime) <= new Date(date + 'T' + startTime)) {
      toast({ type: 'err', title: 'Invalid time', desc: 'End time must be after start time.' });
      return;
    }
    const newShift = { id: 's' + Date.now(), role, date, startTime, endTime, location, required, volunteers: [] };
    shifts.push(newShift);
    save();
    closeModal();
    renderShifts(); renderDashboard(); renderSignup(); renderCheckIn();
    toast({ type: 'ok', title: 'Shift created', desc: '"' + escapeHtml(role) + '" is now open for sign-ups.' });
    addActivity('Created shift: ' + escapeHtml(role), 'ok');
  });

  function renderSignup() {
    const sel = document.getElementById('signupShiftSelect');
    sel.innerHTML = '<option value="">— Choose a shift with open spots —</option>';
    shifts.forEach(s => {
      const open = s.required - s.volunteers.length;
      if (open > 0) {
        const o = document.createElement('option');
        o.value = s.id;
        o.textContent = s.role + ' — ' + fmtDate(s.date) + ' ' + fmtTime(s.startTime) + '–' + fmtTime(s.endTime) + ' (' + open + ' spot' + (open > 1 ? 's' : '') + ' left) @ ' + escapeHtml(s.location);
        sel.appendChild(o);
      }
    });
  }

  const signupForm = document.getElementById('signupForm');
  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = new FormData(signupForm);
    const name = form.get('name').trim();
    const email = form.get('email').trim();
    const shiftId = form.get('shiftId');
    if (!name || !email || !shiftId) { toast({ type: 'err', title: 'Missing details', desc: 'Please enter your name, email, and select a shift.' }); return; }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) { toast({ type: 'err', title: 'Invalid email', desc: 'Please enter a valid email address.' }); return; }
    const shift = shifts.find(s => s.id === shiftId);
    if (!shift) { toast({ type: 'err', title: 'Shift not found' }); return; }
    if (shift.volunteers.length >= shift.required) { toast({ type: 'err', title: 'Shift full', desc: 'This shift already has enough volunteers.' }); renderSignup(); return; }
    if (shift.volunteers.some(v => v.email.toLowerCase() === email.toLowerCase())) { toast({ type: 'err', title: 'Already signed up', desc: email + ' is already signed up for this shift.' }); return; }
    shift.volunteers.push({ id: 'v' + Date.now(), name, email, checkedIn: false, checkedInAt: null });
    save();
    signupForm.reset();
    renderSignup();
    toast({ type: 'ok', title: 'Signed up', desc: escapeHtml(name) + ' is now registered for "' + escapeHtml(shift.role) + '".' });
    renderDashboard(); renderShifts(); renderCheckIn();
    addActivity(name + ' signed up for ' + escapeHtml(shift.role), 'ok');
  });


  function renderCheckIn() {
    const sel = document.getElementById('checkinShiftSelect');
    sel.innerHTML = '<option value="">— Choose a shift —</option>';
    shifts.forEach(s => {
      if (s.volunteers.length > 0) {
        const o = document.createElement('option');
        o.value = s.id;
        o.textContent = s.role + ' — ' + fmtDate(s.date) + ' ' + fmtTime(s.startTime) + '–' + fmtTime(s.endTime);
        sel.appendChild(o);
      }
    });
    document.getElementById('checkinList').innerHTML = '';
  }

  const checkinShiftSelect = document.getElementById('checkinShiftSelect');
  const checkinList = document.getElementById('checkinList');

  checkinShiftSelect.addEventListener('change', () => {
    const id = checkinShiftSelect.value;
    if (!id) { checkinList.innerHTML = ''; return; }
    const shift = shifts.find(s => s.id === id);
    if (!shift) return;
    let anyPending = false;
    let html = '<table><thead><tr><th>Volunteer</th><th>Email</th><th>Status</th><th>Action</th></tr></thead><tbody>';
    shift.volunteers.forEach(v => {
      anyPending = anyPending || !v.checkedIn;
      html += '<tr><td><strong>' + escapeHtml(v.name) + '</strong></td><td class="small">' + escapeHtml(v.email) + '</td><td><span class="status ' + (v.checkedIn ? 'checked' : 'pending') + '"><span class="dot"></span>' + (v.checkedIn ? '✓ Checked In' : '○ Pending') + '</span></td><td>' + (!v.checkedIn ? '<button class="btn btn-primary btn-sm" onclick="appCheckIn(\'' + id + '\', \'' + v.id + '\')" title="Check in volunteer"><span>✓</span> Check In</button>' : '<button class="btn btn-secondary btn-sm" onclick="appCheckOut(\'' + id + '\', \'' + v.id + '\')" title="Check out volunteer"><span>⏰</span> Check Out</button>') + '</td></tr>';
    });
    html += '</tbody></table>';
    checkinList.innerHTML = html;
    if (!anyPending) {
      const celeb = document.createElement('div');
      celeb.className = 'empty-state';
      celeb.innerHTML = '<span class="emoji" style="font-size:2.5rem">🎉</span><h3 style="font-size:1.1rem">All checked in</h3><p class="small">Every volunteer for this shift is present.</p>';
      checkinList.innerHTML = '';
      checkinList.appendChild(celeb);
    }
  });

  window.appCheckIn = function (shiftId, volId) {
    const shift = shifts.find(s => s.id === shiftId);
    const v = shift.volunteers.find(x => x.id === volId);
    if (!v || v.checkedIn) return;
    v.checkedIn = true;
    const checkinTime = new Date();
    v.checkedInAt = checkinTime.toISOString();
    save();
    checkinShiftSelect.dispatchEvent(new Event('change'));
    renderDashboard(); renderShifts();
    const timeStr = checkinTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    toast({ type: 'ok', title: 'Checked in', desc: escapeHtml(v.name) + ' is now present for "' + escapeHtml(shift.role) + '".' });
    addActivity(v.name + ' checked in for ' + escapeHtml(shift.role) + ' at ' + timeStr, 'ok');
    confetti();
  };

  window.appCheckOut = function (shiftId, volId) {
    const shift = shifts.find(s => s.id === shiftId);
    const v = shift.volunteers.find(x => x.id === volId);
    if (!v || !v.checkedIn) return;
    v.checkedIn = false;
    const checkoutTime = new Date();
    v.checkedOutAt = checkoutTime.toISOString();
    save();
    checkinShiftSelect.dispatchEvent(new Event('change'));
    renderDashboard(); renderShifts();
    const timeStr = checkoutTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    toast({ type: 'info', title: 'Checked out', desc: escapeHtml(v.name) + ' has checked out from "' + escapeHtml(shift.role) + '" at ' + timeStr + '.' });
    addActivity(v.name + ' checked out from ' + escapeHtml(shift.role) + ' at ' + timeStr, 'info');
  };

  document.getElementById('contactForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const name = form.get('name').trim();
    const email = form.get('email').trim();
    const message = form.get('message').trim();
    if (!name || !email || !message) { toast({ type: 'err', title: 'Incomplete form', desc: 'Please fill in all fields.' }); return; }
    const contactMsg = document.getElementById('contactMsg');
    contactMsg.innerHTML = '<div class="msg ok">✓ Message sent to organizer successfully.</div>';
    e.target.reset();
    setTimeout(() => { contactMsg.innerHTML = ''; }, 4000);
    toast({ type: 'ok', title: 'Message sent', desc: 'Your message has been delivered to the organizer.' });
    addActivity('Contact form submitted by ' + escapeHtml(name), 'info');
  });

  document.getElementById('btnSeed').addEventListener('click', () => {
    shifts = JSON.parse(JSON.stringify(SEED_SHIFTS));
    save();
    renderDashboard(); renderShifts(); renderSignup(); renderCheckIn();
    toast({ type: 'ok', title: 'Demo data seeded', desc: 'Sample shifts loaded.' });
  });

  document.getElementById('btnReset').addEventListener('click', () => {
    if (!confirm('Reset ALL data? This cannot be undone.')) return;
    shifts = [];
    save();
    renderDashboard(); renderShifts(); renderSignup(); renderCheckIn();
    toast({ type: 'info', title: 'Data reset', desc: 'All shifts and volunteers have been cleared.' });
  });

  document.getElementById('btnExport').addEventListener('click', () => {
    const data = JSON.stringify(shifts, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'volunteerhub-data.json'; a.click();
    URL.revokeObjectURL(url);
    toast({ type: 'info', title: 'Exported', desc: 'volunteerhub-data.json saved to your downloads.' });
  });


  function renderCalendar() {
    document.getElementById('calMonthYear').textContent = calDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    const weekdays = document.getElementById('calWeekdays');
    weekdays.innerHTML = '';
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
      const h = document.createElement('div');
      h.className = 'cal-weekday';
      h.textContent = day;
      weekdays.appendChild(h);
    });

    const year = calDate.getFullYear();
    const month = calDate.getMonth();
    const daysContainer = document.getElementById('calDays');
    daysContainer.innerHTML = '';

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < firstDay; i++) {
      const empty = document.createElement('div');
      empty.className = 'cal-day empty';
      daysContainer.appendChild(empty);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const cell = document.createElement('div');
      cell.className = 'cal-day';
      const cellDate = new Date(year, month, d);
      cellDate.setHours(0, 0, 0, 0);
      if (cellDate.getTime() === today.getTime()) cell.classList.add('today');

      const num = document.createElement('div');
      num.className = 'cal-day-number';
      num.textContent = d;
      cell.appendChild(num);

      const eventsWrap = document.createElement('div');
      eventsWrap.className = 'cal-day-events';

      const dayReminders = reminders.filter(r => { const rd = new Date(r.date); rd.setHours(0, 0, 0, 0); return rd.getTime() === cellDate.getTime(); });
      dayReminders.slice(0, 3).forEach(r => {
        const chip = document.createElement('div');
        chip.className = 'cal-event ' + (r.shiftId ? 'shift' : 'general');
        chip.textContent = r.title;
        chip.title = (r.description || '') + ' ' + r.time;
        eventsWrap.appendChild(chip);
      });
      if (dayReminders.length > 3) {
        const more = document.createElement('div');
        more.className = 'cal-event more';
        more.textContent = '+ ' + (dayReminders.length - 3) + ' more';
        eventsWrap.appendChild(more);
      }
      cell.appendChild(eventsWrap);
      daysContainer.appendChild(cell);
    }
  }

  document.getElementById('calPrev').addEventListener('click', () => { calDate = new Date(calDate.getFullYear(), calDate.getMonth() - 1, 1); renderCalendar(); });
  document.getElementById('calNext').addEventListener('click', () => { calDate = new Date(calDate.getFullYear(), calDate.getMonth() + 1, 1); renderCalendar(); });

  window.appDeleteReminder = function (id) {
    if (!confirm('Delete this reminder?')) return;
    reminders = reminders.filter(r => r.id !== id);
    saveReminders();
    renderCalendar(); renderDashboard(); renderUpcoming();
    toast({ type: 'info', title: 'Reminder deleted', desc: 'The reminder has been removed.' });
  };

  const addReminderModal = document.getElementById('addReminderModal');
  const reminderBackdrop = document.getElementById('reminderBackdrop');
  const openAddReminder = document.getElementById('openAddReminder');
  const closeReminder = document.getElementById('closeReminder');
  const cancelReminder = document.getElementById('cancelReminder');
  const addReminderForm = document.getElementById('addReminderForm');
  const reminderShiftSelect = document.getElementById('reminderShiftSelect');

  function openReminderModal() {
    reminderShiftSelect.innerHTML = '<option value="">— None —</option>';
    shifts.forEach(s => {
      const o = document.createElement('option');
      o.value = s.id;
      o.textContent = s.role + ' — ' + fmtDate(s.date);
      reminderShiftSelect.appendChild(o);
    });
    addReminderModal.style.display = 'block';
    addReminderModal.style.opacity = '1';
    document.body.style.overflow = 'hidden';
  }
  function closeReminderModal() {
    addReminderModal.style.display = 'none';
    document.body.style.overflow = '';
    addReminderForm.reset();
  }

  openAddReminder.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    openReminderModal();
  });
  closeReminder.addEventListener('click', closeReminderModal);
  cancelReminder.addEventListener('click', closeReminderModal);
  reminderBackdrop.addEventListener('click', closeReminderModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && addReminderModal.style.display === 'block') closeReminderModal();
  });

  addReminderForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = new FormData(addReminderForm);
    const title = form.get('title').trim();
    const date = form.get('date');
    const time = form.get('time');
    const description = form.get('description').trim();
    const shiftId = form.get('shiftId') || '';
    if (!title || !date || !time) { toast({ type: 'err', title: 'Incomplete form', desc: 'Please fill in title, date, and time.' }); return; }
    reminders.push({ id: 'r' + Date.now(), title, date, time, description, shiftId });
    saveReminders();
    closeReminderModal();
    renderCalendar(); renderDashboard(); renderUpcoming();
    toast({ type: 'ok', title: 'Reminder created', desc: '"' + escapeHtml(title) + '" scheduled.' });
    addActivity('Calendar reminder: ' + escapeHtml(title), 'ok');
  });


  const idCardWrapper = document.getElementById('idCardWrapper');
  const idCardToggle = document.getElementById('idCardToggle');
  const idCardPopup = document.getElementById('idCardPopup');
  const idCardClose = document.getElementById('idCardClose');
  const idCardName = document.getElementById('idCardName');
  const idCardRole = document.getElementById('idCardRole');
  const idCardShift = document.getElementById('idCardShift');
  const idCardStatus = document.getElementById('idCardStatus');
  const idCardStatusDot = document.getElementById('idCardStatusDot');
  let idCardOpen = false;

  function openIdCard() {
    if (!idCardPopup || !idCardToggle) return;
    idCardPopup.classList.add('open');
    idCardToggle.classList.add('open');
    idCardOpen = true;
    updateIdCardData();
  }

  function closeIdCard() {
    if (!idCardPopup || !idCardToggle) return;
    idCardPopup.classList.remove('open');
    idCardToggle.classList.remove('open');
    idCardOpen = false;
  }

  function updateIdCardData() {
    if (!idCardName) return;
    let activeVolunteer = null;
    let activeShift = null;
    for (const s of shifts) {
      for (const v of s.volunteers) {
        if (v.checkedIn) {
          activeVolunteer = v;
          activeShift = s;
          break;
        }
      }
      if (activeVolunteer) break;
    }
    if (!activeVolunteer && shifts.length > 0) {
      activeShift = shifts[0];
    }
    if (activeVolunteer) {
      idCardName.textContent = activeVolunteer.name;
      idCardRole.textContent = 'Checked-in Volunteer';
      idCardShift.textContent = activeShift.role + ' • ' + activeShift.date;
      idCardStatus.textContent = 'Checked In';
      idCardStatusDot.textContent = '● Checked In';
      idCardStatusDot.style.color = 'var(--success)';
    } else if (activeShift) {
      idCardName.textContent = 'No volunteer checked in';
      idCardRole.textContent = 'Event Staff';
      idCardShift.textContent = activeShift.role + ' • ' + activeShift.date;
      idCardStatus.textContent = 'Available';
      idCardStatusDot.textContent = '○ Available';
      idCardStatusDot.style.color = 'var(--muted)';
    } else {
      idCardName.textContent = '—';
      idCardRole.textContent = '—';
      idCardShift.textContent = '—';
      idCardStatus.textContent = 'No shifts yet';
      idCardStatusDot.textContent = '○ Idle';
      idCardStatusDot.style.color = 'var(--muted)';
    }
  }

  idCardToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    if (idCardOpen) closeIdCard(); else openIdCard();
  });

  idCardClose.addEventListener('click', (e) => {
    e.stopPropagation();
    closeIdCard();
  });

  document.addEventListener('click', (e) => {
    if (idCardOpen && idCardPopup && !idCardPopup.contains(e.target) && !idCardToggle.contains(e.target)) {
      closeIdCard();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && idCardOpen) closeIdCard();
  });

  const badgeToggle = document.getElementById('badgeToggle');
  const badgeMenu = document.getElementById('badgeMenu');
  let badgeOpen = false;

  badgeToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    badgeOpen = !badgeOpen;
    badgeMenu.classList.toggle('open', badgeOpen);
  });

  document.addEventListener('click', (e) => {
    if (badgeOpen && badgeMenu && !badgeMenu.contains(e.target) && !badgeToggle.contains(e.target)) {
      badgeOpen = false;
      badgeMenu.classList.remove('open');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
    const map = { '1': 'dashboard', '2': 'shifts', '3': 'signup', '4': 'checkin', '5': 'settings', '6': 'calendar', '7': 'comments' };
    if (map[e.key]) showView(map[e.key]);
  });

  load();
  loadReminders();
  loadComments();
  showView('dashboard');
  observeReveals();
})();

  function renderComments() {
    const list = document.getElementById('commentList');
    if (!list) return;
    const sorted = [...comments].sort((a, b) => b.score - a.score || new Date(b.time) - new Date(a.time));
    if (sorted.length === 0) {
      list.innerHTML = '<div class="empty-state" style="padding:28px 16px;text-align:center"><span class="emoji" style="font-size:2.5rem">💬</span><h3 style="font-size:1.1rem">No comments yet</h3><p class="small">Be the first to share an update about the event.</p></div>';
      return;
    }
    list.innerHTML = sorted.map(c => {
      const upClass = c.userVote === 1 ? 'voted' : '';
      const downClass = c.userVote === -1 ? 'voted' : '';
      const timeAgo = timeAgoStr(c.time);
      return '<div class="comment-item reveal">' +
        '<div class="comment-votes">' +
        '<button class="vote-btn vote-up ' + upClass + '" onclick="appVoteComment(\'' + c.id + '\', 1)">▲</button>' +
        '<div class="vote-score">' + c.score + '</div>' +
        '<button class="vote-btn vote-down ' + downClass + '" onclick="appVoteComment(\'' + c.id + '\', -1)">▼</button>' +
        '</div>' +
        '<div class="comment-body">' +
        '<div class="comment-header">' +
        '<span class="comment-author">' + escapeHtml(c.author) + '</span>' +
        '<span class="comment-time">' + timeAgo + '</span>' +
        '</div>' +
        '<div class="comment-text">' + escapeHtml(c.text) + '</div>' +
        '</div>' +
        '</div>';
    }).join('');
  }

  function timeAgoStr(iso) {
    const d = new Date(iso);
    const now = new Date();
    const sec = Math.floor((now - d) / 1000);
    if (sec < 60) return 'just now';
    const min = Math.floor(sec / 60);
    if (min < 60) return min + 'm ago';
    const hr = Math.floor(min / 60);
    if (hr < 24) return hr + 'h ago';
    return Math.floor(hr / 24) + 'd ago';
  }

  document.getElementById('postComment').addEventListener('click', () => {
    const ta = document.getElementById('newCommentText');
    const text = ta.value.trim();
    if (!text) { toast({ type: 'err', title: 'Empty comment', desc: 'Please type something before posting.' }); return; }
    comments.unshift({ id: 'c' + Date.now(), author: 'Volunteer', text: text, score: 0, time: new Date().toISOString(), userVote: 0 });
    saveComments();
    ta.value = '';
    renderComments();
    toast({ type: 'ok', title: 'Posted', desc: 'Your comment has been shared.' });
    addActivity('Posted a comment: ' + escapeHtml(text.slice(0, 40)) + (text.length > 40 ? '…' : ''), 'ok');
  });

  window.appVoteComment = function (cid, dir) {
    const c = comments.find(x => x.id === cid);
    if (!c) return;
    if (c.userVote === dir) {
      c.userVote = 0;
      c.score -= dir;
    } else {
      c.score += (c.userVote === 0 ? dir : dir * 2);
      c.userVote = dir;
    }
    saveComments();
    renderComments();
  };

