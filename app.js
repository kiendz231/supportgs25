// ===== APP.JS — GS25 Staff Hub =====
let deferredInstallPrompt = null;

// ===== UTILITY =====
function $(sel) { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }
function formatVND(n) { return Number(n).toLocaleString('vi-VN') + ' ₫'; }

function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function showToast(msg, type = 'success') {
  const c = $('#toast-container');
  if (!c) return;
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 2500);
}
window.showToast = showToast;

window.showConfirm = function (message) {
  return new Promise(resolve => {
    const modal = document.getElementById('confirm-modal');
    const msgEl = document.getElementById('confirm-message');
    if (!modal || !msgEl) { resolve(window.confirm(message)); return; }
    msgEl.textContent = message;
    modal.classList.remove('hidden');

    const btnOk = document.getElementById('confirm-ok');
    const btnCancel = document.getElementById('confirm-cancel');

    const done = (result) => {
      modal.classList.add('hidden');
      btnOk.removeEventListener('click', onOk);
      btnCancel.removeEventListener('click', onCancel);
      resolve(result);
    };
    const onOk = () => done(true);
    const onCancel = () => done(false);
    btnOk.addEventListener('click', onOk);
    btnCancel.addEventListener('click', onCancel);
  });
};

// ===== CLOCK =====
function getShiftName() {
  const h = new Date().getHours();
  if (h >= 6 && h < 14) return 'morning';
  if (h >= 14 && h < 22) return 'afternoon';
  return 'night';
}

function getShiftLabel(s) {
  return {
    morning: '🌅 Ca Sáng (6:00-14:00)',
    afternoon: '☀️ Ca Chiều (14:00-22:00)',
    night: '🌙 Ca Tối (22:00-6:00)'
  }[s] || '--';
}

function updateClock() {
  const now = new Date();
  const clock = $('#live-clock');
  if (clock) clock.textContent = now.toLocaleTimeString('vi-VN');

  const dateDisp = $('#date-display');
  if (dateDisp) dateDisp.textContent = now.toLocaleDateString('vi-VN', {
    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric'
  });

  const curShift = $('#current-shift');
  if (curShift) curShift.textContent = getShiftLabel(getShiftName());

  updateShiftRemaining();
}

// ===== LIVE WEATHER =====
async function updateLiveWeather() {
  const tempEl = document.getElementById('weather-temp');
  const descEl = document.getElementById('weather-desc');
  const iconEl = document.getElementById('weather-icon');

  if (!tempEl || !descEl || !iconEl) return;

  try {
    const lat = 10.762622;
    const lon = 106.660172;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('API response not ok');
    
    const data = await res.json();
    const temp = Math.round(data.current.temperature_2m);
    const code = data.current.weather_code;

    const weatherMap = {
      0: { icon: '☀️', desc: 'Trời quang đãng' },
      1: { icon: '🌤️', desc: 'Ít mây' },
      2: { icon: '⛅', desc: 'Trời có mây' },
      3: { icon: '☁️', desc: 'Trời nhiều mây' },
      45: { icon: '🌫️', desc: 'Có sương mù' },
      48: { icon: '🌫️', desc: 'Có sương mù' },
      51: { icon: '🌧️', desc: 'Mưa phùn nhẹ' },
      53: { icon: '🌧️', desc: 'Mưa phùn vừa' },
      55: { icon: '🌧️', desc: 'Mưa phùn' },
      61: { icon: '🌧️', desc: 'Mưa nhẹ' },
      63: { icon: '🌧️', desc: 'Mưa vừa' },
      65: { icon: '🌧️', desc: 'Mưa to' },
      71: { icon: '❄️', desc: 'Tuyết rơi nhẹ' },
      73: { icon: '❄️', desc: 'Tuyết rơi vừa' },
      75: { icon: '❄️', desc: 'Tuyết rơi to' },
      80: { icon: '🌦️', desc: 'Mưa rào nhẹ' },
      81: { icon: '🌦️', desc: 'Mưa rào vừa' },
      82: { icon: '🌦️', desc: 'Mưa rào to' },
      95: { icon: '⛈️', desc: 'Trời giông bão' },
      96: { icon: '⛈️', desc: 'Giông kèm mưa đá' },
      99: { icon: '⛈️', desc: 'Giông bão lớn' }
    };

    const condition = weatherMap[code] || { icon: '⛅', desc: 'Trời có mây' };

    tempEl.textContent = `${temp}°C • TP.HCM`;
    descEl.textContent = condition.desc;
    iconEl.textContent = condition.icon;
  } catch (error) {
    console.warn('Weather load failed', error);
    // Dynamic real-world default values close to modern HCMC temperature
    tempEl.textContent = '34°C • TP.HCM';
    descEl.textContent = 'Trời có mây';
    iconEl.textContent = '⛅';
  }
}
window.updateLiveWeather = updateLiveWeather;

function updateShiftRemaining() {
  const now = new Date();
  const h = now.getHours(), m = now.getMinutes();
  let endH = h >= 6 && h < 14 ? 14 : (h >= 14 && h < 22 ? 22 : (h >= 22 ? 30 : 6));
  let totalMin = (endH - h) * 60 - m;
  if (totalMin < 0) totalMin += 24 * 60;
  const rh = Math.floor(totalMin / 60), rm = totalMin % 60;
  const el = $('#stat-shift-time');
  if (el) el.textContent = `${rh}h ${String(rm).padStart(2, '0')}m`;
}

