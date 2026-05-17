// ===== DATA STORE =====
var CHECKLISTS = {
  morning: [
    { text: "Kiểm tra camera an ninh", time: "06:00" },
    { text: "Vệ sinh quầy thu ngân", time: "06:00" },
    { text: "Kiểm tra nhiệt độ tủ lạnh/tủ đông", time: "06:15" },
    { text: "Nhận hàng giao sáng & kiểm đếm", time: "06:30" },
    { text: "Bổ sung hàng lên kệ", time: "07:00" },
    { text: "Pha cà phê & chuẩn bị đồ uống", time: "07:00" },
    { text: "Kiểm tra hạn sử dụng thực phẩm tươi", time: "07:30" },
    { text: "Lau dọn sàn cửa hàng", time: "08:00" },
    { text: "Kiểm tra giá niêm yết đúng chưa", time: "08:30" },
    { text: "Vệ sinh khu vực ăn uống", time: "09:00" },
    { text: "Báo cáo tồn kho buổi sáng", time: "10:00" },
    { text: "Kiểm tra máy bán hàng tự động", time: "10:30" },
    { text: "Bàn giao ca cho ca chiều", time: "14:00" }
  ],
  afternoon: [
    { text: "Nhận bàn giao từ ca sáng", time: "14:00" },
    { text: "Kiểm tra tồn quỹ đầu ca", time: "14:00" },
    { text: "Vệ sinh máy pha cà phê", time: "14:15" },
    { text: "Bổ sung hàng kệ trưng bày", time: "14:30" },
    { text: "Kiểm tra nhiệt độ tủ mát", time: "15:00" },
    { text: "Nhận hàng giao chiều & kiểm đếm", time: "15:30" },
    { text: "Sắp xếp hàng mới lên kệ (FIFO)", time: "16:00" },
    { text: "Lau dọn khu vực cửa ra vào", time: "17:00" },
    { text: "Kiểm tra đồ ăn nóng & bổ sung", time: "18:00" },
    { text: "Vệ sinh nhà vệ sinh", time: "19:00" },
    { text: "Kiểm tra hàng khuyến mãi", time: "20:00" },
    { text: "Bàn giao ca cho ca tối", time: "22:00" }
  ],
  night: [
    { text: "Nhận bàn giao từ ca chiều", time: "22:00" },
    { text: "Kiểm tra tồn quỹ đầu ca", time: "22:00" },
    { text: "Kiểm tra camera an ninh", time: "22:15" },
    { text: "Vệ sinh toàn bộ cửa hàng", time: "22:30" },
    { text: "Thu gom thực phẩm hết hạn", time: "23:00" },
    { text: "Lau kính, vệ sinh quầy", time: "23:30" },
    { text: "Kiểm tra nhiệt độ tủ đông", time: "00:00" },
    { text: "Bổ sung hàng lên kệ", time: "01:00" },
    { text: "Vệ sinh máy pha cà phê (tổng vệ sinh)", time: "02:00" },
    { text: "Kiểm kê hàng tồn kho", time: "03:00" },
    { text: "Chuẩn bị báo cáo cuối ngày", time: "04:00" },
    { text: "Sắp xếp kho hàng", time: "05:00" },
    { text: "Bàn giao ca cho ca sáng", time: "06:00" }
  ]
};

const CHECKLISTS_DEFAULTS = JSON.parse(JSON.stringify(CHECKLISTS));
const CHECKLIST_SHIFTS = ['morning', 'afternoon', 'night'];

function applyChecklists(source) {
  const next = {};
  CHECKLIST_SHIFTS.forEach(shift => {
    const items = source && Array.isArray(source[shift]) ? source[shift] : [];
    next[shift] = items.length ? items : (CHECKLISTS_DEFAULTS[shift] || []);
  });
  CHECKLISTS = next;
  return CHECKLISTS;
}

