(function(window) {

  const CSVImportDatapool = {
    csvData: null,
    mappedHeaders: {},
    currentStep: 1,

    openModal() {
      const existingModal = document.getElementById('csvImportDatapoolModal');
      if (existingModal) existingModal.remove();

      const modal = document.createElement('div');
      modal.id = 'csvImportDatapoolModal';
      modal.className = 'modal';
      modal.innerHTML = `
        <div class="modal-content csv-import-modal">
          <div class="csv-import-header">
            <h2>📤 CSV-Daten importieren</h2>
            <button class="close-btn" onclick="document.getElementById('csvImportDatapoolModal').remove()">×</button>
          </div>

          <div id="csvStep1" class="csv-step">
            <p>Importiere deine historischen Event-Daten in den Datenpool.</p>
            <div class="file-upload-area" id="fileUploadArea">
              <div class="upload-icon">📁</div>
              <p><strong>CSV-Datei hier ablegen</strong> oder klicken zum Auswählen</p>
              <input type="file" id="csvFileInputDatapool" accept=".csv" style="display: none;" />
            </div>
            <div id="fileInfo" class="file-info hidden"></div>
          </div>

          <div id="csvStep2" class="csv-step hidden">
            <h3>Spalten zuordnen</h3>
            <p>Ordne die CSV-Spalten den Datenpool-Feldern zu:</p>
            <div id="columnMapping" class="column-mapping"></div>
            <button class="btn-primary" onclick="window.CSVImportDatapool.proceedToPreview()">
              Weiter zur Vorschau
            </button>
          </div>

          <div id="csvStep3" class="csv-step hidden">
            <h3>Vorschau</h3>
            <p>Überprüfe die ersten 5 Zeilen:</p>
            <div id="previewTable" class="preview-table"></div>
            <div class="import-options">
              <label>
                <input type="checkbox" id="skipDuplicates" checked />
                Duplikate automatisch erkennen und zusammenführen
              </label>
            </div>
            <button class="btn-primary" onclick="window.CSVImportDatapool.startImport()">
              Import starten
            </button>
          </div>

          <div id="csvStep4" class="csv-step hidden">
            <h3>Import läuft...</h3>
            <div class="import-progress">
              <div class="progress-bar">
                <div id="progressFill" class="progress-fill" style="width: 0%"></div>
              </div>
              <p id="progressText">0 von 0 Zeilen verarbeitet...</p>
            </div>
          </div>

          <div id="csvStep5" class="csv-step hidden">
            <h3>✅ Import abgeschlossen!</h3>
            <div id="importSummary" class="import-summary"></div>
            <button class="btn-primary" onclick="window.DataPool.loadAllEvents(); document.getElementById('csvImportDatapoolModal').remove();">
              Schließen
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      this.attachListeners();
    },

    attachListeners() {
      const fileUploadArea = document.getElementById('fileUploadArea');
      const fileInput = document.getElementById('csvFileInputDatapool');

      fileUploadArea.addEventListener('click', () => fileInput.click());

      fileUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUploadArea.classList.add('dragover');
      });

      fileUploadArea.addEventListener('dragleave', () => {
        fileUploadArea.classList.remove('dragover');
      });

      fileUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        fileUploadArea.classList.remove('dragover');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
          this.handleFile(files[0]);
        }
      });

      fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          this.handleFile(e.target.files[0]);
        }
      });
    },

    handleFile(file) {
      if (!file.name.endsWith('.csv')) {
        if (window.Toast) {
          window.Toast.error('Bitte wähle eine CSV-Datei aus');
        }
        return;
      }

      const fileInfo = document.getElementById('fileInfo');
      fileInfo.innerHTML = `
        <div class="file-name">📄 ${file.name}</div>
        <div class="file-size">${(file.size / 1024).toFixed(2)} KB</div>
      `;
      fileInfo.classList.remove('hidden');

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          console.log('CSV parsed:', results);
          this.csvData = results;
          this.proceedToMapping();
        },
        error: (error) => {
          console.error('CSV parse error:', error);
          if (window.Toast) {
            window.Toast.error('Fehler beim Lesen der CSV-Datei');
          }
        }
      });
    },

    proceedToMapping() {
      this.currentStep = 2;
      document.getElementById('csvStep1').classList.add('hidden');
      document.getElementById('csvStep2').classList.remove('hidden');

      const headers = this.csvData.meta.fields;
      const mapping = document.getElementById('columnMapping');

      const requiredFields = [
        { key: 'name', label: 'Name', required: false },
        { key: 'email', label: 'Email', required: true },
        { key: 'phone', label: 'Telefon', required: false },
        { key: 'event_type', label: 'Event-Typ', required: true },
        { key: 'event_date', label: 'Event-Datum', required: true },
        { key: 'funnel_id', label: 'Funnel-ID', required: false },
        { key: 'source', label: 'Quelle', required: false },
        { key: 'revenue', label: 'Revenue', required: false },
        { key: 'cash', label: 'Cash', required: false }
      ];

      mapping.innerHTML = requiredFields.map(field => {
        const autoMatch = this.autoMatchHeader(headers, field.key);

        return `
          <div class="mapping-row">
            <label>${field.label}${field.required ? ' *' : ''}:</label>
            <select data-field="${field.key}">
              <option value="">-- Nicht zuordnen --</option>
              ${headers.map(h =>
                `<option value="${h}" ${h === autoMatch ? 'selected' : ''}>${h}</option>`
              ).join('')}
            </select>
          </div>
        `;
      }).join('');
    },

    autoMatchHeader(headers, fieldKey) {
      const patterns = {
        name: ['name', 'namen', 'vorname', 'nachname', 'full name', 'fullname'],
        email: ['email', 'e-mail', 'mail', 'emailadresse', 'e-mailadresse'],
        phone: ['phone', 'telefon', 'tel', 'mobile', 'handy'],
        event_type: ['event_type', 'event type', 'type', 'typ', 'eventtyp'],
        event_date: ['event_date', 'date', 'datum', 'created', 'timestamp'],
        funnel_id: ['funnel_id', 'funnel', 'funnel id', 'funnelid'],
        source: ['source', 'quelle', 'traffic', 'utm_source'],
        revenue: ['revenue', 'umsatz', 'preis', 'price'],
        cash: ['cash', 'bezahlt', 'paid', 'payment']
      };

      const fieldPatterns = patterns[fieldKey] || [];

      for (const header of headers) {
        const headerLower = header.toLowerCase().trim();
        for (const pattern of fieldPatterns) {
          if (headerLower.includes(pattern) || pattern.includes(headerLower)) {
            return header;
          }
        }
      }

      return null;
    },

    proceedToPreview() {
      const selects = document.querySelectorAll('#columnMapping select');
      this.mappedHeaders = {};

      selects.forEach(select => {
        const field = select.dataset.field;
        const csvColumn = select.value;
        if (csvColumn) {
          this.mappedHeaders[field] = csvColumn;
        }
      });

      if (!this.mappedHeaders.email || !this.mappedHeaders.event_type || !this.mappedHeaders.event_date) {
        if (window.Toast) {
          window.Toast.error('Bitte ordne mindestens Email, Event-Typ und Event-Datum zu!');
        }
        return;
      }

      this.currentStep = 3;
      document.getElementById('csvStep2').classList.add('hidden');
      document.getElementById('csvStep3').classList.remove('hidden');

      this.renderPreview();
    },

    renderPreview() {
      const previewTable = document.getElementById('previewTable');
      const previewData = this.csvData.data.slice(0, 5);

      const headers = Object.keys(this.mappedHeaders);

      let html = '<table><thead><tr>';
      headers.forEach(h => {
        html += `<th>${h}</th>`;
      });
      html += '</tr></thead><tbody>';

      previewData.forEach(row => {
        html += '<tr>';
        headers.forEach(field => {
          const csvColumn = this.mappedHeaders[field];
          const value = row[csvColumn] || '-';
          html += `<td>${value}</td>`;
        });
        html += '</tr>';
      });

      html += '</tbody></table>';
      previewTable.innerHTML = html;
    },

    async startImport() {
      this.currentStep = 4;
      document.getElementById('csvStep3').classList.add('hidden');
      document.getElementById('csvStep4').classList.remove('hidden');

      const skipDuplicates = document.getElementById('skipDuplicates').checked;
      const totalRows = this.csvData.data.length;
      let processedRows = 0;
      let createdLeads = 0;
      let updatedLeads = 0;
      let createdEvents = 0;
      let skippedRows = 0;

      const progressFill = document.getElementById('progressFill');
      const progressText = document.getElementById('progressText');

      for (const row of this.csvData.data) {
        try {
          const email = row[this.mappedHeaders.email]?.trim();
          const phone = row[this.mappedHeaders.phone]?.trim();
          const name = row[this.mappedHeaders.name]?.trim();

          if (!email) {
            skippedRows++;
            continue;
          }

          let lead;

          if (skipDuplicates) {
            lead = await this.findOrCreateLead(email, phone, name);
            if (lead.created) {
              createdLeads++;
            } else {
              updatedLeads++;
            }
          } else {
            const { data, error } = await window.SupabaseClient
              .from('leads')
              .insert({
                name: name || null,
                emails: [email],
                phones: phone ? [phone] : [],
                primary_email: email,
                primary_phone: phone || null,
                source: row[this.mappedHeaders.source] || null,
                funnel_id: row[this.mappedHeaders.funnel_id] || null
              })
              .select()
              .single();

            if (error) {
              console.error('Error creating lead:', error);
              skippedRows++;
              continue;
            }

            lead = { lead: data, created: true };
            createdLeads++;
          }

          const eventType = row[this.mappedHeaders.event_type]?.trim();
          const eventDate = row[this.mappedHeaders.event_date]?.trim();
          const revenue = parseFloat(row[this.mappedHeaders.revenue]) || 0;
          const cash = parseFloat(row[this.mappedHeaders.cash]) || 0;

          if (eventType && eventDate) {
            const { error: eventError } = await window.SupabaseClient
              .from('events')
              .insert({
                lead_id: lead.lead.id,
                event_type: eventType,
                event_date: eventDate,
                funnel_id: row[this.mappedHeaders.funnel_id] || null,
                source: row[this.mappedHeaders.source] || null,
                revenue: revenue,
                cash: cash
              });

            if (!eventError) {
              createdEvents++;
            }
          }

          processedRows++;
          const progress = (processedRows / totalRows) * 100;
          progressFill.style.width = `${progress}%`;
          progressText.textContent = `${processedRows} von ${totalRows} Zeilen verarbeitet...`;

        } catch (err) {
          console.error('Error processing row:', err);
          skippedRows++;
        }
      }

      this.showSummary(createdLeads, updatedLeads, createdEvents, skippedRows);
    },

    async findOrCreateLead(email, phone, name) {
      const normalizedEmail = email.toLowerCase().trim();
      const normalizedPhone = phone ? phone.replace(/[\s\-\(\)]/g, '') : null;

      let lead = null;

      const { data: existingByEmail, error: emailError } = await window.SupabaseClient
        .from('leads')
        .select('*')
        .eq('primary_email', normalizedEmail)
        .maybeSingle();

      if (existingByEmail) {
        lead = existingByEmail;
      }

      if (!lead && normalizedPhone) {
        const { data: existingByPhone, error: phoneError } = await window.SupabaseClient
          .from('leads')
          .select('*')
          .eq('primary_phone', normalizedPhone)
          .maybeSingle();

        if (existingByPhone) {
          lead = existingByPhone;
        }
      }

      if (lead) {
        const emails = lead.emails || [];
        const phones = lead.phones || [];

        let updated = false;

        if (!emails.includes(normalizedEmail)) {
          emails.push(normalizedEmail);
          updated = true;
        }

        if (normalizedPhone && !phones.includes(normalizedPhone)) {
          phones.push(normalizedPhone);
          updated = true;
        }

        if (updated) {
          const { error: updateError } = await window.SupabaseClient
            .from('leads')
            .update({
              emails: emails,
              phones: phones
            })
            .eq('id', lead.id);

          if (updateError) {
            console.error('Error updating lead:', updateError);
          }
        }

        return { lead, created: false };
      }

      const { data: newLead, error: createError } = await window.SupabaseClient
        .from('leads')
        .insert({
          name: name || null,
          emails: [normalizedEmail],
          phones: normalizedPhone ? [normalizedPhone] : [],
          primary_email: normalizedEmail,
          primary_phone: normalizedPhone
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating lead:', createError);
        return null;
      }

      return { lead: newLead, created: true };
    },

    showSummary(createdLeads, updatedLeads, createdEvents, skippedRows) {
      this.currentStep = 5;
      document.getElementById('csvStep4').classList.add('hidden');
      document.getElementById('csvStep5').classList.remove('hidden');

      const summary = document.getElementById('importSummary');
      summary.innerHTML = `
        <div class="summary-stats">
          <div class="summary-stat">
            <div class="summary-value">${createdLeads}</div>
            <div class="summary-label">Neue Leads erstellt</div>
          </div>
          <div class="summary-stat">
            <div class="summary-value">${updatedLeads}</div>
            <div class="summary-label">Leads aktualisiert</div>
          </div>
          <div class="summary-stat">
            <div class="summary-value">${createdEvents}</div>
            <div class="summary-label">Events importiert</div>
          </div>
          ${skippedRows > 0 ? `
            <div class="summary-stat">
              <div class="summary-value">${skippedRows}</div>
              <div class="summary-label">Zeilen übersprungen</div>
            </div>
          ` : ''}
        </div>
      `;

      if (window.Toast) {
        window.Toast.success('Import erfolgreich abgeschlossen!');
      }
    }
  };

  window.CSVImportDatapool = CSVImportDatapool;

})(window);
