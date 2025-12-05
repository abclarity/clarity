// scripts/storage.js
// LocalStorage-Verwaltung für Monats-Daten (Multi-Funnel Support)

(function(window) {
  const MONTH_LIST_KEY = "vsl_months"; // [{y:2025, m:10}, ...] (Legacy)
  const LEGACY_KEY = "vsl_nov2025";    // Migration von v3.2

  // === Storage-Key für einen Monat (Legacy) ===
  function keyOf(y, mIndex) {
    const mm = String(mIndex + 1).padStart(2, "0");
    return `vsl_${y}_${mm}`;
  }

  // === Storage-Key für einen Monat MIT Funnel ===
  function keyOfFunnel(funnelId, y, mIndex) {
    const mm = String(mIndex + 1).padStart(2, "0");
    return `vsl_${funnelId}_${y}_${mm}`;
  }

  // === Monatsdaten laden (Legacy) ===
  function loadMonthData(y, mIndex) {
    try {
      const key = keyOf(y, mIndex);
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : {};
    } catch (err) {
      console.error("❌ Fehler beim Laden von Monatsdaten:", err);
      if (window.Toast) {
        window.Toast.error('Fehler beim Laden der Monatsdaten');
      }
      return {};
    }
  }

  // === Monatsdaten speichern (Legacy) ===
  function saveMonthData(y, mIndex, obj) {
    try {
      const key = keyOf(y, mIndex);
      localStorage.setItem(key, JSON.stringify(obj || {}));
    } catch (err) {
      console.error("❌ Fehler beim Speichern:", err);
      if (window.Toast) {
        if (err.name === 'QuotaExceededError') {
          window.Toast.error('Speicher voll! Bitte lösche Browser-Cache oder alte Monate.');
        } else {
          window.Toast.error('Fehler beim Speichern der Daten');
        }
      }
    }
  }

  // === Monatsdaten löschen (Legacy) ===
  function deleteMonthData(y, mIndex) {
    try {
      localStorage.removeItem(keyOf(y, mIndex));
    } catch (err) {
      console.error("❌ Fehler beim Löschen:", err);
    }
  }

  // === 🔥 NEU: Monatsdaten für spezifischen Funnel laden ===
  function loadMonthDataForFunnel(funnelId, y, mIndex) {
    try {
      const key = keyOfFunnel(funnelId, y, mIndex);
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : {};
    } catch (err) {
      console.error("❌ Fehler beim Laden von Funnel-Monatsdaten:", err);
      if (window.Toast) {
        window.Toast.error('Fehler beim Laden der Funnel-Daten');
      }
      return {};
    }
  }

  // === 🔥 NEU: Monatsdaten für spezifischen Funnel speichern ===
  function saveMonthDataForFunnel(funnelId, y, mIndex, obj) {
    try {
      const key = keyOfFunnel(funnelId, y, mIndex);
      localStorage.setItem(key, JSON.stringify(obj || {}));
    } catch (err) {
      console.error("❌ Fehler beim Speichern:", err);
      if (window.Toast) {
        if (err.name === 'QuotaExceededError') {
          window.Toast.error('Speicher voll! Bitte lösche Browser-Cache oder alte Monate.');
        } else {
          window.Toast.error('Fehler beim Speichern der Funnel-Daten');
        }
      }
    }
  }

  // === 🔥 NEU: Monatsdaten für spezifischen Funnel löschen ===
  function deleteMonthDataForFunnel(funnelId, y, mIndex) {
    try {
      localStorage.removeItem(keyOfFunnel(funnelId, y, mIndex));
    } catch (err) {
      console.error("❌ Fehler beim Löschen:", err);
    }
  }

  // === Liste aller Monate laden (Legacy) ===
  function loadMonthList() {
    try {
      const raw = localStorage.getItem(MONTH_LIST_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      console.error("❌ Fehler beim Laden der Monatsliste:", err);
      return [];
    }
  }

  // === Liste aller Monate speichern (Legacy) ===
  function saveMonthList(list) {
    try {
      localStorage.setItem(MONTH_LIST_KEY, JSON.stringify(list));
    } catch (err) {
      console.error("❌ Fehler beim Speichern der Monatsliste:", err);
    }
  }

  // === Migration: alte v3.2 November-Daten übernehmen ===
  function migrateLegacyIfNeeded() {
    const list = loadMonthList();
    if (list && list.length) return; // bereits migriert

    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      try {
        saveMonthData(2025, 10, JSON.parse(legacy)); // Nov = Index 10
        saveMonthList([{ y: 2025, m: 10 }]);
        localStorage.removeItem(LEGACY_KEY);
        console.log("✅ Legacy-Daten migriert (Nov 2025)");
      } catch (err) {
        console.error("❌ Migration fehlgeschlagen:", err);
      }
    } else {
      // Erststart: leerer November 2025
      saveMonthData(2025, 10, {});
      saveMonthList([{ y: 2025, m: 10 }]);
    }
  }

  // === Export ===
  window.StorageAPI = {
    keyOf,
    keyOfFunnel,                        // 🔥 NEU
    loadMonthData,
    saveMonthData,
    deleteMonthData,
    loadMonthDataForFunnel,             // 🔥 NEU
    saveMonthDataForFunnel,             // 🔥 NEU
    deleteMonthDataForFunnel,           // 🔥 NEU
    loadMonthList,
    saveMonthList,
    migrateLegacyIfNeeded
  };
})(window);