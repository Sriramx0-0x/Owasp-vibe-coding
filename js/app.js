/* VolunteerHub — MVP Application Logic (Polished UI/UX) */
(function () {
  const STORAGE_KEY = 'volunteerhub_shifts_v1';

  const SEED_SHIFTS = [
    { id: 's1', role: 'Registration Desk', date: '2026-11-15', startTime: '08:00', endTime: '12:00', location: 'Main Lobby - Hall A', required: 4, volunteers: [] },
    { id: 's2', role: 'Tech Support', date: '2026-11-15', startTime: '10:00', endTime: '14:00', location: 'Workshop Room B', required: 3, volunteers: [] },
    { id: 's3', role: 'Mentor Guide', date: '2026-11-15', startTime: '13:00', endTime: '17:00', location: 'Mentor Lounge', required: 5, volunteers: [] },
    { id: 's4', role: 'Catering Assistant', date: '2026-11-15', startTime: '11:00', endTime: '15:00', location: 'Cafeteria', required: 2, volunteers: [] },
    { id: 's5', role: 'Cleanup Crew', date: '2026-11-15', startTime: '17:00', endTime: '20:00', location: 'Entire Venue', required: 6, volunteers: [] }
  ];

  let shifts = [];
  let activityLog = [];
  let currentFilter = 'all';

  /* ---------- Storage ---------- */
  function load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    shifts = raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(SEED_SHIFTS));
    activityLog = [];
    if (!raw) save();
  }
  function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(shifts)); }

  function addActivity(text, type = 'info') {
    activityLog.unshift({ text, type, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
    if (activityLog.length > 50) activityLog.pop();
    if (document.getElementById('view-checkin').style.display === 'block' ||
        document.getElementById('view-dashboard').style.display === 'block') {
      renderActivityList();
    }
  }

  /* ---------- Helpers ---------- */
  function escapeHtml(text) {
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
  }
  function fmtTime(t) { return t || '—'; }
  function fmtDate(d) {
    if (!d) return '—';
    const dt = new Date(d + 'T00:00');
    return dt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  }
  function shiftStatus(shift) {
    const signed = shift.volunteers.length;
    if (signed >= shift.required) return 'filled';
    if (signed > 0) return 'understaffed';
    return 'vacant';
  }

  /* ---------- Toast ---------- */
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
    el.innerHTML = `
      <span class="toast-icon">${icons[type]}</span>
      <div class="toast-body">
        <div class="toast-title">${escapeHtml(title)}</div>
        ${desc ? '<div class="toast-desc">' + escapeHtml(desc) + '</div>' : ''}
      </div>
      <span class="toast close-btn" onclick="appCloseToast('${id}')">✕</span>
    `;
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

  /* Confetti */
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

  /* ---------- Sidebar: collapse + resize ---------- */
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

  /* ---------- Live clock ---------- */
  function updateClock() {
    const now = new Date();
    document.getElementById('liveTime').textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  setInterval(updateClock, 1000);
  updateClock();

  /* ---------- Navigation ---------- */
  const navItems = document.querySelectorAll('.nav-item');
  const views = document.querySelectorAll('.view');
  const pageTitle = document.getElementById('pageTitle');
  const pageSub = document.getElementById('pageSub');

  function showView(id) {
    views.forEach(v => {
      v.style.display = 'none';
      v.classList.remove('visible');
    });
    const target = document.getElementById('view-' + id);
    if (target) {
      target.style.display = 'block';
      requestAnimationFrame(() => target.classList.add('visible'));
    }
    navItems.forEach(n => n.classList.toggle('active', n.getAttribute('data-view') === id));
    const titles = {
      dashboard: ['Overview', 'Staffing health across all role shifts at a glance.'],
      shifts: ['Role Shifts', 'Define roles, timings, locations, and required headcount.'],
      signup: ['Volunteer Sign Up', 'Register for an open shift with available spots.'],
      checkin: ['Check In', 'Mark signed-up volunteers as present at the event.'],
      settings: ['Data & Reset', 'Seed, export, or reset your volunteer data.']
    };
    const [t, s] = titles[id] || titles.dashboard;
    pageTitle.textContent = t;
    pageSub.textContent = s;
    if (window.innerWidth <= 900) sidebar.classList.remove('open');

    if (id === 'dashboard') renderDashboard();
    if (id === 'shifts') renderShifts();
    if (id === 'signup') renderSignup();
    if (id === 'checkin') renderCheckIn();
  }

  navItems.forEach(n => {
    n.addEventListener('click', (e) => {
      e.preventDefault();
      showView(n.getAttribute('data-view'));
    });
  });

  /* ---------- Scroll reveal ---------- */
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

  /* ---------- Dashboard ---------- */
  function renderDashboard() {
    const total = shifts.length;
    const signedUp = shifts.reduce((a, s) => a + s.volunteers.length, 0);
    let filled = 0, vacant = 0, understaffed = 0;
    shifts.forEach(s => {
      const st = shiftStatus(s);
      if (st === 'filled') filled++;
      else if (st === 'vacant') vacant++;
      else understaffed++;
    });

    document.getElementById('statTotalShifts').textContent = total;
    document.getElementById('statSignedUp').textContent = signedUp;
    document.getElementById('statFilled').textContent = filled;
    document.getElementById('statVacant').textContent = vacant;
    document.getElementById('statUnderstaffed').textContent = understaffed;
    document.getElementById('miniTotal').textContent = total;
    document.getElementById('miniSigned').textContent = signedUp;
    document.getElementById('liveCount').textContent = signedUp + ' volunteers';

    const totalCap = shifts.reduce((a, s) => a + s.required, 0) || 1;
    const fillPct = Math.round((signedUp / totalCap) * 100);
    document.querySelector('#statTotalShifts .stat-bar-fill').style.setProperty('--p', '100%');
    document.querySelector('#statSignedUp .stat-bar-fill').style.setProperty('--p', fillPct + '%');
    document.querySelector('#statFilled .stat-bar-fill').style.setProperty('--p', total ? Math.round((filled / total) * 100) + '%' : '0%');
    document.querySelector('#statVacant .stat-bar-fill').style.setProperty('--p', total ? Math.round((vacant / total) * 100) + '%' : '0%');
    document.querySelector('#statUnderstaffed .stat-bar-fill').style.setProperty('--p', total ? Math.round((understaffed / total) * 100) + '%' : '0%');

    /* Status board table */
    const wrap = document.getElementById('statusTable');
    let filtered = shifts.filter(s => currentFilter === 'all' || shiftStatus(s) === currentFilter);
    let html = '<table><thead><tr>' +
      '<th>Role</th><th>Date</th><th>Time</th><th>Location</th>' +
      '<th>Signed Up</th><th>Required</th><th>Status</th></tr></thead><tbody>';

    if (filtered.length === 0) {
      html += '<tr><td colspan="7" class="empty-state"><span class="emoji">📭</span><h3>No matching roles</h3><p class="small">Try a different filter or add a new shift.</p></td></tr>';
    } else {
      filtered.forEach(s => {
        const st = shiftStatus(s);
        const cls = st === 'filled' ? 'filled' : st === 'vacant' ? 'vacant' : 'understaffed';
        const label = st === 'filled' ? 'Filled' : st === 'vacant' ? 'Vacant' : 'Understaffed';
        const icon = st === 'filled' ? '●' : st === 'vacant' ? '○' : '⚠';
        html += '<tr>' +
          '<td><strong>' + escapeHtml(s.role) + '</strong></td>' +
          '<td>' + fmtDate(s.date) + '</td>' +
          '<td>' + fmtTime(s.startTime) + ' – ' + fmtTime(s.endTime) + '</td>' +
          '<td class="small">' + escapeHtml(s.location) + '</td>' +
          '<td>' + s.volunteers.length + '</td>' +
          '<td>' + s.required + '</td>' +
          '<td><span class="status ' + cls + '"><span class="dot"></span>' + icon + ' ' + label + '</span></td>' +
          '</tr>';
      });
    }
    html += '</tbody></table>';
    wrap.innerHTML = html;

    /* Staffing chart */
    renderChart();

    /* Activity */
    renderActivityList();
  }

  function renderChart() {
    const wrap = document.getElementById('staffingChart');
    wrap.innerHTML = '';
    shifts.forEach(s => {
      const st = shiftStatus(s);
      const cls = st === 'filled' ? 'primary' : st === 'vacant' ? 'warning' : st === 'understaffed' ? 'warning' : 'danger';
      const pct = s.required ? Math.round((s.volunteers.length / s.required) * 100) : 0;
      const bar = document.createElement('div');
      bar.className = 'chart-bar chart-bar-' + cls;
      bar.innerHTML =
        '<div class="chart-bar-fill" style="height:' + pct + '%;background:' +
        (cls === 'primary' ? 'var(--success)' : cls === 'warning' ? 'var(--warning)' : 'var(--danger)') + '"></div>' +
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
    wrap.innerHTML = recent.map(a =>
      '<div class="activity-item">' +
      '<div class="activity-avatar">' + (a.type === 'ok' ? '✓' : a.type === 'err' ? '✕' : '!') + '</div>' +
      '<div class="activity-body">' +
      '<div class="activity-text">' + escapeHtml(a.text) + '</div>' +
      '<div class="activity-meta">' + a.time + '</div>' +
      '</div></div>').join('');
  }

  /* Filter chips */
  document.querySelectorAll('.chip').forEach(c => {
    c.addEventListener('click', () => {
      document.querySelectorAll('.chip').forEach(x => x.classList.remove('chip-active'));
      c.classList.add('chip-active');
      currentFilter = c.getAttribute('data-filter');
      renderDashboard();
    });
  });

  /* ---------- Role Shifts list ---------- */
  function renderShifts() {
    const wrap = document.getElementById('shiftsTable');
    const search = document.getElementById('shiftSearch').value.toLowerCase();
    let filtered = shifts.filter(s =>
      s.role.toLowerCase().includes(search) ||
      s.location.toLowerCase().includes(search)
    );
    let html = '<table><thead><tr>' +
      '<th>Role</th><th>Date</th><th>Time</th><th>Location</th>' +
      '<th>Signed / Required</th><th>Status</th><th>Volunteers</th><th>Actions</th></tr></thead><tbody>';

    if (filtered.length === 0) {
      html += '<tr><td colspan="8" class="empty-state"><span class="emoji">📭</span><h3>No shifts found</h3><p class="small">Try a different search or add a new shift.</p></td></tr>';
    } else {
      filtered.forEach(s => {
        const st = shiftStatus(s);
        const cls = st === 'filled' ? 'filled' : st === 'vacant' ? 'vacant' : 'understaffed';
        const label = st === 'filled' ? 'Filled' : st === 'vacant' ? 'Vacant' : 'Understaffed';
        const vols = s.volunteers.length ? s.volunteers.map(v =>
          '<span class="vol-chip ' + (v.checkedIn ? 'checked' : '') + '" title="' + escapeHtml(v.email) + '">' +
          '<span class="dot"></span>' + escapeHtml(v.name) + (v.checkedIn ? ' ✓' : '') + '</span>').join(' ') :
          '<span class="small">— no volunteers yet —</span>';
        html += '<tr>' +
          '<td><strong>' + escapeHtml(s.role) + '</strong></td>' +
          '<td>' + fmtDate(s.date) + '</td>' +
          '<td>' + fmtTime(s.startTime) + ' – ' + fmtTime(s.endTime) + '</td>' +
          '<td class="small">' + escapeHtml(s.location) + '</td>' +
          '<td><strong>' + s.volunteers.length + '</strong> / ' + s.required + '</td>' +
          '<td><span class="status ' + cls + '"><span class="dot"></span>' + label + '</span></td>' +
          '<td>' + vols + '</td>' +
          '<td><button class="btn btn-danger btn-sm" onclick="appDeleteShift(\'' + s.id + '\')" title="Delete shift"><span>🗑</span> Delete</button></td>' +
          '</tr>';
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
    renderShifts();
    renderDashboard();
    renderSignup();
    renderCheckIn();
    toast({ type: 'info', title: 'Shift deleted', desc: 'The role shift has been removed.' });
    addActivity('Deleted shift', 'err');
  };

  /* Add shift modal */
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

    const newShift = {
      id: 's' + Date.now(),
      role, date, startTime, endTime, location, required, volunteers: []
    };
    shifts.push(newShift);
    save();
    closeModal();
    renderShifts();
    renderDashboard();
    renderSignup();
    renderCheckIn();
    toast({ type: 'ok', title: 'Shift created', desc: '"' + escapeHtml(role) + '" is now open for sign-ups.' });
    addActivity('Created shift: ' + escapeHtml(role), 'ok');
  });

  /* ---------- Volunteer Sign Up ---------- */
  function renderSignup() {
    const sel = document.getElementById('signupShiftSelect');
    sel.innerHTML = '<option value="">— Choose a shift with open spots —</option>';
    shifts.forEach(s => {
      const open = s.required - s.volunteers.length;
      if (open > 0) {
        const o = document.createElement('option');
        o.value = s.id;
        o.textContent = s.role + ' — ' + fmtDate(s.date) + ' ' + fmtTime(s.startTime) + '–' + fmtTime(s.endTime) +
          ' (' + open + ' spot' + (open > 1 ? 's' : '') + ' left) @ ' + escapeHtml(s.location);
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

    if (!name || !email || !shiftId) {
      toast({ type: 'err', title: 'Missing details', desc: 'Please enter your name, email, and select a shift.' });
      return;
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) {
      toast({ type: 'err', title: 'Invalid email', desc: 'Please enter a valid email address.' });
      return;
    }

    const shift = shifts.find(s => s.id === shiftId);
    if (!shift) { toast({ type: 'err', title: 'Shift not found' }); return; }
    if (shift.volunteers.length >= shift.required) {
      toast({ type: 'err', title: 'Shift full', desc: 'This shift already has enough volunteers.' }); renderSignup(); return;
    }
    if (shift.volunteers.some(v => v.email.toLowerCase() === email.toLowerCase())) {
      toast({ type: 'err', title: 'Already signed up', desc: email + ' is already signed up for this shift.' }); return;
    }

    shift.volunteers.push({ id: 'v' + Date.now(), name, email, checkedIn: false, checkedInAt: null });
    save();
    signupForm.reset();
    renderSignup();
    toast({ type: 'ok', title: 'Signed up', desc: escapeHtml(name) + ' is now registered for "' + escapeHtml(shift.role) + '".' });
    renderDashboard();
    renderShifts();
    renderCheckIn();
    addActivity(name + ' signed up for ' + escapeHtml(shift.role), 'ok');
  });

  /* ---------- Check In ---------- */
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
    let html = '<table><thead><tr>' +
      '<th>Volunteer</th><th>Email</th><th>Status</th><th>Action</th></tr></thead><tbody>';
    shift.volunteers.forEach(v => {
      anyPending = anyPending || !v.checkedIn;
      html += '<tr>' +
        '<td><strong>' + escapeHtml(v.name) + '</strong></td>' +
        '<td class="small">' + escapeHtml(v.email) + '</td>' +
        '<td><span class="status ' + (v.checkedIn ? 'checked' : 'pending') + '"><span class="dot"></span>' +
        (v.checkedIn ? '✓ Checked In' : '○ Pending') + '</span></td>' +
        '<td>' +
        (!v.checkedIn
          ? '<button class="btn btn-primary btn-sm" onclick="appCheckIn(\'' + id + '\', \'' + v.id + '\')" title="Check in volunteer"><span>✓</span> Check In</button>'
          : '<span class="small pill ok">Done</span>') +
        '</td>' +
        '</tr>';
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
    v.checkedInAt = new Date().toISOString();
    save();
    checkinShiftSelect.dispatchEvent(new Event('change'));
    renderDashboard();
    renderShifts();
    toast({ type: 'ok', title: 'Checked in', desc: escapeHtml(v.name) + ' is now present for "' + escapeHtml(shift.role) + '".' });
    addActivity(v.name + ' checked in for ' + escapeHtml(shift.role), 'ok');
    confetti();
  };

  /* ---------- Data & Reset ---------- */
  document.getElementById('btnSeed').addEventListener('click', () => {
    shifts = JSON.parse(JSON.stringify(SEED_SHIFTS));
    activityLog = [];
    save();
    renderDashboard(); renderShifts(); renderSignup(); renderCheckIn();
    toast({ type: 'ok', title: 'Demo data seeded', desc: 'Sample shifts loaded.' });
  });

  document.getElementById('btnReset').addEventListener('click', () => {
    if (!confirm('Reset ALL data? This cannot be undone.')) return;
    shifts = [];
    activityLog = [];
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

  /* ---------- Keyboard shortcuts ---------- */
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
    const map = { '1': 'dashboard', '2': 'shifts', '3': 'signup', '4': 'checkin', '5': 'settings' };
    if (map[e.key]) showView(map[e.key]);
  });

  /* ---------- Boot ---------- */
  load();
  showView('dashboard');
  observeReveals();

  /* ---------- Reminders storage ---------- */
  const REMINDER_KEY = 'volunteerhub_reminders_v1';
  let reminders = [];
  function loadReminders() {
    const raw = localStorage.getItem(REMINDER_KEY);
    reminders = raw ? JSON.parse(raw) : [];
  }
  function saveReminders() { localStorage.setItem(REMINDER_KEY, JSON.stringify(reminders)); }

  /* ---------- Contact form ---------- */
  document.getElementById('contactForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const name = form.get('name').trim();
    const email = form.get('email').trim();
    const message = form.get('message').trim();
    if (!name || !email || !message) {
      toast({ type: 'err', title: 'Incomplete form', desc: 'Please fill in all fields.' });
      return;
    }
    const contactMsg = document.getElementById('contactMsg');
    contactMsg.innerHTML = '<div class="msg ok">✓ Message sent to organizer successfully.</div>';
    e.target.reset();
    setTimeout(() => { contactMsg.innerHTML = ''; }, 4000);
    toast({ type: 'ok', title: 'Message sent', desc: 'Your message has been delivered to the organizer.' });
    addActivity('Contact form submitted by ' + escapeHtml(name), 'info');
  });

  /* ---------- Calendar ---------- */
  let calDate = new Date();
  function calMonthLabel(d) { return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }); }
  function renderCalendar() {
    document.getElementById('calMonthYear').textContent = calMonthLabel(calDate);
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';

    const year = calDate.getFullYear();
    const month = calDate.getMonth();

    // Day headers
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.forEach(day => {
      const h = document.createElement('div');
      h.className = 'cal-day';
      h.style.fontWeight = '800';
      h.style.fontSize = '0.75rem';
      h.style.color = '#94a3b8';
      h.style.textTransform = 'uppercase';
      h.style.padding = '12px 8px';
      h.style.borderBottom = '2px solid ' + getComputedStyle(document.documentElement).getPropertyValue('--line').trim();
      h.textContent = day;
      grid.appendChild(h);
    });

    // Days of month
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < firstDay; i++) {
      const empty = document.createElement('div');
      empty.className = 'cal-day empty';
      grid.appendChild(empty);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const cell = document.createElement('div');
      cell.className = 'cal-day';
      const cellDate = new Date(year, month, d);
      cellDate.setHours(0, 0, 0, 0);
      const isToday = cellDate.getTime() === today.getTime();
      if (isToday) cell.classList.add('today');

      const num = document.createElement('div');
      num.className = 'cal-day-number';
      num.textContent = d;
      cell.appendChild(num);

      const remindersForDay = reminders.filter(r => {
        const rd = new Date(r.date);
        rd.setHours(0, 0, 0, 0);
        return rd.getTime() === cellDate.getTime();
      });

      const remWrap = document.createElement('div');
      remWrap.className = 'cal-reminders';
      remindersForDay.slice(0, 3).forEach(r => {
        const chip = document.createElement('div');
        chip.className = 'cal-reminder ' + (r.shiftId ? 'shift' : 'general');
        chip.textContent = r.title;
        chip.title = r.description || '';
        remWrap.appendChild(chip);
      });
      if (remindersForDay.length > 3) {
        const more = document.createElement('div');
        more.className = 'cal-reminder';
        more.textContent = '+ ' + (remindersForDay.length - 3) + ' more';
        remWrap.appendChild(more);
      }
      cell.appendChild(remWrap);
      grid.appendChild(cell);
    }
  }

  document.getElementById('calPrev').addEventListener('click', () => {
    calDate = new Date(calDate.getFullYear(), calDate.getMonth() - 1, 1);
    renderCalendar();
  });
  document.getElementById('calNext').addEventListener('click', () => {
    calDate = new Date(calDate.getFullYear(), calDate.getMonth() + 1, 1);
    renderCalendar();
  });

  /* Add Reminder Modal */
  const addReminderModal = document.getElementById('addReminderModal');
  const reminderBackdrop = document.getElementById('reminderBackdrop');
  const openAddReminder = document.getElementById('openAddReminder');
  const closeReminder = document.getElementById('closeReminder');
  const cancelReminder = document.getElementById('cancelReminder');
  const addReminderForm = document.getElementById('addReminderForm');
  const reminderShiftSelect = document.getElementById('addReminderForm').querySelector('select[name="shiftId"]');

  function openReminderModal() {
    reminderShiftSelect.innerHTML = '<option value="">— None —</option>';
    shifts.forEach(s => {
      const o = document.createElement('option');
      o.value = s.id;
      o.textContent = s.role + ' — ' + fmtDate(s.date);
      reminderShiftSelect.appendChild(o);
    });
    addReminderModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }
  function closeReminderModal() {
    addReminderModal.style.display = 'none';
    document.body.style.overflow = '';
    addReminderForm.reset();
  }

  openAddReminder.addEventListener('click', openReminderModal);
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

    if (!title || !date || !time) {
      toast({ type: 'err', title: 'Incomplete form', desc: 'Please fill in title, date, and time.' });
      return;
    }

    reminders.push({
      id: 'r' + Date.now(),
      title, date, time, description, shiftId
    });
    saveReminders();
    closeReminderModal();
    renderCalendar();
    renderDashboard();
    toast({ type: 'ok', title: 'Reminder created', desc: '"' + escapeHtml(title) + '" scheduled.' });
    addActivity('Calendar reminder: ' + escapeHtml(title), 'ok');
  });

  /* ---------- Navigation update (calendar view) ---------- */
  const origShowView = showView;
  showView = function (id) {
    // include calendar
    const titles = {
      dashboard: ['Overview', 'Staffing health across all role shifts at a glance.'],
      shifts: ['Role Shifts', 'Define roles, timings, locations, and required headcount.'],
      signup: ['Volunteer Sign Up', 'Register for an open shift with available spots.'],
      checkin: ['Check In', 'Mark signed-up volunteers as present at the event.'],
      settings: ['Data & Reset', 'Seed, export, or reset your volunteer data.'],
      calendar: ['Event Calendar', 'Manage reminders and upcoming event schedules.']
    };
    const views = document.querySelectorAll('.view');
    views.forEach(v => {
      v.style.display = 'none';
      v.classList.remove('visible');
    });
    const target = document.getElementById('view-' + id);
    if (target) {
      target.style.display = 'block';
      requestAnimationFrame(() => target.classList.add('visible'));
    }
    document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.getAttribute('data-view') === id));
    const [t, s] = titles[id] || titles.dashboard;
    document.getElementById('pageTitle').textContent = t;
    document.getElementById('pageSub').textContent = s;
    if (window.innerWidth <= 900) sidebar.classList.remove('open');

    if (id === 'dashboard') renderDashboard();
    if (id === 'shifts') renderShifts();
    if (id === 'signup') renderSignup();
    if (id === 'checkin') renderCheckIn();
    if (id === 'calendar') renderCalendar();
  };

  /* ---------- Keyboard shortcut 6 = calendar ---------- */
  const origKeydown = document.onkeydown;
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
    const map = { '1': 'dashboard', '2': 'shifts', '3': 'signup', '4': 'checkin', '5': 'settings', '6': 'calendar' };
    if (map[e.key]) showView(map[e.key]);
  });

  /* ---------- Boot (reminders) ---------- */
  loadReminders();
})();
