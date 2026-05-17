// ===== SIMPLE AUTH MODULE (ID + Password via Firestore) =====
const Auth = (function() {
  const SESSION_KEY = 'gs25_session';
  let currentUser = null;

  // ===== DEFAULT EMPLOYEES (seeded to Firestore on first run) =====
  const DEFAULT_EMPLOYEES = [
    { id: '250620054', name: 'Nguyễn Ngọc Thị Thanh Phương', password: '1', role: 'Nhân viên', store: 'GS25-HCM-001' },
    { id: '260327021', name: 'LÊ QUỐC KHANH', password: '1', role: 'Nhân viên', store: 'GS25-HCM-001' },
    { id: '250919025', name: 'Nguyễn Thị Hòa', password: '1', role: 'Nhân viên', store: 'GS25-HCM-001' },
    { id: '251010025', name: 'Nguyễn Trường Giang', password: '1', role: 'Nhân viên', store: 'GS25-HCM-001' },
    { id: '251216025', name: 'Hoàng Công Anh Tuấn', password: '1', role: 'Nhân viên', store: 'GS25-HCM-001' },
    { id: '260128037', name: 'Trần Đình Mạnh Trọng', password: '1', role: 'Nhân viên', store: 'GS25-HCM-001' },
    { id: '260210044', name: 'Võ Ngọc Trung Kiên', password: 'admin123', role: 'Admin', store: 'GS25-HCM-001' },
    { id: '260310042', name: 'Phạm Thanh Nghĩa', password: '1', role: 'Nhân viên', store: 'GS25-HCM-001' },
    { id: '260312063', name: 'Lê Nguyên Hoàng', password: '1', role: 'Nhân viên', store: 'GS25-HCM-001' },
    { id: '260312061', name: 'LÊ TRẦN ANH KHOA', password: '1', role: 'Nhân viên', store: 'GS25-HCM-001' },
    { id: '260319046', name: 'PHẠM THANH HIẾU', password: '1', role: 'Nhân viên', store: 'GS25-HCM-001' },
    { id: '260506044', name: 'Võ Hoài Nam', password: '1', role: 'Nhân viên', store: 'GS25-HCM-001' }
  ];

  function showError(msg) {
    const el = document.getElementById('auth-error');
    el.textContent = msg;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 4000);
  }

  function withTimeout(promise, ms, label = 'Yêu cầu quá thời gian') {
    return Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error(label)), ms))
    ]);
  }

  function findDefaultEmployee(id, password) {
    return DEFAULT_EMPLOYEES.find(emp => emp.id === id && emp.password === password) || null;
  }

  // ===== SEED DEFAULT EMPLOYEES =====
  async function seedEmployees() {
    if (!window.FireDB) return;
    try {
      const snapshot = await db.collection('employees').get();
      let shouldSeed = snapshot.empty;
      
      // Migration check: if old admin exists but new admin doesn't, we should reseed
      if (!snapshot.empty) {
        const hasNewAdmin = snapshot.docs.some(doc => doc.id === '260210044');
        if (!hasNewAdmin) {
          shouldSeed = true;
          console.log('🔄 Old employee data detected. Reseeding with new data...');
          // Delete old data
          const deleteBatch = db.batch();
          snapshot.docs.forEach(doc => deleteBatch.delete(doc.ref));
          await deleteBatch.commit();
        }
      }

      if (shouldSeed) {
        console.log('📤 Seeding default employees...');
        const batch = db.batch();
        DEFAULT_EMPLOYEES.forEach(emp => {
          batch.set(db.collection('employees').doc(emp.id), emp);
        });
        await batch.commit();
        console.log('✅ Default employees created');
      }
    } catch (err) {
      console.error('Error seeding employees:', err);
    }
  }

  // ===== LOGIN =====
  async function handleLogin() {
    const idInput = document.getElementById('login-id').value.trim().toUpperCase();
    const password = document.getElementById('login-password').value;

    if (!idInput || !password) {
      showError('Vui lòng nhập mã NV và mật khẩu');
      return;
    }

    const btn = document.getElementById('btn-login');
    btn.disabled = true;
    btn.textContent = 'Đang đăng nhập...';

    try {
      let emp = null;

      if (window.FireDB && typeof db !== 'undefined') {
        const doc = await withTimeout(
          db.collection('employees').doc(idInput).get(),
          6000,
          'Firebase login timeout'
        );

        if (doc.exists) {
          emp = doc.data();
        }
      }

      if (!emp) {
        emp = findDefaultEmployee(idInput, password);
      }

      if (!emp) {
        showError('Không tìm thấy mã nhân viên này');
        btn.disabled = false;
        btn.textContent = 'Đăng nhập';
        return;
      }

      if (emp.password !== password) {
        showError('Sai mật khẩu');
        btn.disabled = false;
        btn.textContent = 'Đăng nhập';
        return;
      }

      // Login success
      currentUser = emp;
      localStorage.setItem(SESSION_KEY, JSON.stringify(emp));
      window.currentUserProfile = emp;

      // Log login event to Firestore for admin tracking
      try {
        const ua = navigator.userAgent;
        const deviceFingerprint = btoa(ua).slice(0, 20);
        const knownDevices = JSON.parse(localStorage.getItem(`gs25_devices_${emp.id}`) || '[]');
        const isNew = !knownDevices.includes(deviceFingerprint);
        if (isNew) {
          knownDevices.push(deviceFingerprint);
          localStorage.setItem(`gs25_devices_${emp.id}`, JSON.stringify(knownDevices.slice(-10)));
        }
        const browser = ua.includes('Chrome') ? 'Chrome' : ua.includes('Firefox') ? 'Firefox' : ua.includes('Safari') ? 'Safari' : 'Browser';
        const os = ua.includes('iPhone') || ua.includes('iPad') ? 'iOS' : ua.includes('Android') ? 'Android' : ua.includes('Mac') ? 'macOS' : ua.includes('Win') ? 'Windows' : 'Unknown';
        if (window.FireDB) {
          db.collection('login_logs').add({
            userId: emp.id, userName: emp.name, role: emp.role || 'Nhân viên',
            device: `${browser} • ${os}`, fingerprint: deviceFingerprint,
            isNewDevice: isNew,
            time: firebase.firestore.FieldValue.serverTimestamp()
          });
        }
      } catch (_) {}

      showApp();
      if (typeof showToast === 'function') {
        showToast(`Xin chào ${emp.name}! 👋`);
      }
    } catch (err) {
      console.error('Login error:', err);
      const fallbackEmp = findDefaultEmployee(idInput, password);
      if (fallbackEmp) {
        currentUser = fallbackEmp;
        localStorage.setItem(SESSION_KEY, JSON.stringify(fallbackEmp));
        window.currentUserProfile = fallbackEmp;
        showApp();
        if (typeof showToast === 'function') {
          showToast(`Xin chào ${fallbackEmp.name}! 👋`);
        }
      } else {
        showError('Lỗi kết nối. Kiểm tra internet.');
        btn.disabled = false;
        btn.textContent = 'Đăng nhập';
      }
    }
  }

  // ===== LOGOUT =====
  async function handleLogout() {
    const ok = await window.showConfirm('Bạn có chắc muốn đăng xuất?');
    if (ok) {
      currentUser = null;
      window.currentUserProfile = null;
      localStorage.removeItem(SESSION_KEY);
      showAuth();
    }
  }

  // ===== SHOW/HIDE SCREENS =====
  function showApp() {
    document.getElementById('auth-screen').classList.add('hidden');
    const splash = document.getElementById('splash-screen');
    if (splash) splash.classList.add('hide');
    document.getElementById('app').classList.remove('hidden');
    setTimeout(() => document.getElementById('app').classList.add('show'), 50);
    updateSidebarUser();
    if (typeof window.refreshAdminEmployees === 'function') {
      window.refreshAdminEmployees();
    }
    if (typeof window.refreshShiftReminder === 'function') {
      window.refreshShiftReminder();
    }
    if (typeof window.updatePersonalWidgets === 'function') {
      window.updatePersonalWidgets();
    }
    setTimeout(() => {
      if (typeof window.invalidateSalaryCache === 'function') window.invalidateSalaryCache();
      if (typeof window.renderSalary === 'function') window.renderSalary();
    }, 300);
  }

  function showAuth() {
    document.getElementById('app').classList.add('hidden');
    document.getElementById('app').classList.remove('show');
    const splash = document.getElementById('splash-screen');
    if (splash) splash.classList.add('hide');
    document.getElementById('auth-screen').classList.remove('hidden');
    // Reset form
    document.getElementById('btn-login').disabled = false;
    document.getElementById('btn-login').textContent = 'Đăng nhập';
    document.getElementById('login-id').value = '';
    document.getElementById('login-password').value = '';
  }

  // ===== UPDATE SIDEBAR =====
  function updateSidebarUser() {
    if (!currentUser) return;
    
    const avDisplay = document.getElementById('user-avatar');
    if (avDisplay) {
      if (currentUser.avatar) {
        avDisplay.textContent = currentUser.avatar;
        avDisplay.style.background = 'linear-gradient(135deg, var(--green), var(--purple))';
        avDisplay.style.fontSize = '1.8rem';
      } else {
        const initials = currentUser.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
        avDisplay.textContent = initials;
        avDisplay.style.background = '';
        avDisplay.style.fontSize = '';
      }
    }
    
    const nameDisplay = document.getElementById('user-name');
    if (nameDisplay) {
      nameDisplay.textContent = currentUser.nickname || currentUser.name;
    }
    
    const storeDisplay = document.getElementById('user-store');
    if (storeDisplay) {
      storeDisplay.textContent = '🏪 ' + (currentUser.store || '--');
    }

    // Apply saved theme color if set
    if (currentUser.theme) {
      if (typeof window.applyAppTheme === 'function') {
        window.applyAppTheme(currentUser.theme);
      }
    }

    // Toggle Admin Panel visibility
    const adminNav = document.getElementById('nav-admin');
    if (adminNav) {
      const isManager = currentUser.role === 'Admin' || currentUser.role === 'Quản lý' ||
        (currentUser.position && (currentUser.position.includes('trưởng') || currentUser.position.includes('phó')));
      if (isManager) {
        adminNav.classList.remove('hidden');
      } else {
        adminNav.classList.add('hidden');
      }
    }
  }
  window.updateSidebarUser = updateSidebarUser;

  // ===== CHECK SAVED SESSION =====
  async function checkSession() {
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) {
      try {
        const emp = JSON.parse(saved);
        // Verify with Firestore
        if (window.FireDB) {
          currentUser = emp;
          window.currentUserProfile = emp;
          showApp();
          withTimeout(
            db.collection('employees').doc(emp.id).get(),
            5000,
            'Session verification timeout'
          ).then(doc => {
            if (doc.exists) {
              currentUser = doc.data();
              window.currentUserProfile = currentUser;
              updateSidebarUser();
              // Re-render salary with verified user profile
              if (typeof window.invalidateSalaryCache === 'function') window.invalidateSalaryCache();
              if (typeof window.renderSalary === 'function') window.renderSalary();
            }
          }).catch(err => console.warn('Session verification skipped:', err.message));
          return true;
        } else {
          // Offline fallback
          currentUser = emp;
          window.currentUserProfile = emp;
          showApp();
          return true;
        }
      } catch (err) {
        console.warn('Session check failed:', err);
      }
    }
    return false;
  }

  // ===== INIT =====
  async function init() {
    // Setup login button
    document.getElementById('btn-login').addEventListener('click', handleLogin);
    document.getElementById('login-password').addEventListener('keydown', e => {
      if (e.key === 'Enter') handleLogin();
    });
    document.getElementById('login-id').addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('login-password').focus();
    });

    // Setup logout
    document.getElementById('btn-logout').addEventListener('click', handleLogout);

    // Check saved session
    const hasSession = await checkSession();
    if (!hasSession) {
      showAuth();
    }

    // Seed employees, then refresh admin list when ready
    window._employeesSeedPromise = seedEmployees().finally(() => {
      if (typeof window.refreshAdminEmployees === 'function') {
        window.refreshAdminEmployees();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);

  return {
    getUser: () => currentUser,
    isLoggedIn: () => !!currentUser,
    logout: handleLogout
  };
})();
