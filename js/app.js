/* VolunteerHub — MVP Application Logic */
(function () {
  const STORAGE_KEY = 'volunteerhub_shifts_v1';

  /* ---------- Demo seed data ---------- */
  const SEED_SHIFTS = [
    {
      id: 's1', role: 'Registration Desk', date: '2026-11-15',
      startTime: '08:00', endTime: '12:00', location: 'Main Lobby - Hall A', required: 4, volunteers: []
    },
    {
      id: 's2', role: 'Tech Support', date: '2026-11-15',
      startTime: '10:00', endTime: '14:00', location: 'Workshop Room B', required: 3, volunteers: []
    },
    {
      id: 's3', role: 'Mentor Guide', date: '2026-11-15',
      startTime: '13:00', endTime: '17:00', location: 'Mentor Lounge', required: 5, volunteers: []
    },
    {
      id: 's4', role: 'Catering Assistant', date: '2026-11-15',
      startTime: '11:00', endTime: '15:00', location: 'Cafeteria', required: 2, volunteers: []
    },
    {
      id: 's5', role: 'Cleanup Crew', date: '2026-11-15',
      startTime: '17:00', endTime: '20:00', location: 'Entire Venue', required: 6, volunteers: []
    }
  ];

  let shifts = [];

  /* ---------- Storage ---------- */
  function load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    shifts = raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(SEED_SHIFTS));
    if (!raw) save();
  }
  function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(shifts)); }

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

  /* Status of a shift: filled / understaffed / vacant */
  function shiftStatus(shift) {
    const signed = shift.volunteers.length;
    if (signed >= shift.required) return 'filled';
    if (signed > 0) return 'understaffed';
    return 'vacant';
  }

  /* ---------- Navigation ---------- */
  const navItems = document.querySelectorAll('.nav-item');
  const views = document.querySelectorAll('.view');
  const pageTitle = document.getElementById('pageTitle');
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');

  function showView(id) {
    views.forEach(v => v.style.display = 'none');
    const target = document.getElementById('view-' + id);
    if (target) target.style.display = 'block';
    navItems.forEach(n => {
      n.classList.toggle('active', n.getAttribute('data-view') === id);
    });
    const titles = {
      dashboard: 'Dashboard', shifts: 'Role Shifts',
      signup: 'Volunteer Sign Up', checkin: 'Check In', settings: 'Data & Reset'
    };
    pageTitle.textContent = titles[id] || 'Dashboard';
    if (sidebar.classList.contains('open')) sidebar.classList.remove('open');

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

  menuToggle.addEventListener('click', () => sidebar.classList.toggle('open'));

  document.getElementById('storageInfo').textContent = 'localStorage';

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
    document.getElementById('liveCount').textContent = signedUp + ' volunteers';

    const wrap = document.getElementById('statusTable');
    let html = '<table><thead><tr>' +
      '<th>Role</th><th>Date</th><th>Time</th><th>Location</th>' +
      '<th>Signed Up</th><th>Required</th><th>Status</th></tr></thead><tbody>';

    if (shifts.length === 0) {
      html += '<tr><td colspan="7" class="empty-state">No shifts yet. Add some under Role Shifts.</td></tr>';
    } else {
      shifts.forEach(s => {
        const st = shiftStatus(s);
        const cls = st === 'filled' ? 'filled' : st === 'vacant' ? 'vacant' : 'understaffed';
        const label = st === 'filled' ? '✅ Filled' : st === 'vacant' ? '⚪ Vacant' : '⚠️ Understaffed';
        html += '<tr>' +
          '<td><strong>' + escapeHtml(s.role) + '</strong></td>' +
          '<td>' + fmtDate(s.date) + '</td>' +
          '<td>' + fmtTime(s.startTime) + ' – ' + fmtTime(s.endTime) + '</td>' +
          '<td class="small">' + escapeHtml(s.location) + '</td>' +
          '<td>' + s.volunteers.length + '</td>' +
          '<td>' + s.required + '</td>' +
          '<td><span class="status ' + cls + '">' + label + '</span></td>' +
          '</tr>';
      });
    }
    html += '</tbody></table>';
    wrap.innerHTML = html;
  }

  /* ---------- Role Shifts list ---------- */
  function renderShifts() {
    const wrap = document.getElementById('shiftsTable');
    let html = '<table><thead><tr>' +
      '<th>Role</th><th>Date</th><th>Time</th><th>Location</th>' +
      '<th>Signed / Required</th><th>Status</th><th>Volunteers</th><th>Actions</th></tr></thead><tbody>';

    if (shifts.length === 0) {
      html += '<tr><td colspan="8" class="empty-state">No shifts yet. Click "Add Shift" to create one.</td></tr>';
    } else {
      shifts.forEach(s => {
        const st = shiftStatus(s);
        const cls = st === 'filled' ? 'filled' : st === 'vacant' ? 'vacant' : 'understaffed';
        const label = st === 'filled' ? 'Filled' : st === 'vacant' ? 'Vacant' : 'Understaffed';
        const vols = s.volunteers.length ? s.volunteers.map(v =>
          '<span class="vol-chip ' + (v.checkedIn ? 'checked' : '') + '">' +
          '<span class="dot"></span>' + escapeHtml(v.name) + (v.checkedIn ? ' ✅' : '') + '</span>').join(' ') :
          '<span class="small">—</span>';
        html += '<tr>' +
          '<td><strong>' + escapeHtml(s.role) + '</strong></td>' +
          '<td>' + fmtDate(s.date) + '</td>' +
          '<td>' + fmtTime(s.startTime) + ' – ' + fmtTime(s.endTime) + '</td>' +
          '<td class="small">' + escapeHtml(s.location) + '</td>' +
          '<td>' + s.volunteers.length + ' / ' + s.required + '</td>' +
          '<td><span class="status ' + cls + '">' + label + '</span></td>' +
          '<td>' + vols + '</td>' +
          '<td><button class="btn btn-danger btn-sm" onclick="appDeleteShift(\'' + s.id + '\')">Delete</button></td>' +
          '</tr>';
      });
    }
    html += '</tbody></table>';
    wrap.innerHTML = html;
  }

  window.appDeleteShift = function (id) {
    if (!confirm('Delete this shift? Volunteers signed up will be removed.')) return;
    shifts = shifts.filter(s => s.id !== id);
    save();
    renderShifts();
    renderDashboard();
    renderSignup();
    renderCheckIn();
  };

  /* Add shift modal */
  const addShiftModal = document.getElementById('addShiftModal');
  const shiftBackdrop = document.getElementById('shiftBackdrop');
  const openAddShift = document.getElementById('openAddShift');
  const closeShift = document.getElementById('closeShift');
  const cancelShift = document.getElementById('cancelShift');
  const addShiftForm = document.getElementById('addShiftForm');

  function openModal() { addShiftModal.style.display = 'block'; }
  function closeModal() { addShiftModal.style.display = 'none'; addShiftForm.reset(); }

  openAddShift.addEventListener('click', openModal);
  closeShift.addEventListener('click', closeModal);
  cancelShift.addEventListener('click', closeModal);
  shiftBackdrop.addEventListener('click', closeModal);

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
      alert('Please fill in all fields.');
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
    document.getElementById('signupMsg').innerHTML = '';
  }

  const signupForm = document.getElementById('signupForm');
  const signupMsg = document.getElementById('signupMsg');
  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = new FormData(signupForm);
    const name = form.get('name').trim();
    const email = form.get('email').trim();
    const shiftId = form.get('shiftId');

    if (!name || !email || !shiftId) {
      showMsg(signupMsg, 'Please fill in all fields.', 'err'); return;
    }

    const shift = shifts.find(s => s.id === shiftId);
    if (!shift) { showMsg(signupMsg, 'Shift not found.', 'err'); return; }
    if (shift.volunteers.length >= shift.required) {
      showMsg(signupMsg, 'This shift is already full.', 'err'); renderSignup(); return;
    }
    if (shift.volunteers.some(v => v.email.toLowerCase() === email.toLowerCase())) {
      showMsg(signupMsg, email + ' is already signed up for this shift.', 'err'); return;
    }

    shift.volunteers.push({ id: 'v' + Date.now(), name, email, checkedIn: false, checkedInAt: null });
    save();
    signupForm.reset();
    renderSignup();
    showMsg(signupMsg, '✅ ' + escapeHtml(name) + ' signed up for "' + escapeHtml(shift.role) + '".', 'ok');
    renderDashboard();
    renderShifts();
    renderCheckIn();
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
    document.getElementById('checkinMsg').innerHTML = '';
  }

  const checkinShiftSelect = document.getElementById('checkinShiftSelect');
  const checkinList = document.getElementById('checkinList');
  const checkinMsg = document.getElementById('checkinMsg');

  checkinShiftSelect.addEventListener('change', () => {
    const id = checkinShiftSelect.value;
    if (!id) { checkinList.innerHTML = ''; return; }
    const shift = shifts.find(s => s.id === id);
    if (!shift) return;

    let html = '<table><thead><tr>' +
      '<th>Volunteer</th><th>Email</th><th>Status</th><th>Action</th></tr></thead><tbody>';
    let anyPending = false;
    shift.volunteers.forEach(v => {
      anyPending = anyPending || !v.checkedIn;
      html += '<tr>' +
        '<td><strong>' + escapeHtml(v.name) + '</strong></td>' +
        '<td class="small">' + escapeHtml(v.email) + '</td>' +
        '<td><span class="status ' + (v.checkedIn ? 'checked' : 'pending') + '">' +
        (v.checkedIn ? '✅ Checked In' : '⏳ Pending') + '</span></td>' +
        '<td>' +
        (!v.checkedIn
          ? '<button class="btn btn-primary btn-sm" onclick="appCheckIn(\'' + id + '\', \'' + v.id + '\')">Check In</button>'
          : '<span class="small">—</span>') +
        '</td>' +
        '</tr>';
    });
    html += '</tbody></table>';
    checkinList.innerHTML = html;
    if (!anyPending) {
      checkinMsg.innerHTML = '<div class="msg ok">All volunteers for this shift are checked in.</div>';
    } else {
      checkinMsg.innerHTML = '';
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
    showMsg(checkinMsg, '✅ ' + escapeHtml(v.name) + ' checked in.', 'ok');
  };

  /* ---------- Data & Reset ---------- */
  function showMsg(el, text, type) {
    el.innerHTML = '<div class="msg ' + type + '">' + text + '</div>';
    setTimeout(() => { el.innerHTML = ''; }, 5000);
  }

  document.getElementById('btnSeed').addEventListener('click', () => {
    shifts = JSON.parse(JSON.stringify(SEED_SHIFTS));
    save();
    renderDashboard(); renderShifts(); renderSignup(); renderCheckIn();
    const m = document.getElementById('settingsMsg');
    m.className = 'alert okbg'; m.style.display = 'block';
    m.textContent = 'Demo data seeded.';
    setTimeout(() => { m.style.display = 'none'; }, 3000);
  });

  document.getElementById('btnReset').addEventListener('click', () => {
    if (!confirm('Reset ALL data? This cannot be undone.')) return;
    shifts = [];
    save();
    renderDashboard(); renderShifts(); renderSignup(); renderCheckIn();
    const m = document.getElementById('settingsMsg');
    m.className = 'alert dangerbg'; m.style.display = 'block';
    m.textContent = 'All data reset.';
  });

  document.getElementById('btnExport').addEventListener('click', () => {
    const data = JSON.stringify(shifts, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'volunteerhub-data.json'; a.click();
    URL.revokeObjectURL(url);
  });

  /* ---------- Boot ---------- */
  load();
  showView('dashboard');
})();
