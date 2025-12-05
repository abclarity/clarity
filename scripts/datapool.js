(function(window) {

  const ITEMS_PER_PAGE = 50;

  const EVENT_TYPES = [
    { id: 'lead', label: 'Leads', icon: '📧' },
    { id: 'survey', label: 'Survey', icon: '📋' },
    { id: 'surveyQuali', label: 'Survey Quali', icon: '✅' },
    { id: 'settingBooking', label: 'Setting Booking', icon: '📅' },
    { id: 'settingTermin', label: 'Setting Termin', icon: '📆' },
    { id: 'settingCall', label: 'Setting Call', icon: '☎️' },
    { id: 'closingBooking', label: 'Closing Booking', icon: '🎯' },
    { id: 'closingTermin', label: 'Closing Termin', icon: '🎯' },
    { id: 'closingCall', label: 'Closing Call', icon: '📞' },
    { id: 'unit', label: 'Units', icon: '💰' }
  ];

  const DataPool = {
    currentPage: 1,
    totalItems: 0,
    currentTab: 'lead',
    filters: {
      search: '',
      funnel: '',
      source: '',
      country: '',
      dateFrom: '',
      dateTo: ''
    },
    sortBy: 'created_at',
    sortOrder: 'desc',

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
            <button id="addLeadBtn" class="btn-primary">
              ➕ Neuer Lead
            </button>
            <button id="csvImportBtn" class="btn-secondary">
              📤 CSV Import
            </button>
          </div>
        </div>

        <div class="datapool-tabs">
          ${EVENT_TYPES.map(type => `
            <button class="datapool-tab ${type.id === this.currentTab ? 'active' : ''}"
                    data-tab="${type.id}">
              ${type.icon} ${type.label}
            </button>
          `).join('')}
        </div>

        <div class="datapool-filters">
          <input type="text" id="searchInput" placeholder="Suche nach Name, E-Mail oder Telefon..." />

          <select id="funnelFilter">
            <option value="">Alle Funnels</option>
          </select>

          <select id="sourceFilter">
            <option value="">Alle Traffic Sources</option>
          </select>

          <select id="countryFilter">
            <option value="">Alle Länder</option>
          </select>

          <input type="date" id="dateFromFilter" placeholder="Von" />
          <input type="date" id="dateToFilter" placeholder="Bis" />

          <button id="applyFiltersBtn" class="btn-primary">Filtern</button>
          <button id="resetFiltersBtn" class="btn-secondary">Zurücksetzen</button>
        </div>

        <div class="datapool-table-container">
          <table class="datapool-table">
            <thead id="tableHead">
            </thead>
            <tbody id="tableBody">
              <tr>
                <td colspan="10" class="loading-cell">Laden...</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="datapool-pagination">
          <button id="prevPageBtn" class="btn-secondary" disabled>← Zurück</button>
          <span id="pageInfo">Seite 1</span>
          <button id="nextPageBtn" class="btn-secondary">Weiter →</button>
        </div>
      `;

      await this.loadFunnelOptions();
      this.attachListeners();
      this.renderTableHeaders();
      await this.loadTabData();
    },

    async loadFunnelOptions() {
      const funnels = FunnelAPI.loadFunnels();
      const funnelFilter = document.getElementById('funnelFilter');
      if (funnelFilter) {
        funnels.forEach(funnel => {
          const option = document.createElement('option');
          option.value = funnel.id;
          option.textContent = funnel.name;
          funnelFilter.appendChild(option);
        });
      }
    },

    attachListeners() {
      document.querySelectorAll('.datapool-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
          const tabId = e.currentTarget.dataset.tab;
          this.switchTab(tabId);
        });
      });

      const searchInput = document.getElementById('searchInput');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          this.filters.search = e.target.value;
        });
      }

      const funnelFilter = document.getElementById('funnelFilter');
      if (funnelFilter) {
        funnelFilter.addEventListener('change', (e) => {
          this.filters.funnel = e.target.value;
        });
      }

      const sourceFilter = document.getElementById('sourceFilter');
      if (sourceFilter) {
        sourceFilter.addEventListener('change', (e) => {
          this.filters.source = e.target.value;
        });
      }

      const countryFilter = document.getElementById('countryFilter');
      if (countryFilter) {
        countryFilter.addEventListener('change', (e) => {
          this.filters.country = e.target.value;
        });
      }

      const dateFromFilter = document.getElementById('dateFromFilter');
      if (dateFromFilter) {
        dateFromFilter.addEventListener('change', (e) => {
          this.filters.dateFrom = e.target.value;
        });
      }

      const dateToFilter = document.getElementById('dateToFilter');
      if (dateToFilter) {
        dateToFilter.addEventListener('change', (e) => {
          this.filters.dateTo = e.target.value;
        });
      }

      const applyFiltersBtn = document.getElementById('applyFiltersBtn');
      if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', () => {
          this.currentPage = 1;
          this.loadTabData();
        });
      }

      const resetFiltersBtn = document.getElementById('resetFiltersBtn');
      if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', () => {
          this.resetFilters();
        });
      }

      const prevPageBtn = document.getElementById('prevPageBtn');
      if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
          if (this.currentPage > 1) {
            this.currentPage--;
            this.loadTabData();
          }
        });
      }

      const nextPageBtn = document.getElementById('nextPageBtn');
      if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
          this.currentPage++;
          this.loadTabData();
        });
      }

      const addLeadBtn = document.getElementById('addLeadBtn');
      if (addLeadBtn) {
        addLeadBtn.addEventListener('click', () => {
          this.openAddLeadModal();
        });
      }

      const csvImportBtn = document.getElementById('csvImportBtn');
      if (csvImportBtn) {
        csvImportBtn.addEventListener('click', () => {
          this.openCSVImport();
        });
      }
    },

    attachSortListeners() {
      document.querySelectorAll('.datapool-table th[data-sort]').forEach(th => {
        th.addEventListener('click', (e) => {
          const sortField = e.target.dataset.sort;
          if (this.sortBy === sortField) {
            this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
          } else {
            this.sortBy = sortField;
            this.sortOrder = 'asc';
          }
          this.currentPage = 1;
          this.updateSortIcons();
          this.loadTabData();
        });
      });
    },

    switchTab(tabId) {
      this.currentTab = tabId;
      this.currentPage = 1;

      document.querySelectorAll('.datapool-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabId);
      });

      this.renderTableHeaders();
      this.loadTabData();
    },

    renderTableHeaders() {
      const tableHead = document.getElementById('tableHead');
      if (!tableHead) return;

      const isUnitsTab = this.currentTab === 'unit';

      tableHead.innerHTML = `
        <tr>
          <th data-sort="name">Name ▼</th>
          <th data-sort="primary_email">E-Mail ▼</th>
          <th data-sort="primary_phone">Telefon ▼</th>
          <th data-sort="event_date">Event-Datum ▼</th>
          <th data-sort="funnel_id">Funnel ▼</th>
          <th data-sort="source">Traffic Source ▼</th>
          ${isUnitsTab ? '<th data-sort="revenue">Revenue ▼</th>' : ''}
          ${isUnitsTab ? '<th data-sort="cash">Cash ▼</th>' : ''}
          <th data-sort="created_at">Erstellt am ▼</th>
          <th>Aktionen</th>
        </tr>
      `;

      this.attachSortListeners();
      this.updateSortIcons();
    },

    updateSortIcons() {
      document.querySelectorAll('.datapool-table th[data-sort]').forEach(th => {
        const sortField = th.dataset.sort;
        const text = th.textContent.replace(' ▼', '').replace(' ▲', '');
        if (this.sortBy === sortField) {
          th.textContent = text + (this.sortOrder === 'asc' ? ' ▲' : ' ▼');
        } else {
          th.textContent = text + ' ▼';
        }
      });
    },

    resetFilters() {
      this.filters = {
        search: '',
        funnel: '',
        source: '',
        country: '',
        dateFrom: '',
        dateTo: ''
      };

      document.getElementById('searchInput').value = '';
      document.getElementById('funnelFilter').value = '';
      document.getElementById('sourceFilter').value = '';
      document.getElementById('countryFilter').value = '';
      document.getElementById('dateFromFilter').value = '';
      document.getElementById('dateToFilter').value = '';

      this.currentPage = 1;
      this.loadTabData();
    },

    async loadTabData() {
      const tbody = document.getElementById('tableBody');
      if (!tbody) return;

      const isUnitsTab = this.currentTab === 'unit';
      const colCount = isUnitsTab ? 10 : 8;
      tbody.innerHTML = `<tr><td colspan="${colCount}" class="loading-cell">Laden...</td></tr>`;

      try {
        let query = window.SupabaseClient
          .from('events')
          .select(`
            id,
            event_type,
            event_date,
            funnel_id,
            source,
            revenue,
            cash,
            created_at,
            leads!inner (
              id,
              name,
              primary_email,
              primary_phone,
              country
            )
          `, { count: 'exact' })
          .eq('event_type', this.currentTab);

        if (this.filters.funnel) {
          query = query.eq('funnel_id', this.filters.funnel);
        }

        if (this.filters.source) {
          query = query.eq('source', this.filters.source);
        }

        if (this.filters.country) {
          query = query.eq('leads.country', this.filters.country);
        }

        if (this.filters.dateFrom) {
          query = query.gte('event_date', this.filters.dateFrom);
        }

        if (this.filters.dateTo) {
          query = query.lte('event_date', this.filters.dateTo);
        }

        if (this.filters.search) {
          query = query.or(`leads.name.ilike.%${this.filters.search}%,leads.primary_email.ilike.%${this.filters.search}%,leads.primary_phone.ilike.%${this.filters.search}%`);
        }

        query = query.order(this.sortBy, { ascending: this.sortOrder === 'asc' });

        const offset = (this.currentPage - 1) * ITEMS_PER_PAGE;
        query = query.range(offset, offset + ITEMS_PER_PAGE - 1);

        const { data, error, count } = await query;

        if (error) {
          console.error('❌ Error loading tab data:', error);
          tbody.innerHTML = `<tr><td colspan="${colCount}" class="error-cell">Fehler beim Laden der Daten</td></tr>`;
          return;
        }

        this.totalItems = count || 0;
        await this.loadFilterOptions();

        if (!data || data.length === 0) {
          tbody.innerHTML = `<tr><td colspan="${colCount}" class="empty-cell">Keine Einträge vorhanden</td></tr>`;
          this.updatePagination();
          return;
        }

        tbody.innerHTML = '';
        data.forEach(event => {
          const item = {
            event_id: event.id,
            lead_id: event.leads.id,
            lead_name: event.leads.name,
            lead_email: event.leads.primary_email,
            lead_phone: event.leads.primary_phone,
            event_date: event.event_date,
            funnel_id: event.funnel_id,
            source: event.source,
            revenue: event.revenue,
            cash: event.cash,
            created_at: event.created_at
          };
          const row = this.createDataRow(item);
          tbody.appendChild(row);
        });

        this.updatePagination();
      } catch (err) {
        console.error('❌ Error loading tab data:', err);
        tbody.innerHTML = `<tr><td colspan="${colCount}" class="error-cell">Fehler beim Laden der Daten</td></tr>`;
      }
    },

    async loadFilterOptions() {
      try {
        const { data: sources } = await window.SupabaseClient
          .from('events')
          .select('source')
          .not('source', 'is', null)
          .neq('source', '');

        const uniqueSources = [...new Set(sources?.map(s => s.source) || [])];
        const sourceFilter = document.getElementById('sourceFilter');
        if (sourceFilter) {
          const currentValue = sourceFilter.value;
          sourceFilter.innerHTML = '<option value="">Alle Traffic Sources</option>';
          uniqueSources.forEach(source => {
            const option = document.createElement('option');
            option.value = source;
            option.textContent = source;
            sourceFilter.appendChild(option);
          });
          sourceFilter.value = currentValue;
        }

        const { data: leadsData } = await window.SupabaseClient
          .from('leads')
          .select('country')
          .not('country', 'is', null)
          .neq('country', '');

        const uniqueCountries = [...new Set(leadsData?.map(c => c.country) || [])];
        const countryFilter = document.getElementById('countryFilter');
        if (countryFilter) {
          const currentValue = countryFilter.value;
          countryFilter.innerHTML = '<option value="">Alle Länder</option>';
          uniqueCountries.forEach(country => {
            const option = document.createElement('option');
            option.value = country;
            option.textContent = country;
            countryFilter.appendChild(option);
          });
          countryFilter.value = currentValue;
        }
      } catch (err) {
        console.error('❌ Error loading filter options:', err);
      }
    },

    createDataRow(item) {
      const tr = document.createElement('tr');
      tr.dataset.eventId = item.event_id;
      tr.dataset.leadId = item.lead_id;

      const eventDate = new Date(item.event_date).toLocaleDateString('de-DE');
      const createdAt = new Date(item.created_at).toLocaleDateString('de-DE');
      const isUnitsTab = this.currentTab === 'unit';

      tr.innerHTML = `
        <td>${item.lead_name || '-'}</td>
        <td>${item.lead_email || '-'}</td>
        <td>${item.lead_phone || '-'}</td>
        <td>${eventDate}</td>
        <td>${item.funnel_id || '-'}</td>
        <td>${item.source || '-'}</td>
        ${isUnitsTab ? `<td>${item.revenue ? item.revenue.toFixed(2) + ' €' : '-'}</td>` : ''}
        ${isUnitsTab ? `<td>${item.cash ? item.cash.toFixed(2) + ' €' : '-'}</td>` : ''}
        <td>${createdAt}</td>
        <td class="actions-cell">
          <button class="btn-icon view-btn" data-lead-id="${item.lead_id}" title="Lead ansehen">👁️</button>
          <button class="btn-icon delete-btn" data-event-id="${item.event_id}" title="Event löschen">🗑️</button>
        </td>
      `;

      const viewBtn = tr.querySelector('.view-btn');
      if (viewBtn) {
        viewBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.openLeadDetail(item.lead_id);
        });
      }

      const deleteBtn = tr.querySelector('.delete-btn');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.deleteEvent(item.event_id);
        });
      }

      tr.addEventListener('click', () => {
        this.openLeadDetail(item.lead_id);
      });

      return tr;
    },

    updatePagination() {
      const totalPages = Math.ceil(this.totalItems / ITEMS_PER_PAGE);
      const pageInfo = document.getElementById('pageInfo');
      const prevBtn = document.getElementById('prevPageBtn');
      const nextBtn = document.getElementById('nextPageBtn');

      if (pageInfo) {
        pageInfo.textContent = `Seite ${this.currentPage} von ${totalPages || 1} (${this.totalItems} Einträge)`;
      }

      if (prevBtn) {
        prevBtn.disabled = this.currentPage === 1;
      }

      if (nextBtn) {
        nextBtn.disabled = this.currentPage >= totalPages;
      }
    },

    async deleteEvent(eventId) {
      if (!confirm('Möchten Sie dieses Event wirklich löschen?')) {
        return;
      }

      try {
        const { error } = await window.SupabaseClient
          .from('events')
          .delete()
          .eq('id', eventId);

        if (error) {
          console.error('❌ Error deleting event:', error);
          if (window.Toast) {
            window.Toast.error('Fehler beim Löschen des Events');
          }
          return;
        }

        if (window.Toast) {
          window.Toast.success('Event erfolgreich gelöscht');
        }

        await this.loadTabData();
      } catch (err) {
        console.error('❌ Error deleting event:', err);
        if (window.Toast) {
          window.Toast.error('Fehler beim Löschen des Events');
        }
      }
    },

    openAddLeadModal() {
      const modal = this.createLeadModal(null);
      document.body.appendChild(modal);
    },

    async openEditLeadModal(leadId) {
      try {
        const { data: lead, error } = await window.SupabaseClient
          .from('leads')
          .select('*')
          .eq('id', leadId)
          .maybeSingle();

        if (error || !lead) {
          console.error('❌ Error loading lead:', error);
          if (window.Toast) {
            window.Toast.error('Lead nicht gefunden');
          }
          return;
        }

        const modal = this.createLeadModal(lead);
        document.body.appendChild(modal);
      } catch (err) {
        console.error('❌ Error opening edit modal:', err);
        if (window.Toast) {
          window.Toast.error('Fehler beim Laden der Lead-Daten');
        }
      }
    },

    createLeadModal(lead) {
      const isEdit = lead !== null;
      const modal = document.createElement('div');
      modal.id = 'leadModal';
      modal.className = 'modal';

      const funnels = FunnelAPI.loadFunnels();
      const funnelOptions = funnels.map(f =>
        `<option value="${f.id}" ${lead && lead.funnel_id === f.id ? 'selected' : ''}>${f.name}</option>`
      ).join('');

      modal.innerHTML = `
        <div class="modal-content lead-modal">
          <div class="modal-header">
            <h2>${isEdit ? 'Lead bearbeiten' : 'Neuer Lead'}</h2>
            <button class="close-btn" onclick="document.getElementById('leadModal').remove()">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Name *</label>
              <input type="text" id="leadName" value="${lead?.name || ''}" required />
            </div>

            <div class="form-group">
              <label>E-Mail *</label>
              <input type="email" id="leadEmail" value="${lead?.primary_email || ''}" required />
            </div>

            <div class="form-group">
              <label>Telefon</label>
              <input type="text" id="leadPhone" value="${lead?.primary_phone || ''}" />
            </div>

            <div class="form-group">
              <label>Traffic Source</label>
              <input type="text" id="leadSource" value="${lead?.source || ''}" />
            </div>

            <div class="form-group">
              <label>UTM Campaign</label>
              <input type="text" id="leadUtmCampaign" value="${lead?.utm_campaign || ''}" />
            </div>

            <div class="form-group">
              <label>Land</label>
              <input type="text" id="leadCountry" value="${lead?.country || ''}" />
            </div>

            <div class="form-group">
              <label>Funnel</label>
              <select id="leadFunnel">
                <option value="">Kein Funnel</option>
                ${funnelOptions}
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" onclick="document.getElementById('leadModal').remove()">
              Abbrechen
            </button>
            <button class="btn-primary" id="saveLeadBtn">
              ${isEdit ? 'Speichern' : 'Erstellen'}
            </button>
          </div>
        </div>
      `;

      const saveBtn = modal.querySelector('#saveLeadBtn');
      if (saveBtn) {
        saveBtn.addEventListener('click', () => {
          if (isEdit) {
            this.updateLead(lead.id);
          } else {
            this.createLead();
          }
        });
      }

      return modal;
    },

    async createLead() {
      const name = document.getElementById('leadName')?.value.trim();
      const email = document.getElementById('leadEmail')?.value.trim();
      const phone = document.getElementById('leadPhone')?.value.trim();
      const source = document.getElementById('leadSource')?.value.trim();
      const utmCampaign = document.getElementById('leadUtmCampaign')?.value.trim();
      const country = document.getElementById('leadCountry')?.value.trim();
      const funnelId = document.getElementById('leadFunnel')?.value;

      if (!name || !email) {
        if (window.Toast) {
          window.Toast.error('Name und E-Mail sind erforderlich');
        }
        return;
      }

      try {
        const leadData = {
          name,
          primary_email: email,
          emails: [email],
          primary_phone: phone || null,
          phones: phone ? [phone] : [],
          source: source || null,
          utm_campaign: utmCampaign || '',
          country: country || '',
          funnel_id: funnelId || null,
          metadata: {}
        };

        const { data: lead, error: leadError } = await window.SupabaseClient
          .from('leads')
          .insert([leadData])
          .select()
          .single();

        if (leadError) {
          console.error('❌ Error creating lead:', leadError);
          if (window.Toast) {
            window.Toast.error('Fehler beim Erstellen des Leads');
          }
          return;
        }

        const eventData = {
          lead_id: lead.id,
          event_type: 'lead',
          event_date: new Date().toISOString().split('T')[0],
          funnel_id: funnelId || null,
          source: source || null,
          metadata: {}
        };

        const { error: eventError } = await window.SupabaseClient
          .from('events')
          .insert([eventData]);

        if (eventError) {
          console.error('❌ Error creating lead event:', eventError);
        }

        if (window.Toast) {
          window.Toast.success('Lead erfolgreich erstellt');
        }

        document.getElementById('leadModal')?.remove();
        await this.loadTabData();
      } catch (err) {
        console.error('❌ Error creating lead:', err);
        if (window.Toast) {
          window.Toast.error('Fehler beim Erstellen des Leads');
        }
      }
    },

    async updateLead(leadId) {
      const name = document.getElementById('leadName')?.value.trim();
      const email = document.getElementById('leadEmail')?.value.trim();
      const phone = document.getElementById('leadPhone')?.value.trim();
      const source = document.getElementById('leadSource')?.value.trim();
      const utmCampaign = document.getElementById('leadUtmCampaign')?.value.trim();
      const country = document.getElementById('leadCountry')?.value.trim();
      const funnelId = document.getElementById('leadFunnel')?.value;

      if (!name || !email) {
        if (window.Toast) {
          window.Toast.error('Name und E-Mail sind erforderlich');
        }
        return;
      }

      try {
        const { data: currentLead } = await window.SupabaseClient
          .from('leads')
          .select('emails, phones')
          .eq('id', leadId)
          .maybeSingle();

        let emails = currentLead?.emails || [];
        if (!emails.includes(email)) {
          emails = [email, ...emails];
        }

        let phones = currentLead?.phones || [];
        if (phone && !phones.includes(phone)) {
          phones = [phone, ...phones];
        }

        const leadData = {
          name,
          primary_email: email,
          emails,
          primary_phone: phone || null,
          phones,
          source: source || null,
          utm_campaign: utmCampaign || '',
          country: country || '',
          funnel_id: funnelId || null
        };

        const { error } = await window.SupabaseClient
          .from('leads')
          .update(leadData)
          .eq('id', leadId);

        if (error) {
          console.error('❌ Error updating lead:', error);
          if (window.Toast) {
            window.Toast.error('Fehler beim Aktualisieren des Leads');
          }
          return;
        }

        if (window.Toast) {
          window.Toast.success('Lead erfolgreich aktualisiert');
        }

        document.getElementById('leadModal')?.remove();
        await this.loadTabData();
      } catch (err) {
        console.error('❌ Error updating lead:', err);
        if (window.Toast) {
          window.Toast.error('Fehler beim Aktualisieren des Leads');
        }
      }
    },

    async deleteLead(leadId) {
      if (!confirm('Möchten Sie diesen Lead wirklich löschen? Dies wird auch alle zugehörigen Events löschen.')) {
        return;
      }

      try {
        const { error } = await window.SupabaseClient
          .from('leads')
          .delete()
          .eq('id', leadId);

        if (error) {
          console.error('❌ Error deleting lead:', error);
          if (window.Toast) {
            window.Toast.error('Fehler beim Löschen des Leads');
          }
          return;
        }

        if (window.Toast) {
          window.Toast.success('Lead erfolgreich gelöscht');
        }

        await this.loadTabData();
      } catch (err) {
        console.error('❌ Error deleting lead:', err);
        if (window.Toast) {
          window.Toast.error('Fehler beim Löschen des Leads');
        }
      }
    },

    async openLeadDetail(leadId) {
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
              <strong>E-Mail:</strong> ${lead.primary_email || '-'}
            </div>
            <div class="info-group">
              <strong>Telefon:</strong> ${lead.primary_phone || '-'}
            </div>
            <div class="info-group">
              <strong>Traffic Source:</strong> ${lead.source || '-'}
            </div>
            <div class="info-group">
              <strong>UTM Campaign:</strong> ${lead.utm_campaign || '-'}
            </div>
            <div class="info-group">
              <strong>Land:</strong> ${lead.country || '-'}
            </div>
            <div class="info-group">
              <strong>Funnel:</strong> ${lead.funnel_id || '-'}
            </div>
            <div class="info-group">
              <strong>Erstellt am:</strong> ${new Date(lead.created_at).toLocaleString('de-DE')}
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
    }
  };

  window.DataPool = DataPool;

})(window);