var SCHEDULE = {
  weekLabel: "Tuần 11 – 17/05/2026",
  days: [
    { key: "mon", label: "T.2", date: "11/05" },
    { key: "tue", label: "T.3", date: "12/05" },
    { key: "wed", label: "T.4", date: "13/05" },
    { key: "thu", label: "T.5", date: "14/05" },
    { key: "fri", label: "T.6", date: "15/05" },
    { key: "sat", label: "T.7", date: "16/05" },
    { key: "sun", label: "CN",  date: "17/05" }
  ],
  employees: [
    { id: "250620054", name: "Thanh Phương",    shifts: { mon:"HC",      tue:"HC",      wed:"HC",      thu:"HC",      fri:"HC",      sat:"HC",      sun:"OFF"     } },
    { id: "260327021", name: "Lê Quốc Khanh",   shifts: { mon:"HC",      tue:"HC",      wed:"HC-3",    thu:"OFF",     fri:"HC",      sat:"HC",      sun:"OFF"     } },
    { id: "250919025", name: "Nguyễn Thị Hòa",  shifts: { mon:"OFF",     tue:"6h-10h",  wed:"Ca 1",    thu:"OFF",     fri:"6h-10h",  sat:"6h-10h",  sun:"6h-10h"  } },
    { id: "251010025", name: "Trường Giang",     shifts: { mon:"18h-22h", tue:"OFF",     wed:"14h-18h", thu:"14h-18h", fri:"OFF",     sat:"OFF",     sun:"10h-14h" } },
    { id: "251216025", name: "Hoàng Công Anh Tuấn", shifts: { mon:"",    tue:"",        wed:"",        thu:"",        fri:"",        sat:"",        sun:""        } },
    { id: "260128037", name: "Mạnh Trọng",       shifts: { mon:"OFF",     tue:"Ca 3",    wed:"OFF",     thu:"OFF",     fri:"OFF",     sat:"Ca 3",    sun:"14h-18h" } },
    { id: "260210044", name: "Trung Kiên",       shifts: { mon:"18h-22h", tue:"OFF",     wed:"18h-22h", thu:"OFF",     fri:"OFF",     sat:"OFF",     sun:"OFF"     } },
    { id: "260305026", name: "Văn Trần Nhật Minh", shifts: { mon:"",     tue:"",        wed:"",        thu:"",        fri:"",        sat:"",        sun:""        } },
    { id: "260310042", name: "Thanh Nghĩa",      shifts: { mon:"14h-18h", tue:"18h-22h", wed:"OFF",     thu:"OFF",     fri:"18h-22h", sat:"OFF",     sun:"OFF"     } },
    { id: "260312063", name: "Lê Nguyên Hoàng",  shifts: { mon:"Ca 3",   tue:"Ca 3",    wed:"14h-18h", thu:"OFF",     fri:"OFF",     sat:"OFF",     sun:"Ca 3"    } },
    { id: "260312061", name: "Lê Trần Anh Khoa", shifts: { mon:"OFF",    tue:"OFF",     wed:"OFF",     thu:"OFF",     fri:"14h-18h", sat:"Ca 3",    sun:"OFF"     } },
    { id: "260319046", name: "Thanh Hiếu",       shifts: { mon:"OFF",    tue:"OFF",     wed:"Ca 3",    thu:"OFF",     fri:"OFF",     sat:"Ca 3",    sun:"OFF"     } },
    { id: "260506044", name: "Võ Hoài Nam",       shifts: { mon:"Ca 1",   tue:"Ca 1",    wed:"Ca 3",    thu:"OFF",     fri:"Ca 3",    sat:"Ca 2",    sun:"Ca 2"    } },
    { id: "260310038", name: "Nguyễn Bảo Trân",  shifts: { mon:"",       tue:"",        wed:"",        thu:"",        fri:"",        sat:"",        sun:""        } },
    { id: "260311054", name: "Trần Nguyễn Minh Tiến", shifts: { mon:"",  tue:"",        wed:"",        thu:"",        fri:"",        sat:"",        sun:""        } },
  ]
};

