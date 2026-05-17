(function () {
  let dailyEditorDate = new Date();

  function fmtDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  }

  function showToast(msg, type = 'success') {
    if (typeof window.showToast === 'function') {
      window.showToast(msg, type);
    } else {
      const c = document.getElementById('toast-container');
      if (!c) return;
      const t = document.createElement('div');
      t.className = `toast toast-${type}`;
      t.textContent = msg;
      c.appendChild(t);
      setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 2500);
    }
  }

  // ===== TABS =====
  function setupTabs() {
    document.querySelectorAll('.admin-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const panel = document.getElementById('admin-panel-' + tab.dataset.adminTab);
        if (panel) panel.classList.add('active');

        if (tab.dataset.adminTab === 'employees') loadAdminEmployees();
        if (tab.dataset.adminTab === 'schedule') renderDailySchedule();
        if (tab.dataset.adminTab === 'requests') loadShiftRequests();
        if (tab.dataset.adminTab === 'general') loadLoginHistory();
      });
    });
  }

  // ===== EMPLOYEES =====
  async function loadAdminEmployees() {
    const tbody = document.querySelector('#admin-emp-table tbody');
    const countEl = document.getElementById('admin-emp-count');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text3)">Đang tải...</td></tr>';

    try {
      const snapshot = await db.collection('employees').get();
      const emps = [];
      snapshot.forEach(doc => emps.push({ id: doc.id, ...doc.data() }));
      if (countEl) countEl.textContent = emps.length;

      if (emps.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text3)">Chưa có nhân viên nào</td></tr>';
        return;
      }

      tbody.innerHTML = emps.map(emp => `
        <tr>
          <td>${emp.id || ''}</td>
          <td>${emp.name || ''}</td>
          <td>${emp.position || emp.role || ''}</td>
          <td>${emp.store || ''}</td>
          <td>••••</td>
          <td style="display:flex;gap:6px;flex-wrap:wrap">
            <button class="btn btn-secondary btn-sm" onclick="window._adminEditEmp('${emp.id}')">✏️ Sửa</button>
            <button class="btn btn-secondary btn-sm" onclick="window._adminDeleteEmp('${emp.id}')">🗑️ Xóa</button>
          </td>
        </tr>
      `).join('');
    } catch (err) {
      console.error('Load employees error:', err);
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;color:#f85149">Lỗi khi tải dữ liệu</td></tr>';
    }
  }

  window._adminEditEmp = async (id) => {
    // Load current data
    let emp;
    try {
      const doc = await db.collection('employees').doc(id).get();
      if (!doc.exists) { showToast('Không tìm thấy nhân viên', 'error'); return; }
      emp = { id: doc.id, ...doc.data() };
    } catch (e) { showToast('Lỗi tải dữ liệu', 'error'); return; }

    // Build inline modal
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:900;background:rgba(0,0,0,.65);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:20px';
    overlay.innerHTML = `
      <div style="background:#1a1f35;border:1px solid rgba(99,102,241,.4);border-radius:20px;padding:32px;width:100%;max-width:420px;box-shadow:0 20px 60px rgba(0,0,0,.6)">
        <h3 style="margin:0 0 20px;font-size:1.1rem;color:#fff">✏️ Chỉnh sửa nhân viên</h3>
        <div style="display:flex;flex-direction:column;gap:14px">
          <div>
            <label style="font-size:.8rem;color:#94a3b8;display:block;margin-bottom:4px">Mã NV</label>
            <input id="edit-emp-id" class="form-input" value="${emp.id}" disabled style="opacity:.5;cursor:not-allowed">
          </div>
          <div>
            <label style="font-size:.8rem;color:#94a3b8;display:block;margin-bottom:4px">Họ và tên</label>
            <input id="edit-emp-name" class="form-input" value="${emp.name || ''}" placeholder="Họ và tên">
          </div>
          <div>
            <label style="font-size:.8rem;color:#94a3b8;display:block;margin-bottom:4px">Vai trò</label>
            <select id="edit-emp-role" class="form-input">
              <option value="Nhân viên" ${(emp.role||'') === 'Nhân viên' ? 'selected':''}>Nhân viên</option>
              <option value="Quản lý" ${(emp.role||'') === 'Quản lý' ? 'selected':''}>Quản lý</option>
              <option value="Admin" ${(emp.role||'') === 'Admin' ? 'selected':''}>Admin</option>
            </select>
          </div>
          <div>
            <label style="font-size:.8rem;color:#94a3b8;display:block;margin-bottom:4px">Cửa hàng</label>
            <input id="edit-emp-store" class="form-input" value="${emp.store || 'GS25-HCM-001'}" placeholder="GS25-HCM-001">
          </div>
          <div>
            <label style="font-size:.8rem;color:#94a3b8;display:block;margin-bottom:4px">Mật khẩu</label>
            <input id="edit-emp-pw" class="form-input" type="text" value="${emp.password || ''}" placeholder="Mật khẩu">
          </div>
        </div>
        <div style="display:flex;gap:12px;margin-top:24px">
          <button id="edit-emp-cancel" class="btn btn-secondary" style="flex:1">Hủy</button>
          <button id="edit-emp-save" class="btn btn-primary" style="flex:1">💾 Lưu</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('#edit-emp-cancel').onclick = () => overlay.remove();
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    overlay.querySelector('#edit-emp-save').onclick = async () => {
      const updated = {
        name: overlay.querySelector('#edit-emp-name').value.trim(),
        role: overlay.querySelector('#edit-emp-role').value,
        store: overlay.querySelector('#edit-emp-store').value.trim(),
      };
      if (!updated.name) { showToast('Vui lòng nhập họ tên', 'error'); return; }

      const pw = overlay.querySelector('#edit-emp-pw').value.trim();
      if (!pw) { showToast('Mật khẩu không được để trống', 'error'); return; }
      updated.password = pw;

      try {
        await db.collection('employees').doc(id).update(updated);
        showToast('✅ Đã cập nhật thông tin nhân viên!');
        overlay.remove();
        loadAdminEmployees();
      } catch (err) { showToast('Lỗi khi lưu', 'error'); }
    };
  };

  window._adminDeleteEmp = async (id) => {
    const ok = await window.showConfirm(`Xóa nhân viên ID: ${id}?`);
    if (!ok) return;
    try {
      await db.collection('employees').doc(id).delete();
      showToast('Đã xóa nhân viên');
      loadAdminEmployees();
    } catch (err) { showToast('Lỗi khi xóa', 'error'); }
  };

  window.refreshAdminEmployees = loadAdminEmployees;

  // ===== DAILY SCHEDULE EDITOR =====
  async function renderDailySchedule() {
    const dateKey = fmtDate(dailyEditorDate);
    const label = document.getElementById('daily-date-label');
    if (label) label.textContent = dailyEditorDate.toLocaleDateString('vi-VN', {
      weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric'
    });

    const tbody = document.getElementById('daily-sch-body');
    if (!tbody) return;

    let shifts = {};
    try {
      const doc = await db.collection('daily_schedules').doc(dateKey).get();
      if (doc.exists && doc.data().shifts) shifts = doc.data().shifts;
      else if (typeof SCHEDULE_DAILY !== 'undefined' && SCHEDULE_DAILY[dateKey]) {
        shifts = SCHEDULE_DAILY[dateKey];
      }
    } catch (e) {
      if (typeof SCHEDULE_DAILY !== 'undefined' && SCHEDULE_DAILY[dateKey]) {
        shifts = SCHEDULE_DAILY[dateKey];
      }
    }

    if (!window.SCHEDULE || !SCHEDULE.employees) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;color:var(--text3)">Chưa có dữ liệu nhân viên</td></tr>';
      return;
    }

    tbody.innerHTML = SCHEDULE.employees.map(emp => {
      const val = shifts[emp.id] || '';
      return `
        <tr>
          <td style="font-size:.8rem;color:var(--text3)">${emp.id}</td>
          <td>${emp.name}</td>
          <td>
            <input type="text" class="form-input sch-input" data-emp-id="${emp.id}" value="${val}" placeholder="Ca 1 / Ca 2 / Ca 3 / HC / OFF...">
          </td>
          <td>
            <div style="display:flex;gap:4px;flex-wrap:wrap">
              ${['HC','Ca 1','Ca 2','Ca 3','6h-10h','10h-14h','14h-18h','18h-22h','OFF'].map(s =>
                `<button style="padding:2px 6px;font-size:.72rem;border-radius:5px;background:var(--surface);border:1px solid var(--border);cursor:pointer;color:var(--text2)"
                  onclick="this.closest('tr').querySelector('.sch-input').value='${s}'">${s}</button>`
              ).join('')}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  async function saveDailySchedule() {
    const dateKey = fmtDate(dailyEditorDate);
    const shifts = {};
    document.querySelectorAll('#daily-sch-body .sch-input').forEach(input => {
      if (input.value.trim()) shifts[input.dataset.empId] = input.value.trim();
    });
    try {
      await db.collection('daily_schedules').doc(dateKey).set({
        shifts,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      showToast('✅ Đã lưu lịch ngày ' + dateKey);
    } catch (err) {
      showToast('Lỗi khi lưu lịch', 'error');
    }
  }

  // ===== SHIFT REQUESTS =====
  let SHIFT_REQUESTS = [];

  async function loadShiftRequests() {
    const tbody = document.getElementById('admin-requests-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:30px;color:var(--text3)">Đang tải...</td></tr>';

    try {
      const snapshot = await db.collection('shift_requests').orderBy('createdAt', 'desc').limit(50).get();
      SHIFT_REQUESTS = [];
      snapshot.forEach(doc => SHIFT_REQUESTS.push({ id: doc.id, ...doc.data() }));
      renderShiftRequests();
    } catch (e) {
      console.warn('Load requests error:', e);
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:30px;color:#f85149">Lỗi khi tải dữ liệu</td></tr>';
    }
  }

  function renderShiftRequests() {
    const tbody = document.getElementById('admin-requests-body');
    if (!tbody) return;

    if (!SHIFT_REQUESTS.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text3)">Chưa có yêu cầu đăng ký nào</td></tr>';
      return;
    }

    tbody.innerHTML = SHIFT_REQUESTS.map(req => {
      const shifts = req.shifts || {};
      const summary = Object.keys(shifts).sort().map(d => {
        const parts = d.split('-');
        return `<span style="white-space:nowrap;font-size:.75rem;background:var(--surface);border:1px solid var(--border);border-radius:4px;padding:1px 5px"><b>${parts[2]}/${parts[1]}:</b> ${shifts[d]}</span>`;
      }).join(' ');
      const createdAt = req.createdAt ? new Date(req.createdAt).toLocaleDateString('vi-VN') : '--';
      const statusMap = { pending: '🟡 Chờ duyệt', approved: '✅ Đã duyệt', rejected: '❌ Từ chối' };
      const statusLabel = statusMap[req.status] || req.status;

      return `
        <tr>
          <td><b>${req.userName || '--'}</b><br><span style="font-size:.75rem;color:var(--text3)">${req.userId || ''}</span></td>
          <td><div style="display:flex;flex-wrap:wrap;gap:3px">${summary}</div></td>
          <td style="font-size:.85rem">${createdAt}</td>
          <td>${statusLabel}</td>
          <td>
            ${req.status === 'pending' ? `
              <button class="btn btn-primary btn-sm" onclick="window._approveRequest('${req.id}')">✅ Duyệt</button>
              <button class="btn btn-secondary btn-sm" onclick="window._rejectRequest('${req.id}')">Từ chối</button>
            ` : `<button class="btn btn-secondary btn-sm" onclick="window._deleteRequest('${req.id}')">🗑️</button>`}
          </td>
        </tr>
      `;
    }).join('');
  }

  window._approveRequest = async (id) => {
    const req = SHIFT_REQUESTS.find(r => r.id === id);
    if (!req) return;
    const ok = await window.showConfirm(`Phê duyệt lịch đăng ký của ${req.userName}?`);
    if (!ok) return;
    try {
      const batch = db.batch();
      for (const dateKey in req.shifts) {
        const shiftVal = req.shifts[dateKey];
        const docRef = db.collection('daily_schedules').doc(dateKey);
        const existing = await docRef.get();
        const cur = existing.exists ? (existing.data().shifts || {}) : {};
        cur[req.userId] = shiftVal;
        batch.set(docRef, { shifts: cur, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
      }
      batch.update(db.collection('shift_requests').doc(id), { status: 'approved' });
      await batch.commit();
      showToast('✅ Đã duyệt và cập nhật lịch làm việc!');
      loadShiftRequests();
    } catch (err) { showToast('Lỗi khi phê duyệt', 'error'); }
  };

  window._rejectRequest = async (id) => {
    const ok = await window.showConfirm('Từ chối yêu cầu đăng ký này?');
    if (!ok) return;
    try {
      await db.collection('shift_requests').doc(id).update({ status: 'rejected' });
      showToast('Đã từ chối yêu cầu');
      loadShiftRequests();
    } catch (e) { showToast('Lỗi', 'error'); }
  };

  window._deleteRequest = async (id) => {
    const ok = await window.showConfirm('Xóa vĩnh viễn yêu cầu này?');
    if (!ok) return;
    try {
      await db.collection('shift_requests').doc(id).delete();
      loadShiftRequests();
    } catch (e) { }
  };

  // ===== ADD EMPLOYEE =====
  function setupAddEmployee() {
    document.getElementById('btn-admin-add-emp')?.addEventListener('click', () => {
      const id = prompt('Mã nhân viên (VD: 260101099):');
      if (!id) return;
      const name = prompt('Họ và tên:');
      if (!name) return;
      const role = prompt('Vai trò (Nhân viên / Admin / Quản lý):', 'Nhân viên');
      const password = prompt('Mật khẩu:', '1');

      db.collection('employees').doc(id.trim().toUpperCase()).set({
        id: id.trim().toUpperCase(),
        name: name.trim(),
        role: role || 'Nhân viên',
        password: password || '1',
        store: 'GS25-HCM-001'
      }).then(() => {
        showToast('✅ Đã thêm nhân viên!');
        loadAdminEmployees();
      }).catch(() => showToast('Lỗi khi thêm NV', 'error'));
    });
  }

  // ===== GENERAL SETTINGS (Login Notifications) =====
  let _loginNotifyUnsub = null;

  async function loadLoginHistory() {
    const tbody = document.getElementById('login-log-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:24px;color:var(--text3)">Đang tải...</td></tr>';
    try {
      const snap = await db.collection('login_logs').orderBy('time', 'desc').limit(30).get();
      if (snap.empty) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:24px;color:var(--text3)">Chưa có lịch sử đăng nhập</td></tr>';
        return;
      }
      tbody.innerHTML = snap.docs.map(doc => {
        const d = doc.data();
        const time = d.time ? new Date(d.time.toDate()).toLocaleString('vi-VN') : '--';
        const newBadge = d.isNewDevice
          ? '<span style="font-size:.7rem;background:rgba(251,191,36,.15);color:#fbbf24;border:1px solid rgba(251,191,36,.3);border-radius:6px;padding:1px 7px;margin-left:6px">Mới</span>'
          : '<span style="font-size:.7rem;background:rgba(99,102,241,.1);color:#818cf8;border:1px solid rgba(99,102,241,.2);border-radius:6px;padding:1px 7px;margin-left:6px">Đã biết</span>';
        return `<tr>
          <td><b>${d.userName || '--'}</b><br><span style="font-size:.73rem;color:var(--text3)">${d.userId || ''} • ${d.role || ''}</span></td>
          <td style="font-size:.82rem">${time}</td>
          <td style="font-size:.82rem;color:var(--text2)">${d.device || '--'}</td>
          <td>${newBadge}</td>
        </tr>`;
      }).join('');
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:24px;color:#f85149">Lỗi khi tải dữ liệu</td></tr>';
    }
  }

  function startLoginNotifyListener() {
    if (_loginNotifyUnsub) _loginNotifyUnsub();
    const since = new Date();
    _loginNotifyUnsub = db.collection('login_logs')
      .where('time', '>', since)
      .onSnapshot(snap => {
        snap.docChanges().forEach(change => {
          if (change.type === 'added') {
            const d = change.doc.data();
            if (d.isNewDevice) {
              showToast(`🔔 ${d.userName} vừa đăng nhập từ thiết bị mới! (${d.device})`, 'info');
            } else {
              showToast(`🔔 ${d.userName} vừa đăng nhập (${d.device})`);
            }
          }
        });
      }, () => {});
  }

  function setupGeneralSettings() {
    const toggle = document.getElementById('toggle-login-notify');
    if (!toggle) return;
    const saved = localStorage.getItem('gs25_login_notify') === 'true';
    toggle.checked = saved;
    if (saved) startLoginNotifyListener();

    toggle.addEventListener('change', () => {
      localStorage.setItem('gs25_login_notify', toggle.checked);
      if (toggle.checked) {
        startLoginNotifyListener();
        showToast('✅ Đã bật thông báo đăng nhập');
      } else {
        if (_loginNotifyUnsub) { _loginNotifyUnsub(); _loginNotifyUnsub = null; }
        showToast('Đã tắt thông báo đăng nhập');
      }
    });

    document.getElementById('btn-refresh-logins')?.addEventListener('click', loadLoginHistory);

    // Setup Data Cleanup
    document.getElementById('btn-cleanup-data')?.addEventListener('click', async () => {
      const monthInput = document.getElementById('cleanup-month');
      if (!monthInput || !monthInput.value) {
        showToast('Vui lòng chọn tháng cần dọn dẹp', 'error');
        return;
      }
      const [year, month] = monthInput.value.split('-').map(Number);
      const monthName = `tháng ${month}/${year}`;
      
      const ok = await window.showConfirm(`CẢNH BÁO: Xóa toàn bộ dữ liệu lịch làm việc của ${monthName}? Hành động này KHÔNG THỂ HOÀN TÁC!`);
      if (!ok) return;

      try {
        showToast(`Đang dọn dẹp dữ liệu ${monthName}...`);
        
        const prefix = `${year}-${month.toString().padStart(2, '0')}`;
        const snap = await db.collection('daily_schedules')
          .where(firebase.firestore.FieldPath.documentId(), '>=', `${prefix}-01`)
          .where(firebase.firestore.FieldPath.documentId(), '<=', `${prefix}-31`)
          .get();

        if (snap.empty) {
          showToast(`Không tìm thấy dữ liệu nào của ${monthName}`);
          return;
        }

        const batch = db.batch();
        snap.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();

        showToast(`✅ Đã xóa sạch dữ liệu của ${monthName}!`);
        monthInput.value = '';
      } catch (err) {
        console.error(err);
        showToast('Lỗi khi dọn dẹp dữ liệu', 'error');
      }
    });
  }

  // ===== INIT =====
  function initAdmin() {
    setupTabs();
    setupAddEmployee();
    setupGeneralSettings();

    // Load employees when admin panel opens initially
    const adminPage = document.getElementById('admin-dashboard');
    if (adminPage && adminPage.classList.contains('active')) {
      loadAdminEmployees();
    }

    // Schedule editor controls
    document.getElementById('btn-daily-prev')?.addEventListener('click', () => {
      dailyEditorDate.setDate(dailyEditorDate.getDate() - 1);
      renderDailySchedule();
    });
    document.getElementById('btn-daily-next')?.addEventListener('click', () => {
      dailyEditorDate.setDate(dailyEditorDate.getDate() + 1);
      renderDailySchedule();
    });
    document.getElementById('btn-daily-today')?.addEventListener('click', () => {
      dailyEditorDate = new Date();
      renderDailySchedule();
    });
    document.getElementById('btn-daily-save')?.addEventListener('click', saveDailySchedule);
    document.getElementById('btn-refresh-requests')?.addEventListener('click', loadShiftRequests);
  }

  document.addEventListener('DOMContentLoaded', initAdmin);
})();