// ===== PAYDAY COUNTDOWN & STREAK =====
async function calculateStreak(user) {
  const now = new Date();
  const todayKey = formatDateKey(now);
  
  const startDate = new Date();
  startDate.setDate(now.getDate() - 30);
  const startDateKey = formatDateKey(startDate);

  let dynShifts = {};
  if (window.FireDB) {
    try {
      dynShifts = await FireDB.loadDailyRange(startDateKey, todayKey);
    } catch (e) {
      console.warn('Streak load error', e);
    }
  }

  let totalShifts = 0;
  const datesList = [];
  for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
    datesList.push(formatDateKey(new Date(d)));
  }

  datesList.forEach(dk => {
    let shift = '';
    if (dynShifts[dk] && dynShifts[dk][user.id]) {
      shift = dynShifts[dk][user.id];
    } else if (typeof SCHEDULE_DAILY !== 'undefined' && SCHEDULE_DAILY[dk] && SCHEDULE_DAILY[dk][user.id]) {
      shift = SCHEDULE_DAILY[dk][user.id];
    }
    if (shift && shift !== 'OFF' && shift !== '') {
      totalShifts++;
    }
  });

  const lookbackDates = [...datesList].reverse();
  let currentStreak = 0;
  const consecutiveOffLimit = 2; 
  let consecutiveOffCount = 0;

  for (let i = 0; i < lookbackDates.length; i++) {
    const dk = lookbackDates[i];
    let shift = '';
    if (dynShifts[dk] && dynShifts[dk][user.id]) {
      shift = dynShifts[dk][user.id];
    } else if (typeof SCHEDULE_DAILY !== 'undefined' && SCHEDULE_DAILY[dk] && SCHEDULE_DAILY[dk][user.id]) {
      shift = SCHEDULE_DAILY[dk][user.id];
    }

    const isActiveShift = shift && shift !== 'OFF' && shift !== '';

    if (isActiveShift) {
      currentStreak++;
      consecutiveOffCount = 0; 
    } else {
      if (dk === todayKey) {
        continue;
      }
      consecutiveOffCount++;
      if (consecutiveOffCount > consecutiveOffLimit) {
        break;
      }
    }
  }

  let maxStreak = 0;
  let tempStreak = 0;
  let tempOffCount = 0;
  datesList.forEach(dk => {
    let shift = '';
    if (dynShifts[dk] && dynShifts[dk][user.id]) {
      shift = dynShifts[dk][user.id];
    } else if (typeof SCHEDULE_DAILY !== 'undefined' && SCHEDULE_DAILY[dk] && SCHEDULE_DAILY[dk][user.id]) {
      shift = SCHEDULE_DAILY[dk][user.id];
    }
    const isActiveShift = shift && shift !== 'OFF' && shift !== '';

    if (isActiveShift) {
      tempStreak++;
      tempOffCount = 0;
      if (tempStreak > maxStreak) maxStreak = tempStreak;
    } else {
      tempOffCount++;
      if (tempOffCount > consecutiveOffLimit) {
        tempStreak = 0;
      }
    }
  });

  if (currentStreak > maxStreak) maxStreak = currentStreak;

  const streakCountdown = document.getElementById('streak-countdown');
  if (streakCountdown) {
    streakCountdown.textContent = `${currentStreak} ngày`;
  }

  window.currentStreakData = {
    current: currentStreak,
    record: maxStreak,
    total: totalShifts
  };
}

function updatePersonalWidgets() {
  const user = window.currentUserProfile;
  const shiftNow = getShiftName();
  const greeting = shiftNow === 'morning' ? 'Chào buổi sáng'
    : shiftNow === 'afternoon' ? 'Chào buổi chiều'
    : 'Chào ca tối';
  const greetEl = $('#personal-greeting');
  if (greetEl) greetEl.textContent = `${greeting}, ${user ? user.name.split(' ').pop() : '--'}!`;

  const now = new Date();
  const periodEndMonth = now.getDate() >= 26 ? now.getMonth() + 1 : now.getMonth();
  const payday = new Date(now.getFullYear(), periodEndMonth + 1, 1);
  const diff = Math.ceil((payday - now) / 86400000);
  const paydayEl = $('#payday-countdown');
  if (paydayEl) paydayEl.textContent = diff <= 0 ? 'Hôm nay!' : `Còn ${diff} ngày`;

  if (user) {
    calculateStreak(user);
  }
}
window.updatePersonalWidgets = updatePersonalWidgets;

// ===== NAVIGATION =====
const PAGE_TITLES = {
  dashboard: 'Tổng quan',
  schedule: 'Lịch Làm Việc',
  salary: 'Thu Nhập',
  tools: 'Kiểm Date',
  profile: 'Hồ Sơ',
  admin: 'Admin Panel'
};

function navigateTo(page) {
  if (page === 'admin') {
    const user = window.currentUserProfile;
    const allowed = user && (user.role === 'Admin' || user.role === 'Quản lý' ||
      (user.position && (user.position.includes('trưởng') || user.position.includes('phó'))));
    if (!allowed) {
      showToast('Bạn không có quyền truy cập Admin Panel!', 'error');
      return;
    }
  }

  // Deactivate all pages and nav items
  $$('.page, #admin-dashboard').forEach(p => p.classList.remove('active'));
  $$('.nav-item, .bn-item').forEach(n => n.classList.remove('active'));

  // Activate the selected page
  const pageEl = page === 'admin'
    ? $('#admin-dashboard')
    : $(`#page-${page}`);
  if (pageEl) pageEl.classList.add('active');

  // Activate nav items
  $$(`[data-page="${page}"]`).forEach(el => el.classList.add('active'));

  // Update bottom nav sliding indicator
  const bottomNav = $('#bottom-nav');
  if (bottomNav) {
    const activeItem = bottomNav.querySelector(`[data-page="${page}"]`);
    if (activeItem) {
      const items = Array.from(bottomNav.querySelectorAll('.bn-item'));
      const index = items.indexOf(activeItem);
      if (index !== -1) {
        bottomNav.style.setProperty('--active-index', index);
      }
    }
  }

  // Update title
  const titleEl = $('#page-title');
  if (titleEl) titleEl.textContent = PAGE_TITLES[page] || page;

  // Page-specific actions
  if (page === 'schedule') renderSchedule();
  if (page === 'salary') { if (typeof window.renderSalary === 'function') window.renderSalary(); }
  if (page === 'admin') {
    if (typeof window.refreshAdminEmployees === 'function') window.refreshAdminEmployees();
  }

  // Close mobile sidebar
  $('#sidebar')?.classList.remove('open');
  $('#sidebar-overlay')?.classList.remove('show');
}
window.navigateTo = navigateTo;

// ===== SIDEBAR =====
function setupSidebar() {
  const toggle = $('#menu-toggle');
  const sidebar = $('#sidebar');
  const overlay = $('#sidebar-overlay');
  const closeBtn = $('#sidebar-close');

  toggle?.addEventListener('click', () => {
    sidebar?.classList.toggle('open');
    overlay?.classList.toggle('show');
  });
  overlay?.addEventListener('click', () => {
    sidebar?.classList.remove('open');
    overlay?.classList.remove('show');
  });
  closeBtn?.addEventListener('click', () => {
    sidebar?.classList.remove('open');
    overlay?.classList.remove('show');
  });
}

