(function(window) {

  const ITEMS_PER_PAGE = 50;

  const DataPool = {
    currentFilters: {
      leads: {},
      surveys: {},
      surveyQualis: {},
      bookings: {},
      units: {}
    },

    async init() {
      console.log('🔧 Initializing DataPool...');
      const container = document.getElementById('datapoolView');
      if (!container) {
        console.error('❌ DataPool container not found');
        return;
      }

      container.innerHTML = `
        <div class="datapool-header">
          <h1>💾 Datenpool</h1>
          <div class="datapool-actions">
            <button id="syncNowBtn" class="btn-primary">
              🔄 Jetzt synchronisieren
            </button>
            <button id="csvImportBtn" class="btn-secondary">
              📤 CSV Import
            </button>
            <button id="settingsBtn" class="btn-secondary">
              ⚙️ Einstellungen
            </button>
          </div>
        </div>

        <div class="datapool-stats">
          <div class="stat-card">
            <div class="stat-value" id="totalLeads">-</div>
            <div class="stat-label">Gesamt Leads</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" id="todayEvents">-</div>
            <div class="stat-label">Events heute</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" id="lastSync">-</div>
            <div class="stat-label">Letzte Sync</div>
          </div>
        </div>

        <div class="datapool-content">
          <div class="event-card">
            <div class="event-card-header">
              <h3>📧 Leads</h3>
              <button class="btn-filter" data-event="leads">🔍 Filter</button>
            </div>
            <div class="event-filter hidden" id="filter-leads"></div>
            <div class="event-list" id="list-leads">
              <div class="loading-spinner">Laden...</div>
            </div>
            <button class="btn-load-more hidden" data-event="leads">Mehr laden</button>
          </div>

          <div class="event-card">
            <div class="event-card-header">
              <h3>📋 Surveys</h3>
              <button class="btn-filter" data-event="surveys">🔍 Filter</button>
            </div>
            <div class="event-filter hidden" id="filter-surveys"></div>
            <div class="event-list" id="list-surveys">
              <div class="loading-spinner">Laden...</div>
            </div>
            <button class="btn-load-more hidden" data-event="surveys">Mehr laden</button>
          </div>

          <div class="event-card">
            <div class="event-card-header">
              <h3>✅ Survey Qualis</h3>
              <button class="btn-filter" data-event="surveyQualis">🔍 Filter</button>
            </div>
            <div class="event-filter hidden" id="filter-surveyQualis"></div>
            <div class="event-list" id="list-surveyQualis">
              <div class="loading-spinner">Laden...</div>
            </div>
            <button class="btn-load-more hidden" data-event="surveyQualis">Mehr laden</button>
          </div>

          <div class="event-card">
            <div class="event-card-header">
              <h3>📅 Call Bookings</h3>
              <button class="btn-filter" data-event="bookings">🔍 Filter</button>
            </div>
            <div class="event-filter hidden" id="filter-bookings"></div>
            <div class="event-list" id="list-bookings">
              <div class="loading-spinner">Laden...</div>
            </div>
            <button class="btn-load-more hidden" data-event="bookings">Mehr laden</button>
          </div>

          <div class="event-card">
            <div class="event-card-header">
              <h3>💰 Units</h3>
              <button class="btn-filter" data-event="units">🔍 Filter</button>
            </div>
            <div class="event-filter hidden" id="filter-units"></div>
            <div class="event-list" id="list-units">
              <div class="loading-spinner">Laden...</div>
            </div>
            <button class="btn-load-more hidden" data-event="units">Mehr laden</button>
          </div>
        </div>
      `;

      this.attachListeners();
      await this.loadStats();
      await this.loadAllEvents();
    },

    attachListeners() {
      document.querySelectorAll('.btn-filter').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const eventType = e.target.dataset.event;
          this.toggleFilter(eventType);
        });
      });

      document.querySelectorAll('.btn-load-more').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const eventType = e.target.dataset.event;
          this.loadMore(eventType);
        });
      });

      const csvImportBtn = document.getElementById('csvImportBtn');
      if (csvImportBtn) {
        csvImportBtn.addEventListener('click', () => this.openCSVImport());
      }

      const settingsBtn = document.getElementById('settingsBtn');
      if (settingsBtn) {
        settingsBtn.addEventListener('click', () => this.openSettings());
      }

      const syncNowBtn = document.getElementById('syncNowBtn');
      if (syncNowBtn) {
        syncNowBtn.addEventListener('click', () => this.syncNow());
      }
    },

    toggleFilter(eventType) {
      const filterEl = document.getElementById(`filter-${eventType}`);
      if (!filterEl) return;

      const isHidden = filterEl.classList.toggle('hidden');

      if (!isHidden && filterEl.innerHTML.trim() === '') {
        this.renderFilter(eventType);
      }
    },

    renderFilter(eventType) {
      const filterEl = document.getElementById(`filter-${eventType}`);
      if (!filterEl) return;

      const funnels = FunnelAPI.loadFunnels();
      const funnelOptions = funnels.map(f =>
        `<option value="${f.id}">${f.name}</option>`
      ).join('');

      filterEl.innerHTML = `
        <div class="filter-grid">
          <div class="filter-field">
            <label>Von:</label>
            <input type="date" id="filter-${eventType}-from" />
          </div>
          <div class="filter-field">
            <label>Bis:</label>
            <input type="date" id="filter-${eventType}-to" />
          </div>
          <div class="filter-field">
            <label>Funnel:</label>
            <select id="filter-${eventType}-funnel">
              <option value="">Alle</option>
              ${funnelOptions}
            </select>
          </div>
          <div class="filter-field">
            <label>Suche:</label>
            <input type="text" id="filter-${eventType}-search" placeholder="Name, Email, Telefon..." />
          </div>
          <div class="filter-actions">
            <button class="btn-small btn-primary" onclick="window.DataPool.applyFilter('${eventType}')">
              Anwenden
            </button>
            <button class="btn-small btn-secondary" onclick="window.DataPool.resetFilter('${eventType}')">
              Zurücksetzen
            </button>
          </div>
        </div>
      `;
    },

    async applyFilter(eventType) {
      const fromDate = document.getElementById(`filter-${eventType}-from`)?.value;
      const toDate = document.getElementById(`filter-${eventType}-to`)?.value;
      const funnelId = document.getElementById(`filter-${eventType}-funnel`)?.value;
      const search = document.getElementById(`filter-${eventType}-search`)?.value;

      this.currentFilters[eventType] = {
        fromDate,
        toDate,
        funnelId,
        search
      };

      await this.loadEvents(eventType);
    },

    async resetFilter(eventType) {
      this.currentFilters[eventType] = {};

      const filterEl = document.getElementById(`filter-${eventType}`);
      if (filterEl) {
        filterEl.querySelectorAll('input, select').forEach(el => {
          if (el.type === 'text' || el.type === 'date') {
            el.value = '';
          } else if (el.tagName === 'SELECT') {
            el.selectedIndex = 0;
          }
        });
      }

      await this.loadEvents(eventType);
    },

    async loadStats() {
      try {
        const { data: leads, error: leadsError } = await window.SupabaseClient
          .from('leads')
          .select('id', { count: 'exact', head: true });

        const today = new Date().toISOString().split('T')[0];
        const { data: events, error: eventsError } = await window.SupabaseClient
          .from('events')
          .select('id', { count: 'exact', head: true })
          .eq('event_date', today);

        const { data: syncLog, error: syncError } = await window.SupabaseClient
          .from('sync_log')
          .select('completed_at')
          .order('completed_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        document.getElementById('totalLeads').textContent = leadsError ? '-' : (leads?.length || 0);
        document.getElementById('todayEvents').textContent = eventsError ? '-' : (events?.length || 0);

        if (syncLog && syncLog.completed_at) {
          const syncDate = new Date(syncLog.completed_at);
          document.getElementById('lastSync').textContent = syncDate.toLocaleString('de-DE');
        } else {
          document.getElementById('lastSync').textContent = 'Nie';
        }
      } catch (err) {
        console.error('❌ Error loading stats:', err);
      }
    },

    async loadAllEvents() {
      await this.loadEvents('leads');
      await this.loadEvents('surveys');
      await this.loadEvents('surveyQualis');
      await this.loadEvents('bookings');
      await this.loadEvents('units');
    },

    async loadEvents(eventType, offset = 0) {
      const listEl = document.getElementById(`list-${eventType}`);
      if (!listEl) return;

      if (offset === 0) {
        listEl.innerHTML = '<div class="loading-spinner">Laden...</div>';
      }

      try {
        const eventTypeMap = {
          leads: 'lead',
          surveys: 'survey',
          surveyQualis: 'surveyQuali',
          bookings: ['settingBooking', 'closingBooking'],
          units: 'unit'
        };

        const eventTypeFilter = eventTypeMap[eventType];
        const filters = this.currentFilters[eventType] || {};

        let query = window.SupabaseClient
          .from('events')
          .select(`
            *,
            lead:lead_id (
              id,
              name,
              primary_email,
              primary_phone,
              emails,
              phones,
              source
            )
          `)
          .order('event_date', { ascending: false })
          .order('created_at', { ascending: false })
          .range(offset, offset + ITEMS_PER_PAGE - 1);

        if (Array.isArray(eventTypeFilter)) {
          query = query.in('event_type', eventTypeFilter);
        } else {
          query = query.eq('event_type', eventTypeFilter);
        }

        if (filters.fromDate) {
          query = query.gte('event_date', filters.fromDate);
        }

        if (filters.toDate) {
          query = query.lte('event_date', filters.toDate);
        }

        if (filters.funnelId) {
          query = query.eq('funnel_id', filters.funnelId);
        }

        const { data, error } = await query;

        if (error) {
          console.error('❌ Error loading events:', error);
          listEl.innerHTML = '<div class="error-message">Fehler beim Laden der Daten</div>';
          return;
        }

        let filteredData = data || [];

        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filteredData = filteredData.filter(event => {
            const lead = event.lead;
            if (!lead) return false;

            const nameMatch = lead.name?.toLowerCase().includes(searchLower);
            const emailMatch = lead.primary_email?.toLowerCase().includes(searchLower);
            const phoneMatch = lead.primary_phone?.includes(searchLower);

            return nameMatch || emailMatch || phoneMatch;
          });
        }

        if (offset === 0) {
          listEl.innerHTML = '';
        }

        if (filteredData.length === 0 && offset === 0) {
          listEl.innerHTML = '<div class="empty-message">Keine Daten vorhanden</div>';
          return;
        }

        filteredData.forEach(event => {
          const row = this.createEventRow(event, eventType);
          listEl.appendChild(row);
        });

        const loadMoreBtn = document.querySelector(`.btn-load-more[data-event="${eventType}"]`);
        if (loadMoreBtn) {
          if (filteredData.length === ITEMS_PER_PAGE) {
            loadMoreBtn.classList.remove('hidden');
          } else {
            loadMoreBtn.classList.add('hidden');
          }
        }
      } catch (err) {
        console.error('❌ Error loading events:', err);
        listEl.innerHTML = '<div class="error-message">Fehler beim Laden der Daten</div>';
      }
    },

    createEventRow(event, eventType) {
      const row = document.createElement('div');
      row.className = 'event-row';
      row.dataset.leadId = event.lead_id;
      row.dataset.eventId = event.id;

      const lead = event.lead || {};
      const name = lead.name || '-';
      const email = lead.primary_email || '-';
      const phone = lead.primary_phone || '-';
      const source = event.source || lead.source || '-';
      const date = new Date(event.event_date).toLocaleDateString('de-DE');
      const time = new Date(event.created_at).toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit'
      });

      if (eventType === 'units') {
        row.innerHTML = `
          <div class="event-cell">${name}</div>
          <div class="event-cell">${email}</div>
          <div class="event-cell">${phone}</div>
          <div class="event-cell">${source}</div>
          <div class="event-cell">${date} ${time}</div>
          <div class="event-cell">${(event.revenue || 0).toFixed(2)} €</div>
          <div class="event-cell">${(event.cash || 0).toFixed(2)} €</div>
        `;
      } else {
        row.innerHTML = `
          <div class="event-cell">${name}</div>
          <div class="event-cell">${email}</div>
          <div class="event-cell">${phone}</div>
          <div class="event-cell">${source}</div>
          <div class="event-cell">${date} ${time}</div>
        `;
      }

      row.addEventListener('click', () => {
        this.openLeadDetail(event.lead_id);
      });

      return row;
    },

    loadMore(eventType) {
      const listEl = document.getElementById(`list-${eventType}`);
      if (!listEl) return;

      const currentRows = listEl.querySelectorAll('.event-row').length;
      this.loadEvents(eventType, currentRows);
    },

    async openLeadDetail(leadId) {
      console.log('📄 Opening lead detail:', leadId);

      try {
        const { data: lead, error: leadError } = await window.SupabaseClient
          .from('leads')
          .select('*')
          .eq('id', leadId)
          .maybeSingle();

        if (leadError || !lead) {
          console.error('❌ Error loading lead:', leadError);
          if (window.Toast) {
            window.Toast.error('Lead nicht gefunden');
          }
          return;
        }

        const { data: events, error: eventsError } = await window.SupabaseClient
          .from('events')
          .select('*')
          .eq('lead_id', leadId)
          .order('event_date', { ascending: true })
          .order('created_at', { ascending: true });

        if (eventsError) {
          console.error('❌ Error loading events:', eventsError);
        }

        this.showLeadDetailModal(lead, events || []);
      } catch (err) {
        console.error('❌ Error opening lead detail:', err);
        if (window.Toast) {
          window.Toast.error('Fehler beim Laden der Lead-Daten');
        }
      }
    },

    showLeadDetailModal(lead, events) {
      const existingModal = document.getElementById('leadDetailModal');
      if (existingModal) existingModal.remove();

      const modal = document.createElement('div');
      modal.id = 'leadDetailModal';
      modal.className = 'modal';
      modal.innerHTML = `
        <div class="modal-content lead-detail-modal">
          <div class="lead-detail-header">
            <h2>${lead.name || 'Unbekannt'}</h2>
            <button class="close-btn" onclick="document.getElementById('leadDetailModal').remove()">×</button>
          </div>
          <div class="lead-detail-info">
            <div class="info-group">
              <strong>Email(s):</strong> ${this.formatEmails(lead.emails, lead.primary_email)}
            </div>
            <div class="info-group">
              <strong>Telefon:</strong> ${this.formatPhones(lead.phones, lead.primary_phone)}
            </div>
            <div class="info-group">
              <strong>Quelle:</strong> ${lead.source || '-'}
            </div>
            <div class="info-group">
              <strong>Funnel:</strong> ${lead.funnel_id || '-'}
            </div>
          </div>
          <div class="lead-timeline">
            <h3>User Journey</h3>
            ${this.renderTimeline(events)}
          </div>
        </div>
      `;

      document.body.appendChild(modal);
    },

    formatEmails(emails, primaryEmail) {
      if (!emails || emails.length === 0) return primaryEmail || '-';
      return emails.map(email =>
        email === primaryEmail ? `<strong>${email}</strong>` : email
      ).join(', ');
    },

    formatPhones(phones, primaryPhone) {
      if (!phones || phones.length === 0) return primaryPhone || '-';
      return phones.map(phone =>
        phone === primaryPhone ? `<strong>${phone}</strong>` : phone
      ).join(', ');
    },

    renderTimeline(events) {
      if (!events || events.length === 0) {
        return '<div class="timeline-empty">Keine Events vorhanden</div>';
      }

      const eventLabels = {
        lead: '📧 Lead',
        survey: '📋 Survey',
        surveyQuali: '✅ Survey Quali',
        settingBooking: '📅 Setting Booking',
        settingTermin: '📅 Setting Termin',
        settingCall: '☎️ Setting Call',
        closingBooking: '📅 Closing Booking',
        closingTermin: '📅 Closing Termin',
        closingCall: '☎️ Closing Call',
        unit: '💰 Unit'
      };

      return events.map(event => {
        const date = new Date(event.event_date).toLocaleDateString('de-DE');
        const time = new Date(event.created_at).toLocaleTimeString('de-DE', {
          hour: '2-digit',
          minute: '2-digit'
        });
        const label = eventLabels[event.event_type] || event.event_type;
        const revenue = event.revenue > 0 ? ` - ${event.revenue.toFixed(2)} €` : '';

        return `
          <div class="timeline-item">
            <div class="timeline-date">${date} ${time}</div>
            <div class="timeline-content">
              <div class="timeline-label">${label}</div>
              <div class="timeline-details">
                Funnel: ${event.funnel_id || '-'} | Quelle: ${event.source || '-'}${revenue}
              </div>
            </div>
          </div>
        `;
      }).join('');
    },

    openCSVImport() {
      if (window.CSVImportDatapool) {
        window.CSVImportDatapool.openModal();
      } else {
        console.error('❌ CSV Import module not loaded');
        if (window.Toast) {
          window.Toast.error('CSV Import nicht verfügbar');
        }
      }
    },

    openSettings() {
      if (window.APISettings) {
        window.APISettings.openModal();
      } else {
        console.error('❌ API Settings module not loaded');
        if (window.Toast) {
          window.Toast.error('Einstellungen nicht verfügbar');
        }
      }
    },

    async syncNow() {
      console.log('🔄 Starting sync...');
      if (window.Toast) {
        window.Toast.info('Synchronisation gestartet...');
      }
      await this.loadStats();
      await this.loadAllEvents();
    }
  };

  window.DataPool = DataPool;

})(window);