// ===== DAILY SCHEDULE (per-date shifts for salary calculation) =====
// Format: 'YYYY-MM-DD': { employeeId: 'shift', ... }
var SCHEDULE_DAILY = {
  // === Apr 26 (Sun) ===
  '2026-04-26': {
    '250620054':'HC','260327021':'HC','250919025':'6h-10h',
    '260128037':'Ca 3','260210044':'10h-14h','260305026':'14h-18h',
    '260310038':'18h-22h'
  },
  // === Apr 27 (Mon) ===
  '2026-04-27': {
    '250620054':'HC','260327021':'HC','250919025':'Ca 1',
    '260128037':'Ca 3','260210044':'18h-22h','260305026':'14h-18h',
    '260506044':'Ca 1'
  },
  // === Apr 28 (Tue) ===
  '2026-04-28': {
    '250620054':'HC','260327021':'HC',
    '260128037':'Ca 3','260210044':'18h-22h','260305026':'6h-10h',
    '260312063':'14h-18h','260506044':'Ca 1'
  },
  // === Apr 29 (Wed) ===
  '2026-04-29': {
    '250620054':'HC','260327021':'HC','250919025':'Ca 1',
    '260128037':'14h-22h','260210044':'18h-22h',
    '260312063':'Ca 3','260506044':'Ca 1'
  },
  // === Apr 30 (Thu) - LỄ: Giải phóng miền Nam ===
  '2026-04-30': {
    '250620054':'HC','260327021':'HC','250919025':'Ca 1',
    '260128037':'Ca 2','260312063':'Ca 2'
  },
  // === May 01 (Fri) - LỄ: Quốc tế Lao động ===
  '2026-05-01': {
    '250620054':'HC','260327021':'HC','250919025':'Ca 1',
    '260128037':'Ca 3','260310042':'14h-22h'
  },
  // === May 02 (Sat) ===
  '2026-05-02': {
    '250620054':'HC','260327021':'6h-14h',
    '251010025':'10h-14h','260128037':'Ca 3',
    '260310042':'6h-10h','260312063':'14h-18h','260319046':'Ca 3'
  },
  // === May 03 (Sun) ===
  '2026-05-03': {},
  // === May 04 (Mon) ===
  '2026-05-04': {
    '250620054':'HC','260327021':'Ca 1',
    '260128037':'Ca 3','260210044':'18h-22h','260305026':'14h-18h',
    '260310042':'14h-18h'
  },
  // === May 05 (Tue) ===
  '2026-05-05': {
    '250620054':'HC','260327021':'HC',
    '251010025':'14h-18h','260128037':'Ca 3',
    '260305026':'6h-10h','260310042':'18h-22h'
  },
  // === May 06 (Wed) ===
  '2026-05-06': {
    '250620054':'HC','260327021':'HC',
    '251010025':'14h-18h','260128037':'Ca 3',
    '260210044':'18h-22h','260319046':'Ca 3',
    '260506044':'HC'
  },
  // === May 07 (Thu) ===
  '2026-05-07': {
    '250620054':'HC','260327021':'HC','250919025':'6h-10h',
    '251010025':'14h-18h','260210044':'Ca 3',
    '260312063':'18h-22h','260319046':'Ca 3',
    '260506044':'8h-16h'
  },
  // === May 08 (Fri) ===
  '2026-05-08': {
    '260327021':'HC','250919025':'Ca 1',
    '260128037':'Ca 3','260310042':'18h-22h',
    '260312061':'14h-18h','260319046':'Ca 3',
    '260506044':'Ca 3'
  },
  // === May 09 (Sat) ===
  '2026-05-09': {
    '250620054':'HC','260327021':'HC','250919025':'6h-10h',
    '260128037':'Ca 3','260305026':'6h-10h',
    '260310042':'14h-18h','260312061':'14h-18h',
    '260506044':'Ca 2'
  },
  // === May 10 (Sun) ===
  '2026-05-10': {
    '250919025':'Ca 1','260128037':'14h-22h'
  },
  // === May 11 (Mon) ===
  '2026-05-11': {
    '250620054':'HC','260327021':'HC',
    '251010025':'18h-22h','260210044':'18h-22h',
    '260310042':'14h-18h','260312063':'Ca 3',
    '260506044':'Ca 1'
  },
  // === May 12 (Tue) ===
  '2026-05-12': {
    '250620054':'HC','260327021':'HC','250919025':'6h-10h',
    '260128037':'Ca 3','260310042':'18h-22h',
    '260312063':'Ca 3','260506044':'Ca 1'
  },
  // === May 13 (Wed) ===
  '2026-05-13': {
    '250620054':'HC','260327021':'HC-3','250919025':'Ca 1',
    '251010025':'14h-18h','260210044':'18h-22h',
    '260312063':'14h-18h','260319046':'Ca 3',
    '260506044':'Ca 3'
  },
  // === May 14 (Thu) ===
  '2026-05-14': {
    '250620054':'HC','251010025':'14h-18h',
    '260128037':'14h-18h','260210044':'Ca 3'
  },
  // === May 15 (Fri) ===
  '2026-05-15': {
    '250620054':'HC','260327021':'HC','250919025':'6h-10h',
    '260310042':'18h-22h','260312061':'14h-18h',
    '260506044':'Ca 3'
  },
  // === May 16 (Sat) ===
  '2026-05-16': {
    '250620054':'HC','260327021':'HC','250919025':'6h-10h',
    '260128037':'Ca 3','260312063':'OFF',
    '260312061':'Ca 3','260319046':'Ca 3',
    '260506044':'Ca 2'
  },
  // === May 17 (Sun) ===
  '2026-05-17': {
    '250919025':'6h-10h','251010025':'10h-14h',
    '260128037':'14h-18h','260312063':'Ca 3',
    '260506044':'Ca 2'
  },
  // === May 18 (Mon) ===
  '2026-05-18': {
    '250620054':'HC','260327021':'HC','250919025':'1(VN0389)','260128037':'18h-22h(Sky9)','260210044':'18h-22h','260310042':'14h-18h','260312063':'Ca 3','260506044':'Ca 1'
  },
  // === May 19 (Tue) ===
  '2026-05-19': {
    '260327021':'HC','260128037':'Ca 3','260310042':'18h-22h','260312061':'14h-18h','260506044':'Ca 1'
  },
  // === May 20 (Wed) ===
  '2026-05-20': {
    '250620054':'HC','260327021':'HC','250919025':'6h-10h','251010025':'14h-18h','251216025':'10h-14h','260128037':'3(Sky9)','260310042':'18h-22h','260312061':'14h-18h(Sky9)','260319046':'3(VN0389)','260506044':'Ca 3'
  },
  // === May 21 (Thu) ===
  '2026-05-21': {
    '250620054':'HC','260327021':'HC','250919025':'14h-18h','251216025':'Ca 1','260210044':'Ca 3','260312063':'18h-22h','260312061':'3(VN0368)'
  },
  // === May 22 (Fri) ===
  '2026-05-22': {
    '250620054':'HC','260327021':'HC','251010025':'14h-18h','251216025':'Ca 1','260128037':'3(VN0368)','260310042':'18h-22h','260506044':'Ca 3'
  },
  // === May 23 (Sat) ===
  '2026-05-23': {
    '260327021':'HC','250919025':'6h-10h','260128037':'3(Sky9)','260310042':'18h-22h(Sky9)','260319046':'Ca 3','260506044':'Ca 2'
  },
  // === May 24 (Sun) ===
  '2026-05-24': {
    '250919025':'1(VN0164)','260128037':'Ca 2','260312063':'Ca 3','260506044':'Ca 1'
  },
};