// ===== NAV EVENTS =====
function setupNav() {
  $$('.nav-item[data-page]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(btn.dataset.page);
    });
  });
  $$('.bn-item[data-page]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(btn.dataset.page);
    });
  });

  // Enable drag-to-switch tabs (Swipe interaction)
  const bottomNav = $('#bottom-nav');
  if (bottomNav) {
    let isDragging = false;
    
    // Mouse support
    bottomNav.addEventListener('mousedown', () => isDragging = true);
    window.addEventListener('mouseup', () => isDragging = false);
    bottomNav.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const bnItem = el?.closest('.bn-item');
      if (bnItem && bnItem.dataset.page && !bnItem.classList.contains('active')) {
        navigateTo(bnItem.dataset.page);
      }
    });

    // Touch support (Mobile)
    bottomNav.addEventListener('touchmove', (e) => {
      e.preventDefault(); // Prevent scrolling while swiping tabs
      const touch = e.touches[0];
      if (!touch) return;
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      const bnItem = el?.closest('.bn-item');
      if (bnItem && bnItem.dataset.page && !bnItem.classList.contains('active')) {
        navigateTo(bnItem.dataset.page);
      }
    }, { passive: false });
  }
}

// ===== SCHEDULE =====
function getShiftClass(shift) {
  if (!shift) return 'sch-empty';
  const s = shift.toLowerCase().trim();
  if (s === 'off') return 'sch-off';
  if (s === 'hc' || s.startsWith('hc')) return 'sch-hc';
  if (s === 'ca 1' || s === '1' || s.includes('6h')) return 'sch-morning';
  if (s === 'ca 2' || s === '2' || s.includes('10h') || s.includes('14h')) return 'sch-afternoon';
  if (s.includes('18h') || s.includes('22h')) return 'sch-evening';
  if (s === 'ca 3' || s === '3') return 'sch-support';
  return 'sch-default';
}

let currentWeekOffset = 0;

