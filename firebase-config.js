// ===== FIREBASE CONFIG & FIRESTORE HELPERS =====
// Initialize Firebase (compat SDK for vanilla JS)
const firebaseConfig = {
  apiKey: "AIzaSyBnP8V6xWabk0cfGhwY4AdPX829rPPRnf4",
  authDomain: "bourbon-d0505.firebaseapp.com",
  projectId: "bourbon-d0505",
  storageBucket: "bourbon-d0505.firebasestorage.app",
  messagingSenderId: "935278237286",
  appId: "1:935278237286:web:2b8183abb241ac932fffa7",
  measurementId: "G-TEV7YQWQBZ"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Enable offline persistence
db.enablePersistence({ synchronizeTabs: true }).catch(err => {
  console.warn('Firestore persistence error:', err.code);
});

// ===== FIRESTORE DATA HELPERS =====
const STORE_COLLECTION = 'gs25_store';

const FireDB = {
  // Save a specific data section
  async save(section, data) {
    try {
      await db.collection(STORE_COLLECTION).doc(section).set({ items: data, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
      console.log(`✅ Saved ${section} to Firebase`);
      return true;
    } catch (err) {
      console.error(`❌ Error saving ${section}:`, err);
      return false;
    }
  },

  // Load a specific data section
  async load(section) {
    try {
      const doc = await db.collection(STORE_COLLECTION).doc(section).get();
      if (doc.exists) {
        return doc.data().items;
      }
      return null;
    } catch (err) {
      console.error(`❌ Error loading ${section}:`, err);
      return null;
    }
  },

  // Save all data at once
  async saveAll() {
    const batch = db.batch();
    const ts = firebase.firestore.FieldValue.serverTimestamp();
    
    batch.set(db.collection(STORE_COLLECTION).doc('schedule'), { items: SCHEDULE, updatedAt: ts });
    batch.set(db.collection(STORE_COLLECTION).doc('checklists'), { items: CHECKLISTS, updatedAt: ts });

    try {
      await batch.commit();
      console.log('✅ All data saved to Firebase');
      return true;
    } catch (err) {
      console.error('❌ Error saving all:', err);
      return false;
    }
  },

  // Load all data from Firestore
  async loadAll() {
    try {
      const snapshot = await db.collection(STORE_COLLECTION).get();
      const data = {};
      snapshot.forEach(doc => { data[doc.id] = doc.data().items; });
      return data;
    } catch (err) {
      console.error('❌ Error loading all:', err);
      return null;
    }
  },

  // Save admin password
  async savePassword(pw) {
    try {
      await db.collection(STORE_COLLECTION).doc('settings').set(
        { adminPassword: pw, updatedAt: firebase.firestore.FieldValue.serverTimestamp() },
        { merge: true }
      );
      return true;
    } catch (err) {
      console.error('❌ Error saving password:', err);
      return false;
    }
  },

  // Load admin password
  async loadPassword() {
    try {
      const doc = await db.collection(STORE_COLLECTION).doc('settings').get();
      if (doc.exists && doc.data().adminPassword) {
        return doc.data().adminPassword;
      }
      return null;
    } catch (err) {
      console.error('❌ Error loading password:', err);
      return null;
    }
  },

  // Save notes
  async saveNotes(notesData) {
    try {
      await db.collection(STORE_COLLECTION).doc('notes').set({ items: notesData, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
      return true;
    } catch (err) {
      console.error('❌ Error saving notes:', err);
      return false;
    }
  },

  // Load notes
  async loadNotes() {
    try {
      const doc = await db.collection(STORE_COLLECTION).doc('notes').get();
      if (doc.exists) return doc.data().items;
      return null;
    } catch (err) {
      console.error('❌ Error loading notes:', err);
      return null;
    }
  },

  // Save checklist progress
  async saveChecked(checkedData) {
    try {
      await db.collection(STORE_COLLECTION).doc('checked').set({ items: checkedData, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
      return true;
    } catch (err) { return false; }
  },

  // Load checklist progress
  async loadChecked() {
    try {
      const doc = await db.collection(STORE_COLLECTION).doc('checked').get();
      if (doc.exists) return doc.data().items;
      return null;
    } catch (err) { return null; }
  },

  // Listen for real-time updates on a section
  onUpdate(section, callback) {
    return db.collection(STORE_COLLECTION).doc(section).onSnapshot(doc => {
      if (doc.exists && doc.data().items) {
        callback(doc.data().items);
      }
    }, err => {
      console.error(`❌ Listener error on ${section}:`, err);
    });
  },

  // Delete all data (for reset)
  async deleteAll() {
    const snapshot = await db.collection(STORE_COLLECTION).get();
    const batch = db.batch();
    snapshot.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  },

  // ===== DAILY SCHEDULE =====
  // Save shifts for a single date: { employeeId: 'shift', ... }
  async saveDailyShifts(dateKey, shifts) {
    try {
      await db.collection('daily_schedules').doc(dateKey).set({
        shifts,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      console.log(`✅ Saved daily schedule for ${dateKey}`);
      return true;
    } catch (err) {
      console.error(`❌ Error saving daily schedule:`, err);
      return false;
    }
  },

  // Load shifts for a single date
  async loadDailyShifts(dateKey) {
    try {
      const doc = await db.collection('daily_schedules').doc(dateKey).get();
      if (doc.exists && doc.data().shifts) return doc.data().shifts;
      return null;
    } catch (err) {
      console.error(`❌ Error loading daily schedule:`, err);
      return null;
    }
  },

  // Load shifts for a date range (for salary calculation)
  async loadDailyRange(startDate, endDate) {
    try {
      const result = {};
      const snapshot = await db.collection('daily_schedules')
        .where(firebase.firestore.FieldPath.documentId(), '>=', startDate)
        .where(firebase.firestore.FieldPath.documentId(), '<=', endDate)
        .get();
      snapshot.forEach(doc => {
        if (doc.data().shifts) result[doc.id] = doc.data().shifts;
      });
      return result;
    } catch (err) {
      console.error('❌ Error loading daily range:', err);
      return {};
    }
  },

  // Upload local SCHEDULE_DAILY to Firebase (one-time seed)
  async uploadDailyDefaults() {
    if (typeof SCHEDULE_DAILY === 'undefined') return;
    const batch = db.batch();
    const ts = firebase.firestore.FieldValue.serverTimestamp();
    let count = 0;
    for (const [dateKey, shifts] of Object.entries(SCHEDULE_DAILY)) {
      if (Object.keys(shifts).length > 0) {
        batch.set(db.collection('daily_schedules').doc(dateKey), { shifts, updatedAt: ts });
        count++;
      }
    }
    if (count > 0) {
      await batch.commit();
      console.log(`✅ Uploaded ${count} daily schedules to Firebase`);
    }
  }
};

// Flag to indicate Firebase is ready
window.FireDB = FireDB;
window.firebaseReady = true;
console.log('🔥 Firebase initialized');
