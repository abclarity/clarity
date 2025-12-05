// scripts/main.js
// Haupt-Controller: Navigation, Tabs, Jahr-Dropdown, Zoom

(function() {
  const tabsEl = document.getElementById("tabs");

  // === Utils ===
  function labelOf(y, mIdx) {
    return new Date(y, mIdx, 1).toLocaleDateString("de-DE", {
      month: "short",
      year: "numeric"
    });
  }

  function compareDesc(a, b) {
    if (a.y !== b.y) return b.y - a.y;
    return b.m - a.m;
  }

  function nextMonthOf(list) {
    if (!list.length) return { y: 2025, m: 10 };
    const newest = [...list].sort(compareDesc)[0];
    const d = new Date(newest.y, newest.m, 1);
    d.setMonth(d.getMonth() + 1);
    return { y: d.getFullYear(), m: d.getMonth() };
  }

  // === ZOOM-FUNKTION ===
  window.globalZoomInit = function() {
    console.log("🔧 globalZoomInit aufgerufen");

    const zoomArea = document.getElementById("zoomArea");
    const zoomDisplay = document.getElementById("zoomDisplay");
    const btnIn = document.getElementById("zoomIn");
    const btnOut = document.getElementById("zoomOut");

    if (!zoomArea || !zoomDisplay) {
      console.error("❌ Zoom-Elemente fehlen!");
      return;
    }

    let zoomValue = parseInt(localStorage.getItem("globalZoom") || "100");

    function applyZoom() {
      const scale = Math.min(2, Math.max(0.5, zoomValue / 100));
      zoomArea.style.transform = `scale(${scale})`;
      zoomArea.style.transformOrigin = "top left";
      zoomDisplay.textContent = zoomValue + "%";
      localStorage.setItem("globalZoom", zoomValue);

      // 🔥 Container-Größe dynamisch anpassen, um Extra-Scroll zu verhindern
      requestAnimationFrame(() => {
        const wrapper = zoomArea.parentElement;
        if (wrapper && wrapper.classList.contains('table-wrap')) {
          // Hole die originale Größe des Inhalts (vor Scaling)
          const table = zoomArea.querySelector('table');
          if (table) {
            const originalWidth = table.offsetWidth;
            const originalHeight = table.offsetHeight;

            // Berechne die tatsächliche Größe nach dem Scaling
            const scaledWidth = originalWidth * scale;
            const scaledHeight = originalHeight * scale;

            // Setze die Wrapper-Größe auf die skalierte Größe
            // Bei 100% oder mehr: Auto-Größe (normal responsive)
            if (scale >= 1) {
              wrapper.style.width = 'fit-content';
              wrapper.style.height = 'auto';
            } else {
              // Bei weniger als 100%: Fixe Größe basierend auf Scale
              wrapper.style.width = `${scaledWidth}px`;
              wrapper.style.height = `${scaledHeight}px`;
            }
          }
        }
      });
    }

    if (btnIn) {
      btnIn.addEventListener("click", () => {
        zoomValue = Math.min(200, zoomValue + 5);
        applyZoom();
      });
    }

    if (btnOut) {
      btnOut.addEventListener("click", () => {
        zoomValue = Math.max(50, zoomValue - 5);
        applyZoom();
      });
    }

    applyZoom();
  };

  window.buildGlobalHeader = function(currentYear) {
    const header = document.getElementById("app-header");
    const funnels = FunnelAPI.loadFunnels();
    const activeFunnelId = FunnelAPI.getActiveFunnel();

    const funnelButtons = funnels.map(funnel => {
      const isActive = funnel.id === activeFunnelId ? 'active' : '';
      return `<button
        id="${funnel.id}Btn"
        class="funnel-btn ${isActive}"
        data-funnel-id="${funnel.id}"
        data-color="${funnel.color}"
        style="--funnel-color: ${funnel.color};"
      >${funnel.name}</button>`;
    }).join('');

    header.innerHTML = `
      <div class="header-bar">
        <div class="left-header">
          <div class="year-select">
            <button id="yearSelectBtn" class="year-btn">${currentYear}</button>
            <div id="yearDropdown" class="year-dropdown hidden"></div>
          </div>
          <div class="funnel-buttons-container">
            ${funnelButtons}
          </div>
          <button id="addFunnelBtn" class="add-funnel-btn" title="Neuen Funnel hinzufügen">+</button>
        </div>
        <div class="header-separator"></div>
        <div class="right-header">
          <button id="importDataBtn" class="import-btn" title="Daten importieren">
            📥 Upload
          </button>
          <div class="zoom-controls">
            <button id="zoomOut">−</button>
            <span id="zoomDisplay">100%</span>
            <button id="zoomIn">+</button>
          </div>
        </div>
      </div>
    `;

    setupYearDropdown(currentYear);
    setupFunnelButtons();
    setupAddFunnelButton();

    // 🔥 Import-Button NACH jedem Header-Rebuild aktivieren
    if (window.setupImportButton) {
      window.setupImportButton();
    }
  };

  // === Funnel-Buttons Setup ===
  function setupFunnelButtons() {
    const buttons = document.querySelectorAll('.funnel-btn');

    buttons.forEach(btn => {
      const funnelId = btn.dataset.funnelId;

      btn.addEventListener('click', () => {
        console.log(`🔘 Funnel geklickt: ${funnelId}`);
        switchToFunnel(funnelId);
      });

      btn.addEventListener('contextmenu', e => {
        e.preventDefault();
        openFunnelContextMenu(e, funnelId);
      });
    });
  }

  // === Add Funnel Button Setup ===
  function setupAddFunnelButton() {
    const btn = document.getElementById('addFunnelBtn');
    if (!btn) return;

    btn.addEventListener('click', () => {
      console.log('➕ Neuen Funnel hinzufügen');
      openAddFunnelModal();
    });
  }

  // === Add Funnel Modal öffnen ===
  function openAddFunnelModal() {
    // 🔥 Wizard initialisieren
    if (window.WizardAPI && window.WizardAPI.initWizard) {
      window.WizardAPI.initWizard();
    }

    // 🔥 Standard: Wizard anzeigen, Preset verstecken
    const presetMode = document.getElementById('presetMode');
    const wizardMode = document.getElementById('wizardMode');

    if (presetMode) {
      presetMode.classList.add('hidden');
      presetMode.style.display = 'none';  // 🔥 FORCE
    }

    if (wizardMode) {
      wizardMode.classList.remove('hidden');
      wizardMode.style.display = 'block';  // 🔥 FORCE
    }

    // 🔥 Toggle-Buttons korrekt setzen
    const wizardBtn = document.getElementById('wizardModeBtn');
    const presetBtn = document.getElementById('presetModeBtn');

    if (wizardBtn && presetBtn) {
      wizardBtn.classList.add('active');     // 🔥 Wizard aktiv
      presetBtn.classList.remove('active');  // 🔥 Preset inaktiv
    }

    const modal = document.getElementById('funnelModal');
    const form = document.getElementById('funnelForm');
    const nameInput = document.getElementById('funnelNameInput');
    const cancelBtn = document.getElementById('cancelFunnelModal');

    // Template & Traffic Select erstellen
    const oldTemplateRow = form.querySelector('.template-row');
    if (oldTemplateRow) oldTemplateRow.remove();

    const templateRow = document.createElement('div');
    templateRow.className = 'template-row';
    templateRow.style.cssText = 'margin-top: 16px;';

    const presets = FunnelAPI.getAllPresets();
    const templateOptions = Object.entries(presets)
      .map(([id, preset]) => `<option value="${id}">${preset.name}</option>`)
      .join('');

    templateRow.innerHTML = `
      <label style="display: block; margin-bottom: 16px;">
        Template:
        <select id="templateSelect" style="width: 100%; margin-top: 8px; padding: 8px; border: 1px solid #ccc; border-radius: 6px; font-size: 14px;">
          ${templateOptions}
          <option value="custom">🔧 Custom Funnel (Wizard)</option>
        </select>
      </label>

      <label style="display: block; margin-bottom: 16px;">
        Traffic-Quelle:
      </label>
      <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px;">
        <label style="display: flex; align-items: center;">
          <input type="radio" name="traffic" value="paid-ads" checked style="margin-right: 8px;" />
          Paid Ads
        </label>
        <label style="display: flex; align-items: center;">
          <input type="radio" name="traffic" value="cold-email" style="margin-right: 8px;" />
          Cold Email
        </label>
        <label style="display: flex; align-items: center;">
          <input type="radio" name="traffic" value="cold-calls" style="margin-right: 8px;" />
          Cold Calls
        </label>
        <label style="display: flex; align-items: center;">
          <input type="radio" name="traffic" value="organic" style="margin-right: 8px;" />
          Organic
        </label>
      </div>
    `;

    nameInput.parentElement.after(templateRow);

    // Farb-Auswahl
    const colorOptions = document.querySelectorAll('.color-option');
    let selectedColor = '#9146ff';

    colorOptions.forEach(option => {
      option.addEventListener('click', () => {
        colorOptions.forEach(opt => opt.classList.remove('active'));
        option.classList.add('active');
        selectedColor = option.dataset.color;
      });
    });

    modal.classList.remove('hidden');
    nameInput.value = '';
    nameInput.focus();

    cancelBtn.onclick = () => modal.classList.add('hidden');

    form.onsubmit = e => {
      e.preventDefault();

      const name = nameInput.value.trim();
      if (!name) {
        if (window.Toast) {
          window.Toast.warning('Bitte gib einen Namen ein!');
        }
        return;
      }

      const templateSelect = document.getElementById('templateSelect');
      const presetId = templateSelect.value;

      const trafficRadio = form.querySelector('input[name="traffic"]:checked');
      const trafficModule = trafficRadio ? trafficRadio.value : 'paid-ads';

      const revenueModule = trafficModule === 'organic' || trafficModule === 'cold-email' || trafficModule === 'cold-calls'
        ? 'revenue-organic'
        : 'revenue-paid';

      if (presetId === 'custom') {
        alert('Custom Wizard kommt in Phase 2! 🚀\nNutze vorerst die Presets.');
        return;
      }

      const preset = FunnelAPI.getFunnelPreset(presetId);
      if (!preset) {
        if (window.Toast) {
          window.Toast.error('Template nicht gefunden!');
        }
        return;
      }

      // Module kombinieren: Traffic + Preset + Revenue
      let modules = [trafficModule, ...preset.modules, revenueModule];

      // 🔥 Auto-Switch: Wenn Organic/Cold Email/Cold Calls → use organic variants
      if (trafficModule === 'organic' || trafficModule === 'cold-email' || trafficModule === 'cold-calls') {
        modules = modules.map(m => {
          // Funnel-Module
          if (m === 'classic-vsl') return 'classic-vsl-organic';
          if (m === 'direct-vsl') return 'direct-vsl-organic';
          if (m === 'classic-vsl-no-survey') return 'classic-vsl-no-survey-organic';
          // Qualification-Module
          if (m === 'survey-qualified') return 'survey-qualified-organic';
          // Close-Module
          if (m === '1-call-close') return '1-call-close-organic';
          if (m === '2-call-close') return '2-call-close-organic';

          // 🔥 NEU: Cold Calls braucht keine "Clicks"-Spalte
          if (trafficModule === 'cold-calls' && m === 'direct-call-booking') {
            return 'direct-call-booking-coldcalls';
          }

          return m;
        });
      }

      const newFunnel = FunnelAPI.createFunnel({
        name: name,
        type: presetId,
        modules: modules,
        color: selectedColor
      });

      console.log('✅ Neuer Funnel erstellt:', newFunnel);

      if (window.Toast) {
        window.Toast.success(`Funnel "${name}" erfolgreich erstellt!`);
      }

      modal.classList.add('hidden');
      switchToFunnel(newFunnel.id);
    };
  }

  // === Zu anderem Funnel wechseln ===
  function switchToFunnel(funnelId) {
    FunnelAPI.setActiveFunnel(funnelId);

    const funnelData = FunnelAPI.getActiveFunnelData();
    const lastActive = loadLastActiveForFunnel(funnelId);

    if (lastActive) {
      if (lastActive.type === "month") {
        window.activeYear = lastActive.y;
        switchToMonth(lastActive.y, lastActive.m);
      } else {
        window.activeYear = lastActive.y;
        switchToYear(lastActive.y);
      }
    } else {
      if (funnelData.months.length > 0) {
        const sorted = [...funnelData.months].sort(compareDesc);
        window.activeYear = sorted[0].y;
        switchToMonth(sorted[0].y, sorted[0].m);
      } else {
        switchToYear(window.activeYear);
      }
    }
  }

  // === Letzten aktiven Stand für Funnel laden ===
  function loadLastActiveForFunnel(funnelId) {
    try {
      const key = `vsl_last_active_${funnelId}`;
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      console.error("❌ Fehler beim Laden des letzten Stands:", err);
      return null;
    }
  }

  // === Letzten aktiven Stand für Funnel speichern ===
  function saveLastActiveForFunnel(funnelId, data) {
    try {
      const key = `vsl_last_active_${funnelId}`;
      localStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
      console.error("❌ Fehler beim Speichern des letzten Stands:", err);
    }
  }

  // === Jahr-Dropdown Setup ===
  function setupYearDropdown(currentYear) {
    const btn = document.getElementById("yearSelectBtn");
    const dropdown = document.getElementById("yearDropdown");

    if (!btn || !dropdown) return;

    const activeFunnel = FunnelAPI.getActiveFunnelData();
    const years = [...new Set(activeFunnel.months.map(m => m.y))].sort((a, b) => b - a);

    if (years.length === 0) {
      years.push(window.activeYear);
    }

    dropdown.innerHTML = years
      .map(y => `<div class="year-option" data-year="${y}">${y}</div>`)
      .join("");

    btn.onclick = e => {
      e.stopPropagation();
      dropdown.classList.toggle("hidden");
    };

    dropdown.onclick = e => {
      const opt = e.target.closest(".year-option");
      if (!opt) return;

      const year = parseInt(opt.dataset.year, 10);
      window.activeYear = year;
      dropdown.classList.add("hidden");

      switchToYear(year);
    };
  }

  // === Navigation ===
  let activeView = "month";
  let activeMonth = null;
  window.activeYear = 2025;

  // === Switch to Funnel ===
  function switchToFunnel(funnelId) {
    console.log('🔄 Switching to funnel:', funnelId);

    FunnelAPI.setActiveFunnel(funnelId);

    const funnelData = FunnelAPI.getActiveFunnelData();
    const lastActive = loadLastActiveForFunnel(funnelId);

    if (lastActive) {
      if (lastActive.type === "month") {
        window.activeYear = lastActive.y;
        switchToMonth(lastActive.y, lastActive.m);
      } else {
        window.activeYear = lastActive.y;
        switchToYear(lastActive.y);
      }
    } else {
      if (funnelData.months.length > 0) {
        const sorted = [...funnelData.months].sort(compareDesc);
        window.activeYear = sorted[0].y;
        switchToMonth(sorted[0].y, sorted[0].m);
      } else {
        switchToYear(window.activeYear);
      }
    }
  }

  // Export globally
  window.switchToFunnel = switchToFunnel;

  // === Switch to Month ===
  window.switchToMonth = function(y, mIdx) {
    activeView = "month";
    activeMonth = { y, m: mIdx };
    window.activeYear = y;

    buildGlobalHeader(y);
    MonthView.loadMonth(y, mIdx);
    renderTabs({ y, m: mIdx });

    const activeFunnelId = FunnelAPI.getActiveFunnel();
    saveLastActiveForFunnel(activeFunnelId, { type: "month", y, m: mIdx });

    localStorage.setItem(
      "vsl_last_active",
      JSON.stringify({ type: "month", y, m: mIdx })
    );
  };
  // === Switch to Year ===
  window.switchToYear = function(y) {
    activeView = "year";
    activeMonth = null;
    window.activeYear = y;

    buildGlobalHeader(y);
    YearView.loadYear(y);
    renderTabs(null);

    const activeFunnelId = FunnelAPI.getActiveFunnel();
    saveLastActiveForFunnel(activeFunnelId, { type: "year", y });

    localStorage.setItem(
      "vsl_last_active",
      JSON.stringify({ type: "year", y })
    );
  };

  // === Tabs rendern ===
  window.renderTabs = function(active) {
    tabsEl.innerHTML = "";

    const dash = document.createElement("button");
    dash.id = "dashTab";
    dash.className = "tab";
    dash.textContent = `${activeYear} Dashboard`;
    dash.addEventListener("click", () => switchToYear(activeYear));
    dash.classList.toggle("active", activeView === "year");
    tabsEl.appendChild(dash);

    const sep1 = document.createElement("div");
    sep1.className = "tab-separator";
    tabsEl.appendChild(sep1);

    const scrollContainer = document.createElement("div");
    scrollContainer.className = "tabs-scroll-container";
    scrollContainer.id = "tabsScrollContainer";

    const activeFunnel = FunnelAPI.getActiveFunnelData();
    const months = (activeFunnel.months || [])
      .filter(m => m.y === activeYear)
      .sort(compareDesc);

    months.forEach(mm => {
      const btn = document.createElement("button");
      btn.className = "tab";
      btn.textContent = labelOf(mm.y, mm.m);

      btn.addEventListener("click", () => switchToMonth(mm.y, mm.m));

      btn.addEventListener("contextmenu", e => {
        e.preventDefault();
        openContextMenu(e, { y: mm.y, m: mm.m });
      });

      if (
        activeView === "month" &&
        activeMonth &&
        activeMonth.y === mm.y &&
        activeMonth.m === mm.m
      ) {
        btn.classList.add("active");
      }

      scrollContainer.appendChild(btn);
    });

    tabsEl.appendChild(scrollContainer);

    const sep2 = document.createElement("div");
    sep2.className = "tab-separator";
    tabsEl.appendChild(sep2);

    const addBtn = document.createElement("button");
    addBtn.id = "addTab";
    addBtn.className = "tab add";
    addBtn.textContent = "+";
    addBtn.addEventListener("click", addMonthFlow);
    tabsEl.appendChild(addBtn);
  };

  function addMonthFlow() {
    const modal = document.getElementById("monthModal");
    const form = document.getElementById("monthForm");
    const suggestedSpan = document.getElementById("suggestedMonth");
    const cancelBtn = document.getElementById("cancelModal");
    const yearInput = document.getElementById("yearInput");
    const monthInput = document.getElementById("monthInput");
    const customFields = document.querySelector(".custom-fields");

    // 🔥 Nutze Monate des AKTIVEN Funnels! 
    const activeFunnel = FunnelAPI.getActiveFunnelData();
    const months = activeFunnel.months || [];

    // 🔥 Intelligenter Fallback
    let suggest;
    if (months.length === 0) {
      // Kein Monat vorhanden → aktueller Monat
      const now = new Date();
      suggest = { y: now.getFullYear(), m: now.getMonth() };
    } else {
      // Monate vorhanden → nächster Monat
      suggest = nextMonthOf(months);
    }

    const label = new Date(suggest.y, suggest.m, 1).toLocaleDateString("de-DE", {
      month: "long",
      year: "numeric"
    });
    suggestedSpan.textContent = label;

    modal.classList.remove("hidden");

    form.querySelectorAll("input[name='mode']").forEach(radio => {
      radio.addEventListener("change", e => {
        customFields.classList.toggle("hidden", e.target.value !== "custom");
      });
    });

    cancelBtn.onclick = () => modal.classList.add("hidden");

    form.onsubmit = e => {
      e.preventDefault();

      let target = suggest;
      const mode = form.querySelector("input[name='mode']:checked").value;

      if (mode === "custom") {
        const y = parseInt(yearInput.value, 10);
        const mIdx = parseInt(monthInput.value, 10);
        target = { y, m: mIdx };
      }

      const funnels = FunnelAPI.loadFunnels();
      const activeFunnelId = FunnelAPI.getActiveFunnel();
      const activeFunnel = funnels.find(f => f.id === activeFunnelId);

      if (activeFunnel) {
        const exists = activeFunnel.months.some(mm => mm.y === target.y && mm.m === target.m);

        if (!exists) {
          activeFunnel.months.push(target);
          FunnelAPI.saveFunnels(funnels);
          StorageAPI.saveMonthDataForFunnel(activeFunnelId, target.y, target.m, {});
        }
      }

      modal.classList.add('hidden');
      switchToMonth(target.y, target.m);
    };
  }

  // === Kontextmenü (Rechtsklick auf Tab) ===
  const menu = document.getElementById("contextMenu");
  const delBtn = document.getElementById("deleteMonthBtn");
  const resetBtn = document.getElementById("resetMonthBtn");
  let contextTarget = null;

  function openContextMenu(e, monthObj) {
    contextTarget = monthObj;
    menu.style.display = "block";

    let menuLeft = e.pageX;
    let menuTop = e.pageY;

    const menuHeight = menu.offsetHeight || 100;
    const screenHeight = window.innerHeight;

    if (e.pageY + menuHeight > screenHeight) {
      menuTop = e.pageY - menuHeight - 10;
    }

    menu.style.left = menuLeft + "px";
    menu.style.top = menuTop + "px";
  }

  resetBtn.addEventListener("click", () => {
    if (!contextTarget) return;

    const { y, m } = contextTarget;
    if (y == null || m == null) return;

    const label = new Date(y, m).toLocaleDateString("de-DE", {
      month: "long",
      year: "numeric"
    });

    if (confirm(`Daten für ${label} wirklich löschen?`)) {
      const activeFunnelId = FunnelAPI.getActiveFunnel();
      StorageAPI.saveMonthDataForFunnel(activeFunnelId, y, m, {});
      MonthView.loadMonth(y, m);
    }

    menu.style.display = "none";
  });

  delBtn.addEventListener("click", () => {
    if (!contextTarget) return;

    const label = labelOf(contextTarget.y, contextTarget.m);

    if (confirm(`${label} wirklich löschen?`)) {
      const funnels = FunnelAPI.loadFunnels();
      const activeFunnelId = FunnelAPI.getActiveFunnel();
      const activeFunnel = funnels.find(f => f.id === activeFunnelId);

      if (activeFunnel) {
        activeFunnel.months = activeFunnel.months.filter(
          m => !(m.y === contextTarget.y && m.m === contextTarget.m)
        );
        FunnelAPI.saveFunnels(funnels);
        StorageAPI.deleteMonthDataForFunnel(activeFunnelId, contextTarget.y, contextTarget.m);
      }

      renderTabs(null);

      const months = (activeFunnel.months || []).sort(compareDesc);
      if (months.length) {
        switchToMonth(months[0].y, months[0].m);
      } else {
        switchToYear(activeYear);
      }
    }

    menu.style.display = "none";
  });

  // === Funnel-Kontextmenü ===
  const funnelMenu = document.getElementById("funnelContextMenu");
  const renameFunnelBtn = document.getElementById("renameFunnelBtn");
  const changeColorBtn = document.getElementById("changeColorBtn");
  const deleteFunnelBtn = document.getElementById("deleteFunnelBtn");
  let contextFunnelId = null;

  function openFunnelContextMenu(e, funnelId) {
    contextFunnelId = funnelId;
    funnelMenu.style.display = "block";

    let menuLeft = e.pageX;
    let menuTop = e.pageY;

    const menuHeight = funnelMenu.offsetHeight || 100;
    const screenHeight = window.innerHeight;

    if (e.pageY + menuHeight > screenHeight) {
      menuTop = e.pageY - menuHeight - 10;
    }

    funnelMenu.style.left = menuLeft + "px";
    funnelMenu.style.top = menuTop + "px";
  }

  renameFunnelBtn.addEventListener("click", () => {
    if (!contextFunnelId) return;

    const funnels = FunnelAPI.loadFunnels();
    const funnel = funnels.find(f => f.id === contextFunnelId);

    if (!funnel) return;

    const modal = document.getElementById("renameFunnelModal");
    const form = document.getElementById("renameForm");
    const input = document.getElementById("renameInput");
    const cancelBtn = document.getElementById("cancelRename");

    modal.classList.remove("hidden");
    input.value = funnel.name;
    input.focus();
    input.select();

    cancelBtn.onclick = () => modal.classList.add("hidden");

    form.onsubmit = e => {
      e.preventDefault();

      const newName = input.value.trim();
      if (!newName) {
        if (window.Toast) {
          window.Toast.warning("Bitte gib einen Namen ein!");
        }
        return;
      }

      funnel.name = newName;
      FunnelAPI.saveFunnels(funnels);

      modal.classList.add("hidden");
      buildGlobalHeader(window.activeYear);
      setupFunnelButtons();
      setupAddFunnelButton();

      if (window.Toast) {
        window.Toast.success(`Funnel umbenannt in "${newName}"`);
      }

      console.log(`✅ Funnel umbenannt: ${contextFunnelId} → ${newName}`);
    };

    funnelMenu.style.display = "none";
  });

  changeColorBtn.addEventListener("click", () => {
    if (!contextFunnelId) return;

    const funnels = FunnelAPI.loadFunnels();
    const funnel = funnels.find(f => f.id === contextFunnelId);

    if (!funnel) return;

    const modal = document.getElementById("changeColorModal");
    const form = document.getElementById("colorForm");
    const cancelBtn = document.getElementById("cancelColor");
    const colorOptions = document.querySelectorAll("#colorPickerEdit .color-option");

    let selectedColor = funnel.color;

    colorOptions.forEach(option => {
      option.classList.toggle("active", option.dataset.color === funnel.color);

      option.onclick = () => {
        colorOptions.forEach(opt => opt.classList.remove("active"));
        option.classList.add("active");
        selectedColor = option.dataset.color;
      };
    });

    modal.classList.remove("hidden");
    cancelBtn.onclick = () => modal.classList.add("hidden");

    form.onsubmit = e => {
      e.preventDefault();

      funnel.color = selectedColor;
      FunnelAPI.saveFunnels(funnels)

      modal.classList.add("hidden");
      buildGlobalHeader(window.activeYear);
      setupFunnelButtons();
      setupAddFunnelButton();

      if (window.Toast) {
        window.Toast.success('Farbe erfolgreich geändert');
      }

      console.log(`✅ Farbe geändert: ${contextFunnelId} → ${selectedColor}`);
    };

    funnelMenu.style.display = "none";
  });

  deleteFunnelBtn.addEventListener("click", () => {
    if (!contextFunnelId) return;

    let funnels = FunnelAPI.loadFunnels();
    const funnel = funnels.find(f => f.id === contextFunnelId);

    if (!funnel) return;

    if (funnels.length <= 1) {
      if (window.Toast) {
        window.Toast.warning("Du kannst den letzten Funnel nicht löschen!");
      }
      funnelMenu.style.display = "none";
      return;
    }

    // 🔥 Modal öffnen statt confirm()
    const deleteModal = document.getElementById("deleteFunnelModal");
    const deleteFunnelName = document.getElementById("deleteFunnelName");
    const cancelBtn = document.getElementById("cancelDeleteFunnel");
    const confirmBtn = document.getElementById("confirmDeleteFunnel");

    deleteFunnelName.textContent = funnel.name;
    deleteModal.classList.remove("hidden");
    funnelMenu.style.display = "none";

    // Abbrechen
    cancelBtn.onclick = () => {
      deleteModal.classList.add("hidden");
    };

    // Bestätigen
    confirmBtn.onclick = () => {
      const activeFunnelId = FunnelAPI.getActiveFunnel();
      const isActive = contextFunnelId === activeFunnelId;

      // Daten löschen
      funnel.months.forEach(({ y, m }) => {
        StorageAPI.deleteMonthDataForFunnel(contextFunnelId, y, m);
      });

      // Funnel aus Liste entfernen
      funnels = funnels.filter(f => f.id !== contextFunnelId);
      FunnelAPI.saveFunnels(funnels);

      // 🔥 Wenn aktiver Funnel gelöscht wird → zum ersten verfügbaren wechseln
      if (isActive && funnels.length > 0) {
        const nextFunnel = funnels[0];
        FunnelAPI.setActiveFunnel(nextFunnel.id);

        if (nextFunnel.months.length > 0) {
          const sorted = [...nextFunnel.months].sort((a, b) => {
            if (a.y !== b.y) return b.y - a.y;
            return b.m - a.m;
          });
          switchToMonth(sorted[0].y, sorted[0].m);
        } else {
          switchToYear(window.activeYear);
        }
      } else {
        buildGlobalHeader(window.activeYear);
        setupFunnelButtons();
        setupAddFunnelButton();
      }

      if (window.Toast) {
        window.Toast.success('Funnel erfolgreich gelöscht');
      }

      console.log(`✅ Funnel gelöscht: ${contextFunnelId}`);
      deleteModal.classList.add("hidden");
    };
  });

  // === Menüs schließen ===
  window.addEventListener("click", e => {
    setTimeout(() => {
      const menu = document.getElementById("contextMenu");
      const funnelMenu = document.getElementById("funnelContextMenu");
      const dropdown = document.getElementById("yearDropdown");
      const yearBtn = document.getElementById("yearSelectBtn");

      const clickInsideDropdown = dropdown && dropdown.contains(e.target);
      const clickInsideMenu = menu && menu.contains(e.target);
      const clickInsideFunnelMenu = funnelMenu && funnelMenu.contains(e.target);
      const clickOnYearBtn = yearBtn && e.target === yearBtn;

      if (!clickInsideDropdown && !clickInsideMenu && !clickInsideFunnelMenu && !clickOnYearBtn) {
        if (menu) menu.style.display = "none";
        if (funnelMenu) funnelMenu.style.display = "none";
        if (dropdown) dropdown.classList.add("hidden");
      }
    }, 80);
  });

  // === Init ===
  StorageAPI.migrateLegacyIfNeeded();
  FunnelAPI.migrateExistingMonths();

  const last = localStorage.getItem("vsl_last_active");

  if (last) {
    const obj = JSON.parse(last);
    if (obj.type === "year") {
      switchToYear(obj.y);
    } else {
      switchToMonth(obj.y, obj.m);
    }
  } else {
    const months = StorageAPI.loadMonthList().sort(compareDesc);
    const first = months[0] || { y: 2025, m: 10 };
    switchToMonth(first.y, first.m);
  }

})();