window.renderSchedule = async function renderSchedule() {
  const container = $('#schedule-container');
  if (!container) return;
  if (!window.SCHEDULE || !SCHEDULE.employees) {
    container.innerHTML = '<p style="color:var(--text3);text-align:center;padding:40px">Không có dữ liệu lịch</p>';
    return;
  }

  const now = new Date();
  const day = now.getDay();
  const mondayDiff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayDiff + currentWeekOffset * 7);

  const KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const LABELS = ['T.2', 'T.3', 'T.4', 'T.5', 'T.6', 'T.7', 'CN'];
  const todayKey = formatDateKey(new Date());

  const weekDays = LABELS.map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      key: KEYS[i],
      label,
      date: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
      fullDate: formatDateKey(d)
    };
  });

  const weekLabel = `${weekDays[0].date} – ${weekDays[6].date}/${monday.getFullYear()}`;

  // Load Firebase dynamic shifts for all 7 days
  let dynShifts = {};
  if (window.FireDB) {
    try {
      const results = await Promise.all(weekDays.map(wd => FireDB.loadDailyShifts(wd.fullDate)));
      weekDays.forEach((wd, i) => { if (results[i]) dynShifts[wd.fullDate] = results[i]; });
    } catch (e) { console.warn('Schedule load error', e); }
  }

  const user = window.currentUserProfile;
  const legendItems = [
    { cls: 'sch-hc', label: 'HC' },
    { cls: 'sch-morning', label: 'Sáng' },
    { cls: 'sch-afternoon', label: 'Chiều' },
    { cls: 'sch-evening', label: 'Tối' },
    { cls: 'sch-support', label: 'Ca 3' },
    { cls: 'sch-off', label: 'OFF' },
  ];

  container.innerHTML = `
    <div class="sch-top-bar">
      <div class="sch-week-label">
        <span class="sch-cal-icon">📅</span>
        <span>Tuần ${weekLabel}</span>
        ${currentWeekOffset !== 0 ? `<span class="sch-offset-tag">${currentWeekOffset > 0 ? 'Sắp tới' : 'Đã qua'}</span>` : ''}
      </div>
      <div class="sch-legend">
        ${legendItems.map(l => `<span class="sch-badge ${l.cls}">${l.label}</span>`).join('')}
      </div>
    </div>
    <div class="schedule-table-wrap">
      <table class="schedule-table">
        <thead>
          <tr>
            <th class="sch-emp-col">Nhân viên</th>
            ${weekDays.map(d => `
              <th class="${d.fullDate === todayKey ? 'sch-today-head' : ''}">
                <span class="sch-day-label">${d.label}</span>
                <span class="sch-date-label">${d.date}</span>
              </th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${SCHEDULE.employees.map(emp => {
            const isMe = user && (emp.id === user.id || emp.name === user.name ||
              emp.name.split(' ').pop() === (user.name || '').split(' ').pop());
            const cells = weekDays.map(d => {
              let shift = '';
              // Priority: Firebase dynamic > SCHEDULE_DAILY static > weekly default
              if (dynShifts[d.fullDate] && dynShifts[d.fullDate][emp.id]) {
                shift = dynShifts[d.fullDate][emp.id];
              } else if (typeof SCHEDULE_DAILY !== 'undefined' && SCHEDULE_DAILY[d.fullDate] && SCHEDULE_DAILY[d.fullDate][emp.id]) {
                shift = SCHEDULE_DAILY[d.fullDate][emp.id];
              } else {
                shift = (emp.shifts && emp.shifts[d.key]) ? emp.shifts[d.key].trim() : '';
              }
              const cls = getShiftClass(shift);
              return `<td class="${d.fullDate === todayKey ? 'sch-today-col' : ''}">
                ${shift ? `<span class="sch-badge ${cls}">${shift}</span>` : '<span class="sch-dash">—</span>'}
              </td>`;
            }).join('');
            return `
              <tr class="${isMe ? 'sch-my-row' : ''}">
                <td class="sch-emp-name">
                  <span class="sch-emp-avatar${isMe ? ' sch-my-avatar' : ''}">${(emp.name.split(' ').pop() || '?')[0]}</span>
                  <span>${emp.name}</span>
                  ${isMe ? '<span class="sch-me-badge">Bạn</span>' : ''}
                </td>
                ${cells}
              </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
};

// ===== WEEK NAV =====
function setupWeekNav() {
  document.addEventListener('click', e => {
    if (e.target.closest('#btn-week-prev')) { currentWeekOffset--; renderSchedule(); }
    if (e.target.closest('#btn-week-next')) { currentWeekOffset++; renderSchedule(); }
    if (e.target.closest('#btn-week-today')) { currentWeekOffset = 0; renderSchedule(); }
  });
}

// ===== SHIFT REGISTRATION =====
function setupShiftRegistration() {
  $('#btn-open-register')?.addEventListener('click', () => {
    if (!window.currentUserProfile) { showToast('Vui lòng đăng nhập trước', 'error'); return; }
    openRegisterModal();
  });
  $('#register-modal-close')?.addEventListener('click', () => $('#register-modal').classList.add('hidden'));
  $('#register-modal-cancel')?.addEventListener('click', () => $('#register-modal').classList.add('hidden'));
  $('#btn-submit-registration')?.addEventListener('click', submitShiftRegistration);
}

function openRegisterModal() {
  const container = $('#registration-days-container');
  if (!container) return;
  const user = window.currentUserProfile;
  const isManager = user && (user.role === 'Admin' || user.role === 'Quản lý' ||
    (user.position && (user.position.includes('trưởng') || user.position.includes('phó'))));

  const now = new Date();
  const day = now.getDay();
  const mondayDiff = day === 0 ? -6 : 1 - day;
  const nextMon = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayDiff + 7);

  let opts = ['Ca 1', 'Ca 2', 'Ca 3', '6h-10h', '10h-14h', '14h-18h', '18h-22h'];
  if (isManager) opts.unshift('HC');
  opts.push('OFF');

  const DAY_LABELS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
  let html = '';
  for (let i = 0; i < 7; i++) {
    const d = new Date(nextMon);
    d.setDate(nextMon.getDate() + i);
    const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    const fullDate = formatDateKey(d);
    html += `
      <div class="reg-day-row" data-date="${fullDate}">
        <div class="reg-day-info">
          <span class="reg-day-label">${DAY_LABELS[i]}</span>
          <span class="reg-day-date">${dateStr}</span>
        </div>
        <div class="reg-shift-options">
          ${opts.map(opt => `
            <button class="reg-shift-btn${opt === 'OFF' ? ' active' : ''}"
              onclick="this.parentNode.querySelectorAll('button').forEach(b=>b.classList.remove('active'));this.classList.add('active')">
              ${opt}
            </button>`).join('')}
        </div>
      </div>`;
  }
  container.innerHTML = html;
  $('#register-modal').classList.remove('hidden');
}

async function submitShiftRegistration() {
  const user = window.currentUserProfile;
  if (!user) return;
  const btn = $('#btn-submit-registration');
  btn.disabled = true;
  btn.textContent = 'Đang gửi...';

  const shifts = {};
  $$('.reg-day-row').forEach(row => {
    const active = row.querySelector('.reg-shift-btn.active');
    if (active) shifts[row.dataset.date] = active.textContent.trim();
  });

  try {
    await db.collection('shift_requests').add({
      userId: user.id,
      userName: user.name,
      shifts,
      status: 'pending',
      createdAt: new Date().toISOString()
    });
    showToast('✅ Đã gửi đăng ký ca làm!');
    $('#register-modal').classList.add('hidden');
  } catch (err) {
    showToast('Lỗi khi gửi yêu cầu', 'error');
    console.error(err);
  }
  btn.disabled = false;
  btn.textContent = 'Gửi yêu cầu';
}

// ===== PWA =====
function setupPWA() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('service-worker.js')
        .then(reg => console.log('ServiceWorker registered:', reg.scope))
        .catch(err => console.log('ServiceWorker registration failed:', err));
    });
  }

  const installBtn = $('#btn-install-app');
  if (!installBtn) return;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredInstallPrompt = e;
    installBtn.classList.remove('hidden');
  });
  installBtn.addEventListener('click', async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    installBtn.classList.add('hidden');
  });
}

// ===== SALARY RATES (configurable) =====
const SALARY_RATES = {
  normal: 25500,       // Ca 1, Ca 2, HC, part-time: per hour
  night: 33150,        // Ca 3: per hour (+30%)
  holidayMultiplier: 3,
  holidayNightMultiplier: 3.9,
};

// ===== VIETNAMESE PUBLIC HOLIDAYS =====
// Ngày lễ chính thức hàng năm (MM-DD)
const VN_HOLIDAYS_ANNUAL = new Set([
  '01-01',  // Tết Dương lịch
  '04-30',  // Giải phóng miền Nam
  '05-01',  // Quốc tế Lao động
  '09-02',  // Quốc khánh
]);

// Ngày lễ có ngày thay đổi theo năm (YYYY-MM-DD) — chỉ ngày lễ chính thức, KHÔNG tính nghỉ bù
const VN_HOLIDAYS_SPECIFIC = new Set([
  // Tết Nguyên Đán Ất Tỵ 2025 (29/12 ÂL - 04/01 ÂL = 28/01 - 03/02/2025)
  '2025-01-28','2025-01-29','2025-01-30','2025-01-31',
  '2025-02-01','2025-02-02','2025-02-03',
  // Giỗ Tổ Hùng Vương 2025 (10/03 ÂL = 06/04/2025)
  '2025-04-06',

  // Tết Nguyên Đán Bính Ngọ 2026 (01/01 ÂL - 07/01 ÂL = 17/02 - 23/02/2026)
  '2026-02-17','2026-02-18','2026-02-19','2026-02-20',
  '2026-02-21','2026-02-22','2026-02-23',
  // Giỗ Tổ Hùng Vương 2026 (10/03 ÂL = 26/04/2026)
  '2026-04-26',
]);

function isHoliday(dateKey) {
  const mmdd = dateKey.slice(5); // 'YYYY-MM-DD' → 'MM-DD'
  return VN_HOLIDAYS_ANNUAL.has(mmdd) || VN_HOLIDAYS_SPECIFIC.has(dateKey);
}


// Hours per shift type
const SHIFT_HOURS = {
  'hc': 8, 'ca 1': 8, 'ca 2': 8, 'ca 3': 8,
  '6h-10h': 4, '10h-14h': 4, '14h-18h': 4, '18h-22h': 4,
};

function getShiftHours(shift) {
  if (!shift) return 0;
  const s = shift.toLowerCase().trim();
  if (s === 'off' || s === '') return 0;
  return SHIFT_HOURS[s] || 0;
}

function isNightShift(shift) {
  if (!shift) return false;
  const s = shift.toLowerCase().trim();
  // Only Ca 3 (22:00-06:00) gets night pay. 18h-22h is still Ca 2 range (base rate).
  return s === 'ca 3' || s === '3';
}

let _salaryCache = null;

window.invalidateSalaryCache = function () { _salaryCache = null; };

window.renderSalary = async function renderSalary() {
  const user = window.currentUserProfile;
  if (!user) return;

  // Pay period: 26th of prev month → 25th of current month
  const now = new Date();
  const periodStart = now.getDate() >= 26
    ? new Date(now.getFullYear(), now.getMonth(), 26)
    : new Date(now.getFullYear(), now.getMonth() - 1, 26);
  const periodEnd = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 25);

  const fmt = d => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
  const rangeEl = document.getElementById('salary-period-range');
  if (rangeEl) rangeEl.textContent = `${fmt(periodStart)} → ${fmt(periodEnd)}`;

  // Collect all dates up to today
  const allDates = [];
  for (let d = new Date(periodStart); d <= now && d <= periodEnd; d.setDate(d.getDate() + 1)) {
    allDates.push(formatDateKey(new Date(d)));
  }

  // Load Firebase shifts for the period
  let dynShifts = {};
  if (window.FireDB) {
    try {
      dynShifts = await FireDB.loadDailyRange(formatDateKey(periodStart), formatDateKey(now));
    } catch (e) { console.warn('Salary load error', e); }
  }

  const DAY_VI = ['CN', 'T.2', 'T.3', 'T.4', 'T.5', 'T.6', 'T.7'];
  const rates = SALARY_RATES;

  // Tally + build detail rows
  let baseHours = 0, nightHours = 0, holidayHours = 0, daysWorked = 0;
  let holidayDaysCount = 0;
  const detailRows = [];

  for (const dateKey of allDates) {
    // Resolve shift for this user
    let shift = '';
    if (dynShifts[dateKey] && dynShifts[dateKey][user.id]) {
      shift = dynShifts[dateKey][user.id];
    } else if (typeof SCHEDULE_DAILY !== 'undefined' && SCHEDULE_DAILY[dateKey] && SCHEDULE_DAILY[dateKey][user.id]) {
      shift = SCHEDULE_DAILY[dateKey][user.id];
    } else if (window.SCHEDULE && SCHEDULE.employees) {
      const emp = SCHEDULE.employees.find(e =>
        e.id === user.id || e.name === user.name ||
        (e.name || '').split(' ').pop() === (user.name || '').split(' ').pop()
      );
      if (emp) {
        const date = new Date(dateKey);
        const dayKeys = ['sun','mon','tue','wed','thu','fri','sat'];
        shift = (emp.shifts && emp.shifts[dayKeys[date.getDay()]]) || '';
      }
    }

    if (!shift || shift.toLowerCase() === 'off' || shift.trim() === '') continue;

    const hours = getShiftHours(shift);
    if (hours === 0) continue;

    daysWorked++;
    const holiday = isHoliday(dateKey);
    const night = isNightShift(shift);

    let typeLabel, typeClass, dayPay;
    if (holiday) {
      holidayHours += hours;
      holidayDaysCount++;
      typeLabel = '🎌 Ngày lễ';
      typeClass = 'sch-badge sch-hc';
      dayPay = hours * rates.normal * rates.holidayMultiplier;
    } else if (night) {
      nightHours += hours;
      typeLabel = '🌙 Ca đêm';
      typeClass = 'sch-badge sch-support';
      dayPay = hours * rates.night;
    } else {
      baseHours += hours;
      typeLabel = '☀️ Thường';
      typeClass = 'sch-badge sch-morning';
      dayPay = hours * rates.normal;
    }

    const d = new Date(dateKey);
    const shiftCls = `sch-badge ${getShiftClass(shift)}`;

    detailRows.push(`
      <tr>
        <td><b>${fmt(d)}/${d.getFullYear()}</b></td>
        <td style="color:var(--text2)">${DAY_VI[d.getDay()]}</td>
        <td><span class="${shiftCls}">${shift}</span></td>
        <td style="text-align:center">${hours}h</td>
        <td><span class="${typeClass}" style="font-size:.75rem">${typeLabel}</span></td>
        <td style="font-weight:600;color:var(--green)">${formatVND(dayPay)}</td>
      </tr>
    `);
  }

  // Summary totals — uses same accumulated hours as detail rows → always consistent
  const basePay = baseHours * rates.normal;
  const nightPay = nightHours * rates.night;
  const holidayPay = holidayHours * rates.normal * rates.holidayMultiplier;
  const totalPay = basePay + nightPay + holidayPay;
  const totalHours = baseHours + nightHours + holidayHours;

  const totalPeriodDays = Math.ceil((periodEnd - periodStart) / 86400000) + 1;
  const pct = Math.min(100, Math.round((daysWorked / totalPeriodDays) * 100));

  // Update summary DOM
  const daysWorkedEl = document.getElementById('salary-days-worked');
  if (daysWorkedEl) daysWorkedEl.textContent = daysWorked;

  const totalEl = document.getElementById('salary-total');
  if (totalEl) totalEl.textContent = formatVND(totalPay);

  const periodEl = document.getElementById('salary-period');
  if (periodEl) periodEl.textContent = `Tính đến ${fmt(now)}`;

  const pctEl = document.getElementById('salary-percent');
  if (pctEl) pctEl.textContent = pct + '%';

  const donut = document.getElementById('salary-donut-fill');
  if (donut) {
    const r = 52, circ = 2 * Math.PI * r;
    donut.style.strokeDasharray = circ;
    donut.style.strokeDashoffset = circ - (circ * pct / 100);
  }

  const baseEl = document.getElementById('salary-base');
  if (baseEl) baseEl.textContent = formatVND(basePay);
  const baseHEl = document.getElementById('salary-base-hours');
  if (baseHEl) baseHEl.textContent = `${baseHours} giờ × ${rates.normal.toLocaleString('vi-VN')} ₫/h`;

  const nightEl = document.getElementById('salary-night');
  if (nightEl) nightEl.textContent = formatVND(nightPay);
  const nightHEl = document.getElementById('salary-night-hours');
  if (nightHEl) nightHEl.textContent = `${nightHours} giờ × ${rates.night.toLocaleString('vi-VN')} ₫/h`;

  const holEl = document.getElementById('salary-holiday');
  if (holEl) holEl.textContent = formatVND(holidayPay);
  const holHEl = document.getElementById('salary-holiday-hours');
  if (holHEl) holHEl.textContent = `${holidayDaysCount} ngày lễ • ${holidayHours} giờ trong kỳ`;

  // Render detail table
  const tbody = document.getElementById('salary-detail-body');
  if (tbody) {
    if (detailRows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text3)">Chưa có ca nào được ghi nhận trong kỳ này</td></tr>`;
    } else {
      // Add total row at the bottom
      tbody.innerHTML = detailRows.join('') + `
        <tr style="border-top:2px solid var(--border);background:rgba(255,255,255,.03)">
          <td colspan="3" style="font-weight:700">Tổng cộng</td>
          <td style="font-weight:700;text-align:center">${totalHours}h</td>
          <td style="font-weight:700">${daysWorked} ngày</td>
          <td style="font-weight:800;color:var(--green);font-size:1.05rem">${formatVND(totalPay)}</td>
        </tr>`;
    }
  }
};


