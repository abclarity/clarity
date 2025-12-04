// scripts/funnels.js
// Multi-Funnel Support mit Preset-System

(function(window) {

  const FUNNEL_PRESETS = {
    "classic-qualified-1call": {
      name: "Classic VSL | Qualified Survey | 1-Call Close",
      modules: ["classic-vsl", "survey-qualified", "1-call-close"]
    },
    "classic-qualified-2call": {
      name: "Classic VSL | Qualified Survey | 2-Call Close",
      modules: ["classic-vsl", "survey-qualified", "2-call-close"]
    },
    "classic-nosurvey-1call": {
      name: "Classic VSL | No Survey | 1-Call Close",
      modules: ["classic-vsl-no-survey", "no-survey", "1-call-close"]
    },
    "direct-survey-1call": {
      name: "Direct VSL | Survey | 1-Call Close",
      modules: ["direct-vsl", "survey-unqualified", "1-call-close"]
    },
    "direct-survey-2call": {
      name: "Direct VSL | Survey | 2-Call Close",
      modules: ["direct-vsl", "survey-unqualified", "2-call-close"]
    },
    "direct-call-booking-2call": {
      name: "Direct Call Booking | 2-Call Close",
      modules: ["direct-call-booking", "no-survey", "2-call-close"]
    }
  };

  // === Preset holen (mit Auto-Auswahl Organic-Variante) ===
  function getFunnelPreset(presetId) {
    return FUNNEL_PRESETS[presetId] || FUNNEL_PRESETS["classic-qualified-1call"];
  }

  // === Alle Presets listen ===
  function getAllPresets() {
    return FUNNEL_PRESETS;
  }

  // === Legacy Template (für alte Funnels) ===
  const LEGACY_TEMPLATE = {
    name: "Legacy Ads VSL Funnel",
    modules: ["paid-ads", "classic-vsl", "survey-qualified", "1-call-close", "revenue-paid"]
  };

  function getFunnelTemplate(type) {
    return LEGACY_TEMPLATE;
  }

  // === Funnel-Config aus Modulen generieren ===
  function getFunnelConfig(funnel) {
    if (funnel.modules && funnel.modules.length > 0) {
      // 🔥 Nutzt modulares System
      return FunnelModules.buildFunnelFromModules(funnel.modules);
    } else {
      // Fallback: altes System
      return {
        columns: ClarityConfig.ALL_COLUMNS,
        inputs: ClarityConfig.INPUT_KEYS,
        modules: ["paid-ads", "classic-vsl", "survey-qualified", "1-call-close", "revenue-paid"]
      };
    }
  }

  // === Funnels laden ===
  function loadFunnels() {
    try {
      const raw = localStorage.getItem("vsl_funnels");
      return raw ? JSON.parse(raw) : getDefaultFunnels();
    } catch (err) {
      console.error("❌ Fehler beim Laden der Funnels:", err);
      return getDefaultFunnels();
    }
  }

  // === Funnels speichern ===
  function saveFunnels(funnels) {
    try {
      localStorage.setItem("vsl_funnels", JSON.stringify(funnels));
    } catch (err) {
      console.error("❌ Fehler beim Speichern der Funnels:", err);
    }
  }

  // === Default Funnels (mit Modulen!) ===
  function getDefaultFunnels() {
    return [
      {
        id: "fb-ads",
        name: "Facebook Ads",
        type: "classic-qualified-1call",
        modules: ["paid-ads", "classic-vsl", "survey-qualified", "1-call-close", "revenue-paid"],
        color: "#1877f2",
        months: []
      },
      {
        id: "yt-ads",
        name: "YouTube Ads",
        type: "classic-qualified-1call",
        modules: ["paid-ads", "classic-vsl", "survey-qualified", "1-call-close", "revenue-paid"],
        color: "#ff0000",
        months: []
      }
    ];
  }

  // === Aktiven Funnel holen ===
  function getActiveFunnel() {
    return localStorage.getItem("vsl_active_funnel") || "fb-ads";
  }

  // === Aktiven Funnel setzen ===
  function setActiveFunnel(funnelId) {
    localStorage.setItem("vsl_active_funnel", funnelId);
  }

  // === Aktive Funnel-Daten holen ===
  function getActiveFunnelData() {
    const funnels = loadFunnels();
    const activeFunnelId = getActiveFunnel();
    return funnels.find(f => f.id === activeFunnelId) || funnels[0];
  }

  // === Neuen Funnel erstellen ===
  function createFunnel(data) {
    const funnels = loadFunnels();

    const newFunnel = {
      id: data.id || `funnel-${Date.now()}`,
      name: data.name,
      type: data.type || "classic-qualified-1call",
      modules: data.modules || ["paid-ads", "classic-vsl", "survey-qualified", "1-call-close", "revenue-paid"],
      color: data.color || "#333",
      months: []
    };

    funnels.push(newFunnel);
    saveFunnels(funnels);

    return newFunnel;
  }

  // === Migration: Bestehende Monate Facebook zuordnen ===
  function migrateExistingMonths() {
    const funnels = loadFunnels();
    const existingMonths = StorageAPI.loadMonthList();

    const fbFunnel = funnels.find(f => f.id === "fb-ads");
    if (fbFunnel && fbFunnel.months.length === 0 && existingMonths.length > 0) {
      fbFunnel.months = existingMonths;
      saveFunnels(funnels);

      existingMonths.forEach(({ y, m }) => {
        const oldData = StorageAPI.loadMonthData(y, m);

        if (oldData && Object.keys(oldData).length > 0) {
          const fbData = StorageAPI.loadMonthDataForFunnel("fb-ads", y, m);

          if (!fbData || Object.keys(fbData).length === 0) {
            StorageAPI.saveMonthDataForFunnel("fb-ads", y, m, oldData);
            console.log(`✅ Daten migriert: ${y}-${m + 1} → fb-ads (${Object.keys(oldData).length} Einträge)`);
          }
        }
      });

      console.log("✅ Bestehende Monate zu Facebook Ads migriert:", existingMonths.length);
    }
  }

  // === Export ===
  window.FunnelAPI = {
    loadFunnels,
    saveFunnels,
    getActiveFunnel,
    setActiveFunnel,
    getActiveFunnelData,
    getFunnelTemplate,
    getFunnelConfig,
    getFunnelPreset,
    getAllPresets,
    createFunnel,
    migrateExistingMonths
  };

})(window);
