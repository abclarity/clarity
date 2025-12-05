// scripts/month.js
// Monatsansicht: Tages-Tracking + Weekly-Summaries (Modular)

(function(window) {
  const { calculateKPIs, formatValue, weekdayLetter, isoWeekNumber, parseNumber } = ClarityUtils;
  const { euro, num2, int0 } = ClarityFormat;

  // === Wochen-Buckets (5 Wochen pro Monat) ===
  function getWeekBuckets(y, mIdx) {
    const dim = new Date(y, mIdx + 1, 0).getDate();
    const weeks = [];
    let bucket = [];

    for (let d = 1; d <= dim; d++) {
      const date = new Date(y, mIdx, d);
      const dow = date.getDay() || 7;
      bucket.push(d);
      if (dow === 7) {
        weeks.push(bucket);
        bucket = [];
      }
    }

    if (bucket.length > 0) weeks.push(bucket);
    return weeks.slice(0, 5);
  }

  // === KW-Nummer für eine Woche ===
  function getBucketKw(y, mIdx, bucket) {
    if (!bucket.length) return "—";
    const monday = bucket.find(d => {
      const date = new Date(y, mIdx, d);
      return (date.getDay() || 7) === 1;
    });
    const ref = new Date(y, mIdx, monday || bucket[0]);
    return "KW" + isoWeekNumber(ref);
  }

  // === Hauptfunktion: Monat laden ===
  function loadMonth(y, mIdx) {
    const app = document.getElementById("app");
    app.innerHTML = "";

    // 🔥 Aktiven Funnel holen
    const activeFunnelId = FunnelAPI.getActiveFunnel();
    const activeFunnel = FunnelAPI.getActiveFunnelData();

    // 🔥 Funnel-Config mit dynamischen Spalten
    const config = FunnelAPI.getFunnelConfig(activeFunnel);
    const ALL_COLUMNS = config.columns;
    const INPUT_KEYS = config.inputs;
    const KPI_COLS = config.kpiCols;

    console.log("📊 Lade Monat:", { funnel: activeFunnel.name, columns: ALL_COLUMNS.length });

    // Tabellen-Container
    const wrap = document.createElement("div");
    wrap.className = "table-wrap";
    wrap.innerHTML = `
      <div id="zoomArea">
        <table id="tracker">
          <thead>
            <tr>${ALL_COLUMNS.map(c => `<th>${c}</th>`).join("")}</tr>
          </thead>
          <tbody id="table-body"></tbody>
          <tfoot id="tfoot">
            <tr id="summary-head">
              <td rowspan="2" colspan="2" class="total-merged"><strong>TOTAL</strong></td>
              ${ALL_COLUMNS.slice(2).map(c => `<td class="repeat-head">${c}</td>`).join("")}
            </tr>
            <tr id="summary-row">
              ${ALL_COLUMNS.slice(2).map(c => `<td class="calc" data-key="${c}">–</td>`).join("")}
            </tr>
          </tfoot>
        </table>
      </div>
    `;
    app.appendChild(wrap);

    const tbody = document.getElementById("table-body");

    // 🔥 Daten für aktiven Funnel laden
    const saved = StorageAPI.loadMonthDataForFunnel(activeFunnelId, y, mIdx);

    // === Tageszeilen bauen ===
    const daysInMonth = new Date(y, mIdx + 1, 0).getDate();

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(y, mIdx, d);
      const isoShort = dateObj.toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit"
      });

      const tr = document.createElement("tr");
      tr.dataset.day = d;

      ALL_COLUMNS.forEach(col => {
        const td = document.createElement("td");

        if (col === "Tag") {
          td.textContent = weekdayLetter(dateObj);
          td.classList.add("weekday");
          if (dateObj.getDay() === 0) td.classList.add("sunday-cell");

          // 🔥 Setup Cell Selection for all cells
          if (window.CellSelection) {
            window.CellSelection.setupCell(td, null);
          }
        }
        else if (col === "Datum") {
          td.innerHTML = `<span class="date">${isoShort}</span>`;

          // 🔥 Setup Cell Selection for all cells
          if (window.CellSelection) {
            window.CellSelection.setupCell(td, null);
          }
        }
        else if (INPUT_KEYS.includes(col)) {
          const input = document.createElement("input");
          input.type = "text";
          input.className = `inp ${col}`;
          input.dataset.key = `${col}_${d}`;

          const val = saved[input.dataset.key];
          if (typeof val === "number") {
            input.value = ["Adspend", "Revenue", "Cash"].includes(col)
              ? euro.format(val)
              : int0.format(val);
          }

          // 🔥 FOCUS: Zeige rohen Wert (nur Zahlen)
          input.addEventListener("focus", e => {
            const key = e.target.dataset.key;
            const data = StorageAPI.loadMonthDataForFunnel(activeFunnelId, y, mIdx);
            const rawValue = data[key];

            if (typeof rawValue === "number") {
              e.target.value = rawValue.toString().replace(".", ",");
            }
          });

          // 🔥 BLUR: Formatiere und speichere
          input.addEventListener("blur", e => {
            const key = e.target.dataset.key;
            const inputValue = e.target.value.trim();

            if (inputValue === "") {
              e.target.value = "";
              const data = StorageAPI.loadMonthDataForFunnel(activeFunnelId, y, mIdx);
              delete data[key];
              StorageAPI.saveMonthDataForFunnel(activeFunnelId, y, mIdx, data);
              calcAllRows(y, mIdx, ALL_COLUMNS, INPUT_KEYS, KPI_COLS, activeFunnelId);
              return;
            }

            const num = parseNumber(inputValue);

            if (isNaN(num)) {
              e.target.value = "";
              return;
            }

            const data = StorageAPI.loadMonthDataForFunnel(activeFunnelId, y, mIdx);
            data[key] = num;
            StorageAPI.saveMonthDataForFunnel(activeFunnelId, y, mIdx, data);

            e.target.value = ["Adspend", "Revenue", "Cash"].includes(col)
              ? euro.format(num)
              : int0.format(num);

            calcAllRows(y, mIdx, ALL_COLUMNS, INPUT_KEYS, KPI_COLS, activeFunnelId);
          });

          // 🔥 INPUT: Live-Update (während Tippen)
          let inputTimeout;
          input.addEventListener("input", e => {
            clearTimeout(inputTimeout);

            inputTimeout = setTimeout(() => {
              const key = e.target.dataset.key;
              const inputValue = e.target.value.trim();

              if (inputValue === "") {
                const data = StorageAPI.loadMonthDataForFunnel(activeFunnelId, y, mIdx);
                delete data[key];
                StorageAPI.saveMonthDataForFunnel(activeFunnelId, y, mIdx, data);
                calcAllRows(y, mIdx, ALL_COLUMNS, INPUT_KEYS, KPI_COLS, activeFunnelId);
                return;
              }

              const num = parseNumber(inputValue);

              if (!isNaN(num)) {
                const data = StorageAPI.loadMonthDataForFunnel(activeFunnelId, y, mIdx);
                data[key] = num;
                StorageAPI.saveMonthDataForFunnel(activeFunnelId, y, mIdx, data);
                calcAllRows(y, mIdx, ALL_COLUMNS, INPUT_KEYS, KPI_COLS, activeFunnelId);
              }
            }, 300);
          });

          td.appendChild(input);

          // 🔥 Setup Cell Selection (Google Sheets behavior)
          if (window.CellSelection) {
            window.CellSelection.setupCell(td, input);
          }
        }
        else {
          td.textContent = "–";
          td.classList.add("calc");
          td.dataset.key = `${col}_${d}`;

          // 🔥 Setup Cell Selection for KPI cells
          if (window.CellSelection) {
            window.CellSelection.setupCell(td, null);
          }
        }

        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    }

    addWeeklySection(ALL_COLUMNS, INPUT_KEYS, KPI_COLS);

    // Store params for recalculation (needed for Copy/Paste)
    setCurrentMonthParams(y, mIdx, ALL_COLUMNS, INPUT_KEYS, KPI_COLS, activeFunnelId);

    calcAllRows(y, mIdx, ALL_COLUMNS, INPUT_KEYS, KPI_COLS, activeFunnelId);

    // 🔥 Setup Cell Selection for all remaining cells (thead, tfoot)
    setupRemainingCells();

    // Zoom initialisieren
    if (typeof window.globalZoomInit === "function") {
      window.globalZoomInit();
    }

    function setupRemainingCells() {
      if (!window.CellSelection) return;

      // Header cells (thead)
      const headerCells = document.querySelectorAll('#tracker thead th');
      headerCells.forEach(th => {
        if (window.CellSelection.isSelectableCell(th)) {
          window.CellSelection.setupCell(th, null);
        }
      });

      // Total row cells (tfoot)
      const totalCells = document.querySelectorAll('#tracker tfoot td');
      totalCells.forEach(td => {
        if (window.CellSelection.isSelectableCell(td)) {
          window.CellSelection.setupCell(td, null);
        }
      });
    }

    function addWeeklySection(ALL_COLUMNS, INPUT_KEYS, KPI_COLS) {
      const table = document.getElementById("tracker");

      const spacer = document.createElement("tr");
      spacer.innerHTML = `<td colspan="${ALL_COLUMNS.length}" style="background:var(--bg);height:10px;border:none;"></td>`;
      table.tFoot.appendChild(spacer);

      const header = document.createElement("tr");
      header.id = "weekly-header";

      ALL_COLUMNS.forEach((col, i) => {
        const td = document.createElement("td");

        if (i === 0) {
          td.colSpan = 2;
          td.textContent = "WEEKLY";
          td.style.cssText = "background:#333;color:#fff;text-align:center;font-weight:700;border:1px solid #444;";
          header.appendChild(td);
          return;
        }

        if (i === 1) return;

        td.textContent = col;
        td.style.cssText = "background:#333;color:#fff;text-align:center;font-weight:600;border:1px solid #444;";
        header.appendChild(td);
      });

      table.tFoot.appendChild(header);

      for (let w = 1; w <= 5; w++) {
        const tr = document.createElement("tr");
        tr.dataset.week = w;

        ALL_COLUMNS.forEach((col, i) => {
          const td = document.createElement("td");

          if (i === 0) {
            td.textContent = w;
            td.style.textAlign = "center";
          } else if (i === 1) {
            td.dataset.kw = "true";
            td.textContent = "–";
            td.style.textAlign = "center";
          } else {
            td.textContent = "–";
            td.dataset.key = `${col}_W${w}`;

            if (KPI_COLS.includes(col)) {
              td.classList.add("calc");
            }
          }

          td.style.fontWeight = "400";
          tr.appendChild(td);
        });

        table.tFoot.appendChild(tr);
      }
    }

    function calcAllRows(y, mIdx, ALL_COLUMNS, INPUT_KEYS, KPI_COLS, activeFunnelId) {
      const data = StorageAPI.loadMonthDataForFunnel(activeFunnelId, y, mIdx);

      tbody.querySelectorAll("tr").forEach(row => {
        const d = row.dataset.day;
        if (!d) return;

        const get = k => parseFloat(data[`${k}_${d}`]) || 0;

        const vals = calculateKPIs({
          adspend: get("Adspend"),
          impr: get("Impr"),
          clicks: get("Clicks"),
          leads: get("Leads"),
          survey: get("Survey"),
          surveyQuali: get("SurveyQuali"),
          units: get("Units"),
          revenue: get("Revenue"),
          cash: get("Cash"),
          // 🔥 Cold Email
          emailsSent: get("Emails Sent"),
          opened: get("Opened"),
          // 🔥 Cold Calls
          callsDialed: get("Calls Dialed"),
          reached: get("Reached"),
          // 🔥 1-Call & 2-Call Close (NEUE NAMEN!)
          closingBooking: get("ClosingBooking"),
          closingTermin: get("ClosingTermin"),
          closingCall: get("ClosingCall"),
          settingBooking: get("SettingBooking"),
          settingTermin: get("SettingTermin"),
          settingCall: get("SettingCall")
        });

        for (const [k, v] of Object.entries(vals)) {
          const cell = row.querySelector(`[data-key="${k}_${d}"]`);
          if (cell) cell.textContent = formatValue(v, k);
        }
      });

      updateSummary(data, ALL_COLUMNS, INPUT_KEYS, daysInMonth);
      updateWeekly(data, ALL_COLUMNS, INPUT_KEYS, KPI_COLS);
    }

    function updateSummary(data, ALL_COLUMNS, INPUT_KEYS, daysInMonth) {
      const row = document.getElementById("summary-row");
      if (!row) return;

      const totals = {};
      INPUT_KEYS.forEach(k => (totals[k] = 0));

      for (let d = 1; d <= daysInMonth; d++) {
        INPUT_KEYS.forEach(k => {
          const v = data[`${k}_${d}`];
          if (typeof v === "number" && !isNaN(v)) totals[k] += v;
        });
      }

      const setSum = (key, val, isEuro = false) => {
        const cell = row.querySelector(`[data-key="${key}"]`);
        if (!cell) return;
        if (!val || isNaN(val)) {
          cell.textContent = "–";
          return;
        }
        cell.textContent = isEuro ? euro.format(val) : int0.format(val);
      };

      INPUT_KEYS.forEach(k =>
        setSum(k, totals[k], ["Adspend", "Revenue", "Cash"].includes(k))
      );

      // 🔥 Hilfsfunktion zum sicheren Abrufen
      const getTotal = (key) => totals[key] || 0;

      const calc = calculateKPIs({
        adspend: getTotal("Adspend"),
        impr: getTotal("Impr"),
        clicks: getTotal("Clicks"),
        leads: getTotal("Leads"),
        survey: getTotal("Survey"),
        surveyQuali: getTotal("SurveyQuali"),
        units: getTotal("Units"),
        revenue: getTotal("Revenue"),
        cash: getTotal("Cash"),
        emailsSent: getTotal("Emails Sent"),
        opened: getTotal("Opened"),
        callsDialed: getTotal("Calls Dialed"),
        reached: getTotal("Reached"),
        closingBooking: getTotal("ClosingBooking"),
        closingTermin: getTotal("ClosingTermin"),
        closingCall: getTotal("ClosingCall"),
        settingBooking: getTotal("SettingBooking"),
        settingTermin: getTotal("SettingTermin"),
        settingCall: getTotal("SettingCall")
      });

      for (const [k, v] of Object.entries(calc)) {
        const c = row.querySelector(`[data-key="${k}"]`);
        if (c) c.textContent = formatValue(v, k);
      }
    }

    function updateWeekly(data, ALL_COLUMNS, INPUT_KEYS, KPI_COLS) {
      const table = document.getElementById("tracker");
      const weeks = getWeekBuckets(y, mIdx);

      weeks.forEach((bucket, i) => {
        const w = i + 1;
        const r = table.querySelector(`tr[data-week="${w}"]`);
        if (!r) return;

        const kwCell = r.querySelector("td[data-kw]");
        if (kwCell) kwCell.textContent = bucket.length ? getBucketKw(y, mIdx, bucket) : "—";

        const totals = {};
        INPUT_KEYS.forEach(k => (totals[k] = 0));

        bucket.forEach(d => {
          INPUT_KEYS.forEach(k => {
            const v = data[`${k}_${d}`];
            if (typeof v === "number" && !isNaN(v)) totals[k] += v;
          });
        });

        INPUT_KEYS.forEach(k => {
          const c = r.querySelector(`[data-key="${k}_W${w}"]`);
          if (!c) return;
          const val = totals[k];
          c.textContent = !val || isNaN(val)
            ? "–"
            : (["Adspend", "Revenue", "Cash"].includes(k) ? euro.format(val) : int0.format(val));
        });

        // 🔥 Hilfsfunktion zum sicheren Abrufen
        const getTotal = (key) => totals[key] || 0;

        const calc = calculateKPIs({
          adspend: getTotal("Adspend"),
          impr: getTotal("Impr"),
          clicks: getTotal("Clicks"),
          leads: getTotal("Leads"),
          survey: getTotal("Survey"),
          surveyQuali: getTotal("SurveyQuali"),
          units: getTotal("Units"),
          revenue: getTotal("Revenue"),
          cash: getTotal("Cash"),
          emailsSent: getTotal("Emails Sent"),
          opened: getTotal("Opened"),
          callsDialed: getTotal("Calls Dialed"),
          reached: getTotal("Reached"),
          closingBooking: getTotal("ClosingBooking"),
          closingTermin: getTotal("ClosingTermin"),
          closingCall: getTotal("ClosingCall"),
          settingBooking: getTotal("SettingBooking"),
          settingTermin: getTotal("SettingTermin"),
          settingCall: getTotal("SettingCall")
        });

        KPI_COLS.forEach(k => {
          const c = r.querySelector(`[data-key="${k}_W${w}"]`);
          if (c) c.textContent = formatValue(calc[k], k);
        });
      });
    }
  }


  // === Export recalculate function for Copy/Paste ===
  let currentMonthParams = null;

  function setCurrentMonthParams(y, mIdx, cols, inputs, kpis, funnelId) {
    currentMonthParams = { y, mIdx, cols, inputs, kpis, funnelId };
  }

  function recalculate() {
    if (!currentMonthParams) return;
    const { y, mIdx, cols, inputs, kpis, funnelId } = currentMonthParams;
    calcAllRows(y, mIdx, cols, inputs, kpis, funnelId);
  }

  // Store params when loading month
  function loadMonthWrapper(y, mIdx) {
    loadMonth(y, mIdx);
  }

  window.MonthView = {
    loadMonth: loadMonthWrapper,
    recalculate
  };
})(window);