// ===== TOOL: KIỂM DATE =====
function setupCheckDateTool() {
  const btnCalc = document.getElementById('btn-calc-date');
  if (!btnCalc) return;

  // Set default pre-fills (HSD = Today, NSX = Yesterday)
  const toolNsx = document.getElementById('tool-nsx');
  const toolHsd = document.getElementById('tool-hsd');
  if (toolNsx && toolHsd) {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const fmt = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${dd}`;
    };

    toolHsd.value = fmt(today);
    toolNsx.value = fmt(yesterday);
  }

  btnCalc.addEventListener('click', () => {
    const nsx = document.getElementById('tool-nsx').value;
    const hsd = document.getElementById('tool-hsd').value;
    if (!nsx || !hsd) {
      window.showToast('Vui lòng nhập đầy đủ NSX và HSD!', 'error');
      return;
    }

    const dateNsx = new Date(nsx);
    const dateHsd = new Date(hsd);
    
    if (dateHsd <= dateNsx) {
      window.showToast('HSD phải lớn hơn NSX!', 'error');
      return;
    }

    const diffMs = dateHsd - dateNsx;
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    
    let shelfLifeStr = `${diffDays} ngày`;
    let ruleDaysToSubtract = 0;
    let ruleStr = "";

    // Apply rule matrices
    if (diffDays <= 7) {
      ruleStr = "Hủy trước 2 giờ (ngày HSD)";
      ruleDaysToSubtract = 0; 
    } else if (diffDays < 30) {
      ruleStr = "Hủy trước 1 ngày";
      ruleDaysToSubtract = 1;
    } else if (diffDays < 180) { // < 6 months
      ruleStr = "Hủy trước 3 ngày";
      ruleDaysToSubtract = 3;
    } else if (diffDays < 365) { // < 1 year
      ruleStr = "Hủy trước 5 ngày";
      ruleDaysToSubtract = 5;
    } else if (diffDays < 1095) { // < 3 years
      ruleStr = "Hủy trước 7 ngày";
      ruleDaysToSubtract = 7;
    } else { // >= 3 years
      ruleStr = "Hủy trước 1 tháng (30 ngày)";
      ruleDaysToSubtract = 30;
    }

    if (diffDays >= 30 && diffDays < 365) {
      shelfLifeStr = `${Math.round(diffDays / 30 * 10)/10} tháng (${diffDays} ngày)`;
    } else if (diffDays >= 365) {
      shelfLifeStr = `${Math.round(diffDays / 365.25 * 10)/10} năm (${diffDays} ngày)`;
    }

    const deadline = new Date(dateHsd);
    deadline.setDate(deadline.getDate() - ruleDaysToSubtract);

    // Normalize today for accurate date comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineCheck = new Date(deadline);
    deadlineCheck.setHours(0, 0, 0, 0);

    const msToDeadline = deadlineCheck - today;
    const daysUntilDeadline = Math.ceil(msToDeadline / (1000 * 60 * 60 * 24));

    // Dynamic warning state styling
    const statusBadge = document.getElementById('res-status-badge');
    const highlightContainer = document.getElementById('res-highlight-container');
    const highlightIcon = document.getElementById('res-highlight-icon');
    const highlightLabel = document.getElementById('res-highlight-label');
    const highlightValue = document.getElementById('res-deadline');

    // Reset styles
    statusBadge.className = 'status-indicator';
    highlightContainer.className = 'result-highlight-card';
    highlightIcon.className = 'highlight-icon-wrap';
    highlightLabel.className = 'highlight-label';
    highlightValue.className = 'highlight-value';

    // Format deadline
    const formatD = (d) => {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yy = d.getFullYear();
      return `${dd}/${mm}/${yy}`;
    };

    const deadlineFormatted = diffDays <= 7 ? `22:00, ngày ${formatD(deadline)}` : `Ngày ${formatD(deadline)}`;

    if (daysUntilDeadline < 0) {
      // Past deadline / EXPIRED
      statusBadge.classList.add('status-danger');
      statusBadge.textContent = 'Hủy ngay lập tức 🚨';
      
      highlightContainer.classList.add('danger-border');
      highlightLabel.textContent = 'ĐÃ QUÁ HẠN CHÓT TRƯNG BÀY!';
      highlightValue.textContent = deadlineFormatted + ` (Quá hạn ${Math.abs(daysUntilDeadline)} ngày)`;
    } else if (daysUntilDeadline === 0) {
      // Today is the deadline day!
      statusBadge.classList.add('status-danger');
      statusBadge.textContent = 'Hủy trong hôm nay ⏰';

      highlightContainer.classList.add('danger-border');
      highlightLabel.textContent = 'HẠN CHÓT HÔM NAY - PHẢI GỠ KỆ!';
      highlightValue.textContent = deadlineFormatted;
    } else if (daysUntilDeadline <= 2) {
      // Near deadline (1-2 days left)
      statusBadge.classList.add('status-warning');
      statusBadge.textContent = 'Sắp đến hạn hủy ⚠️';

      highlightContainer.classList.add('warning-border');
      highlightIcon.classList.add('warning-bg');
      highlightLabel.classList.add('warning-color');
      highlightLabel.textContent = `Sắp hủy (Còn ${daysUntilDeadline} ngày)`;
      highlightValue.classList.add('warning-color');
      highlightValue.textContent = deadlineFormatted;
    } else {
      // Safe state
      statusBadge.classList.add('status-safe');
      statusBadge.textContent = 'An toàn ✅';

      highlightContainer.classList.add('safe-border');
      highlightIcon.classList.add('safe-bg');
      highlightIcon.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
      highlightLabel.classList.add('safe-color');
      highlightLabel.textContent = `Còn hạn bày bán (Còn ${daysUntilDeadline} ngày)`;
      highlightValue.classList.add('safe-color');
      highlightValue.textContent = deadlineFormatted;
    }

    // Shelf life progress bar calculations
    const elapsedMs = today - dateNsx;
    let consumedPercent = 0;
    if (diffMs > 0) {
      consumedPercent = Math.min(100, Math.max(0, Math.round((elapsedMs / diffMs) * 100)));
    }
    
    const progressFill = document.getElementById('res-progress-fill');
    const progressPercent = document.getElementById('res-progress-percent');
    
    progressPercent.textContent = `${consumedPercent}%`;
    progressFill.style.width = `${consumedPercent}%`;

    // Style progress bar based on lifecycle consumption
    if (consumedPercent >= 90) {
      progressFill.style.background = 'var(--red)';
    } else if (consumedPercent >= 75) {
      progressFill.style.background = 'var(--orange)';
    } else {
      progressFill.style.background = 'linear-gradient(90deg, var(--green), var(--purple))';
    }

    document.getElementById('res-shelf-life').textContent = shelfLifeStr;
    document.getElementById('res-rule').textContent = ruleStr;

    // Show result board
    document.getElementById('tool-date-result').classList.remove('hidden');
  });
}

function setupStreakModal() {
  const trigger = document.getElementById('widget-streak-trigger');
  const modal = document.getElementById('streak-modal');
  const closeBtn = document.getElementById('streak-modal-close');
  const closeBtn2 = document.getElementById('streak-modal-close-btn');
  const backdrop = document.getElementById('streak-modal-backdrop');

  if (!trigger || !modal) return;

  const showModal = () => {
    const data = window.currentStreakData || { current: 0, record: 0, total: 0 };
    
    document.getElementById('streak-modal-count').textContent = `${data.current} ngày`;
    document.getElementById('streak-record').textContent = `${data.record} ngày`;
    document.getElementById('streak-total-shifts').textContent = `${data.total} ca`;

    const badgeLevel = document.getElementById('streak-badge-level');
    const badgeDesc = document.getElementById('streak-badge-desc');
    const xpLabel = document.getElementById('streak-xp-label');
    const xpPercent = document.getElementById('streak-xp-percent');
    const xpFill = document.getElementById('streak-xp-fill');

    let badgeName = "Tân Binh Chăm Chỉ 🥚";
    let desc = "Bạn đang bắt đầu hành trình! Hãy duy trì chuỗi đi làm liên tục để mở khóa phần thưởng.";
    let nextGoal = 3;
    let nextLevel = "Chiến Binh Ca Kíp";
    
    if (data.current >= 8) {
      badgeName = "Huyền Thoại GS25 👑";
      desc = "Thật kinh ngạc! Bạn là tấm gương sáng nhất của cửa hàng về sự kiên trì và kỷ luật.";
      nextGoal = 10;
      nextLevel = "Đỉnh Cao Kỷ Lục";
    } else if (data.current >= 5) {
      badgeName = "Siêu Sao Đi Làm 🌟";
      desc = "Hiệu suất làm việc tuyệt vời! Bạn đang cống hiến hết mình và được đồng nghiệp nể phục.";
      nextGoal = 8;
      nextLevel = "Huyền Thoại GS25";
    } else if (data.current >= 3) {
      badgeName = "Chiến Binh Ca Kíp ⚡";
      desc = "Tuyệt vời! Bạn đang tạo ra một thói quen làm việc vô cùng chuyên nghiệp và đều đặn.";
      nextGoal = 5;
      nextLevel = "Siêu Sao Đi Làm";
    }

    badgeLevel.textContent = badgeName;
    badgeDesc.textContent = desc;

    let pct = Math.round((data.current / nextGoal) * 100);
    if (data.current >= 8) pct = 100;
    
    xpPercent.textContent = `${pct}%`;
    xpFill.style.width = `${pct}%`;
    
    if (data.current >= 8) {
      xpLabel.textContent = "Bạn đã đạt cấp độ tối đa! 👑";
    } else {
      xpLabel.textContent = `Còn ${nextGoal - data.current} ca nữa để đạt cấp [${nextLevel}]`;
    }

    modal.classList.remove('hidden');
  };

  const hideModal = () => {
    modal.classList.add('hidden');
  };

  trigger.addEventListener('click', showModal);
  closeBtn.addEventListener('click', hideModal);
  closeBtn2.addEventListener('click', hideModal);
  backdrop.addEventListener('click', hideModal);
}

// ===== PROFILE PAGE CONFIG =====
const THEME_COLORS = {
  gs25: { primary: '#3b82f6', secondary: '#2563eb', glow: 'rgba(59,130,246,.15)' },
  purple: { primary: '#a855f7', secondary: '#7e22ce', glow: 'rgba(168,85,247,.15)' },
  emerald: { primary: '#10b981', secondary: '#047857', glow: 'rgba(16,185,129,.15)' },
  orange: { primary: '#f97316', secondary: '#c2410c', glow: 'rgba(249,115,22,.15)' },
  pink: { primary: '#ec4899', secondary: '#be185d', glow: 'rgba(236,72,153,.15)' }
};

function applyAppTheme(themeName) {
  const theme = THEME_COLORS[themeName] || THEME_COLORS.gs25;
  document.documentElement.style.setProperty('--green', theme.primary);
  document.documentElement.style.setProperty('--green2', theme.secondary);
  document.documentElement.style.setProperty('--green-glow', theme.glow);
  localStorage.setItem('gs25_app_theme', themeName);

  // Mark theme option active in profile UI
  const options = document.querySelectorAll('.theme-option');
  options.forEach(opt => {
    if (opt.getAttribute('data-theme') === themeName) {
      opt.classList.add('active');
    } else {
      opt.classList.remove('active');
    }
  });
}
window.applyAppTheme = applyAppTheme;

// Predefined Emoji Avatars choice
const AVATAR_LIST = ['🦊', '🐼', '🐯', '🦁', '🦄', '🐨', '🐱', '🐶', '🐸', '🐵', '🐙', '🦖', '🐝', '🦉', '🐣', '🦥'];

function setupUserProfilePage() {
  const pageProfile = document.getElementById('page-profile');
  if (!pageProfile) return;

  // Render static components inside Profile page
  const grid = document.getElementById('avatar-choices-grid');
  if (grid) {
    grid.innerHTML = AVATAR_LIST.map(av => `
      <button class="avatar-choice-btn" data-avatar="${av}">${av}</button>
    `).join('');
  }

  // Hook navigation: clicking sidebar profile card opens profile page
  const sidebarProfile = document.getElementById('user-profile');
  if (sidebarProfile) {
    sidebarProfile.addEventListener('click', (e) => {
      // Exclude click on logout button
      if (!e.target.closest('#btn-logout')) {
        navigateTo('profile');
      }
    });
  }

  // Load user data on profile tab open
  const loadProfileData = () => {
    const user = window.currentUserProfile;
    if (!user) return;

    // Display fields
    const avDisp = document.getElementById('profile-avatar-display');
    if (avDisp) {
      if (user.avatar) {
        avDisp.textContent = user.avatar;
      } else {
        avDisp.textContent = user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
      }
    }
    
    document.getElementById('profile-full-name').textContent = user.name;
    document.getElementById('profile-position').textContent = user.role || 'Nhân viên';
    document.getElementById('profile-emp-id').textContent = user.id;
    document.getElementById('profile-store-name').textContent = user.store || 'GS25 Store';
    document.getElementById('profile-role').textContent = user.role || 'Nhân viên';

    // Form inputs
    document.getElementById('profile-nickname').value = user.nickname || '';
    document.getElementById('profile-phone').value = user.phone || '';
    document.getElementById('profile-email').value = user.email || '';
    document.getElementById('profile-dob').value = user.dob || '';

    // Apply active theme selection state
    if (user.theme) {
      applyAppTheme(user.theme);
    }
  };

  // We should trigger load when navigation changes to profile
  const originalNavigateTo = window.navigateTo;
  window.navigateTo = function(page) {
    if (page === 'profile') {
      loadProfileData();
    }
    originalNavigateTo(page);
  };

  // Profile Save Action
  const btnSave = document.getElementById('btn-save-profile');
  if (btnSave) {
    btnSave.addEventListener('click', async () => {
      const user = window.currentUserProfile;
      if (!user) return;

      const nickname = document.getElementById('profile-nickname').value.trim();
      const phone = document.getElementById('profile-phone').value.trim();
      const email = document.getElementById('profile-email').value.trim();
      const dob = document.getElementById('profile-dob').value;
      
      const activeThemeOpt = document.querySelector('.theme-option.active');
      const theme = activeThemeOpt ? activeThemeOpt.getAttribute('data-theme') : 'gs25';

      btnSave.disabled = true;
      btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...';

      const updateData = {
        nickname,
        phone,
        email,
        dob,
        theme
      };

      try {
        if (window.FireDB) {
          await db.collection('employees').doc(user.id).update(updateData);
        }

        // Update local session
        Object.assign(user, updateData);
        localStorage.setItem('gs25_session', JSON.stringify(user));
        window.currentUserProfile = user;

        // Apply changes
        applyAppTheme(theme);
        if (typeof window.updateSidebarUser === 'function') {
          window.updateSidebarUser();
        }
        
        // Update greeting on dashboard too
        if (typeof window.updatePersonalWidgets === 'function') {
          window.updatePersonalWidgets();
        }

        showToast('Cập nhật hồ sơ thành công!', 'success');
      } catch (err) {
        console.error('Save profile error', err);
        showToast('Lỗi lưu hồ sơ!', 'error');
      } finally {
        btnSave.disabled = false;
        btnSave.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Cập Nhật Hồ Sơ';
      }
    });
  }

  // Theme option clicks
  const themeOptions = document.querySelectorAll('.theme-option');
  themeOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      const selected = opt.getAttribute('data-theme');
      applyAppTheme(selected);
    });
  });

  // Avatar Modal Handlers
  const avatarModal = document.getElementById('avatar-modal');
  const btnChangeAvatar = document.getElementById('btn-change-avatar');
  const btnCancelAvatar = document.getElementById('avatar-modal-cancel');
  const btnCloseAvatar = document.getElementById('avatar-modal-close');
  const backdropAvatar = document.getElementById('avatar-modal-backdrop');

  if (btnChangeAvatar && avatarModal) {
    btnChangeAvatar.addEventListener('click', () => avatarModal.classList.remove('hidden'));
    
    const hideAvModal = () => avatarModal.classList.add('hidden');
    btnCancelAvatar.addEventListener('click', hideAvModal);
    btnCloseAvatar.addEventListener('click', hideAvModal);
    backdropAvatar.addEventListener('click', hideAvModal);

    // Event delegation for avatar choices
    if (grid) {
      grid.addEventListener('click', async (e) => {
        const btn = e.target.closest('.avatar-choice-btn');
        if (!btn) return;
        const selectedAvatar = btn.getAttribute('data-avatar');
        const user = window.currentUserProfile;
        if (!user) return;

        try {
          if (window.FireDB) {
            await db.collection('employees').doc(user.id).update({ avatar: selectedAvatar });
          }

          // Update local session
          user.avatar = selectedAvatar;
          localStorage.setItem('gs25_session', JSON.stringify(user));
          window.currentUserProfile = user;

          // Update avatar displays
          const avDisp = document.getElementById('profile-avatar-display');
          if (avDisp) avDisp.textContent = selectedAvatar;

          if (typeof window.updateSidebarUser === 'function') {
            window.updateSidebarUser();
          }

          showToast('Thay đổi avatar thành công!', 'success');
          hideAvModal();
        } catch (err) {
          console.error(err);
          showToast('Lỗi thay đổi avatar!', 'error');
        }
      });
    }
  }
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  setupSidebar();
  setupNav();
  setupWeekNav();
  setupShiftRegistration();
  setupCheckDateTool();
  setupStreakModal();
  setupUserProfilePage();
  setupPWA();

  updateClock();
  setInterval(updateClock, 1000);

  // Initialize and schedule dynamic weather updates
  updateLiveWeather();
  setInterval(updateLiveWeather, 900000); // refresh every 15 minutes
});
