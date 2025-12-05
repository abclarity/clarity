(function(window) {

  const APISettings = {
    async openModal() {
      const existingModal = document.getElementById('apiSettingsModal');
      if (existingModal) existingModal.remove();

      const modal = document.createElement('div');
      modal.id = 'apiSettingsModal';
      modal.className = 'modal';
      modal.innerHTML = `
        <div class="modal-content api-settings-modal">
          <div class="settings-header">
            <h2>⚙️ API Integrationen</h2>
            <button class="close-btn" onclick="document.getElementById('apiSettingsModal').remove()">×</button>
          </div>

          <div class="settings-content">
            <p class="settings-intro">
              Verbinde deine Marketing- und Sales-Tools, um automatisch Events in den Datenpool zu synchronisieren.
            </p>

            <div id="apiConnectionsList" class="api-connections-list">
              <div class="loading-spinner">Lade Verbindungen...</div>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      await this.loadConnections();
    },

    async loadConnections() {
      const listEl = document.getElementById('apiConnectionsList');

      try {
        const { data: connections, error } = await window.SupabaseClient
          .from('api_connections')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) {
          console.error('❌ Error loading connections:', error);
          listEl.innerHTML = '<div class="error-message">Fehler beim Laden der Verbindungen</div>';
          return;
        }

        const providers = [
          { id: 'clickfunnels', name: 'ClickFunnels', icon: '��', description: 'Lead- und Survey-Events' },
          { id: 'typeform', name: 'Typeform', icon: '📋', description: 'Formular-Antworten' },
          { id: 'calendly', name: 'Calendly', icon: '📅', description: 'Termin-Buchungen' },
          { id: 'facebook', name: 'Facebook Ads', icon: '📘', description: 'Werbe-Metriken' },
          { id: 'google', name: 'Google Ads', icon: '🔍', description: 'Werbe-Metriken' }
        ];

        listEl.innerHTML = providers.map(provider => {
          const connection = connections.find(c => c.provider === provider.id);
          const isConnected = connection && connection.status === 'active';

          return `
            <div class="api-provider-card">
              <div class="provider-icon">${provider.icon}</div>
              <div class="provider-info">
                <div class="provider-name">${provider.name}</div>
                <div class="provider-description">${provider.description}</div>
                ${connection && connection.last_sync ? `
                  <div class="provider-sync">
                    Letzte Sync: ${new Date(connection.last_sync).toLocaleString('de-DE')}
                  </div>
                ` : ''}
              </div>
              <div class="provider-actions">
                ${isConnected ? `
                  <span class="status-badge connected">✓ Verbunden</span>
                  <button class="btn-secondary btn-small" onclick="window.APISettings.disconnect('${provider.id}')">
                    Trennen
                  </button>
                ` : `
                  <span class="status-badge disconnected">Nicht verbunden</span>
                  <button class="btn-primary btn-small" onclick="window.APISettings.connect('${provider.id}')">
                    Verbinden
                  </button>
                `}
              </div>
            </div>
          `;
        }).join('');

      } catch (err) {
        console.error('❌ Error loading connections:', err);
        listEl.innerHTML = '<div class="error-message">Fehler beim Laden der Verbindungen</div>';
      }
    },

    connect(providerId) {
      console.log('🔗 Connecting to:', providerId);

      if (window.Toast) {
        window.Toast.info(`Integration mit ${providerId} wird geladen...`);
      }

      this.showConnectionModal(providerId);
    },

    showConnectionModal(providerId) {
      const existingModal = document.getElementById('connectionModal');
      if (existingModal) existingModal.remove();

      const providerNames = {
        clickfunnels: 'ClickFunnels',
        typeform: 'Typeform',
        calendly: 'Calendly',
        facebook: 'Facebook Ads',
        google: 'Google Ads'
      };

      const modal = document.createElement('div');
      modal.id = 'connectionModal';
      modal.className = 'modal';
      modal.innerHTML = `
        <div class="modal-content connection-modal">
          <div class="connection-header">
            <h2>🔗 ${providerNames[providerId]} verbinden</h2>
            <button class="close-btn" onclick="document.getElementById('connectionModal').remove()">×</button>
          </div>

          <div class="connection-content">
            <p>Gib deine API-Credentials ein, um ${providerNames[providerId]} zu verbinden:</p>

            <div class="connection-form">
              <div class="form-field">
                <label>API Key / Access Token:</label>
                <input type="password" id="apiKey" placeholder="Dein API Key..." />
              </div>

              ${providerId === 'clickfunnels' ? `
                <div class="form-field">
                  <label>Funnel ID (optional):</label>
                  <input type="text" id="funnelId" placeholder="z.B. 123456" />
                </div>
              ` : ''}

              <div class="form-actions">
                <button class="btn-secondary" onclick="document.getElementById('connectionModal').remove()">
                  Abbrechen
                </button>
                <button class="btn-primary" onclick="window.APISettings.saveConnection('${providerId}')">
                  Verbinden
                </button>
              </div>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
    },

    async saveConnection(providerId) {
      const apiKey = document.getElementById('apiKey')?.value.trim();

      if (!apiKey) {
        if (window.Toast) {
          window.Toast.error('Bitte gib einen API Key ein');
        }
        return;
      }

      const credentials = { apiKey };

      if (providerId === 'clickfunnels') {
        const funnelId = document.getElementById('funnelId')?.value.trim();
        if (funnelId) {
          credentials.funnelId = funnelId;
        }
      }

      try {
        const { data, error } = await window.SupabaseClient
          .from('api_connections')
          .insert({
            provider: providerId,
            credentials: credentials,
            status: 'active'
          })
          .select()
          .single();

        if (error) {
          console.error('❌ Error saving connection:', error);
          if (window.Toast) {
            window.Toast.error('Fehler beim Speichern der Verbindung');
          }
          return;
        }

        if (window.Toast) {
          window.Toast.success('Verbindung erfolgreich hergestellt!');
        }

        document.getElementById('connectionModal')?.remove();
        await this.loadConnections();

      } catch (err) {
        console.error('❌ Error saving connection:', err);
        if (window.Toast) {
          window.Toast.error('Fehler beim Speichern der Verbindung');
        }
      }
    },

    async disconnect(providerId) {
      if (!confirm('Möchtest du die Verbindung wirklich trennen?')) {
        return;
      }

      try {
        const { error } = await window.SupabaseClient
          .from('api_connections')
          .delete()
          .eq('provider', providerId);

        if (error) {
          console.error('❌ Error disconnecting:', error);
          if (window.Toast) {
            window.Toast.error('Fehler beim Trennen der Verbindung');
          }
          return;
        }

        if (window.Toast) {
          window.Toast.success('Verbindung getrennt');
        }

        await this.loadConnections();

      } catch (err) {
        console.error('❌ Error disconnecting:', err);
        if (window.Toast) {
          window.Toast.error('Fehler beim Trennen der Verbindung');
        }
      }
    }
  };

  window.APISettings = APISettings;

})(window);
