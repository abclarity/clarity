(function(window) {

  const SIDEBAR_STATE_KEY = 'clarity_sidebar_collapsed';

  const SidebarAPI = {
    init() {
      this.createSidebar();
      this.attachListeners();
      this.restoreState();
    },

    createSidebar() {
      const existingSidebar = document.getElementById('appSidebar');
      if (existingSidebar) existingSidebar.remove();

      const sidebar = document.createElement('div');
      sidebar.id = 'appSidebar';
      sidebar.className = 'app-sidebar';
      sidebar.innerHTML = `
        <div class="sidebar-header">
          <button id="sidebarToggle" class="sidebar-toggle" title="Navigation ein-/ausklappen">
            <span class="toggle-icon">☰</span>
          </button>
        </div>
        <nav class="sidebar-nav">
          <button class="sidebar-item active" data-view="trackingsheets">
            <span class="sidebar-icon">📊</span>
            <span class="sidebar-label">Trackingsheets</span>
          </button>
          <button class="sidebar-item" data-view="datapool">
            <span class="sidebar-icon">💾</span>
            <span class="sidebar-label">Datenpool</span>
          </button>
        </nav>
      `;

      document.body.insertBefore(sidebar, document.body.firstChild);
    },

    attachListeners() {
      const toggleBtn = document.getElementById('sidebarToggle');
      const sidebar = document.getElementById('appSidebar');
      const navItems = document.querySelectorAll('.sidebar-item');

      if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
          const isCollapsed = sidebar.classList.toggle('collapsed');
          localStorage.setItem(SIDEBAR_STATE_KEY, isCollapsed ? 'true' : 'false');
        });
      }

      navItems.forEach(item => {
        item.addEventListener('click', () => {
          const view = item.dataset.view;
          this.switchView(view);

          navItems.forEach(nav => nav.classList.remove('active'));
          item.classList.add('active');
        });
      });
    },

    switchView(view) {
      console.log('🔄 Switching to view:', view);

      if (view === 'trackingsheets') {
        document.getElementById('app').style.display = 'block';
        document.getElementById('tabs').style.display = 'flex';
        document.getElementById('app-header').style.display = 'block';

        const datapoolView = document.getElementById('datapoolView');
        if (datapoolView) {
          datapoolView.style.display = 'none';
        }
      } else if (view === 'datapool') {
        document.getElementById('app').style.display = 'none';
        document.getElementById('tabs').style.display = 'none';
        document.getElementById('app-header').style.display = 'none';

        let datapoolView = document.getElementById('datapoolView');
        if (!datapoolView) {
          datapoolView = document.createElement('div');
          datapoolView.id = 'datapoolView';
          datapoolView.className = 'datapool-view';
          document.body.appendChild(datapoolView);

          if (window.DataPool && window.DataPool.init) {
            window.DataPool.init();
          }
        } else {
          datapoolView.style.display = 'block';
        }
      }
    },

    restoreState() {
      const sidebar = document.getElementById('appSidebar');
      const isCollapsed = localStorage.getItem(SIDEBAR_STATE_KEY) === 'true';

      if (isCollapsed && sidebar) {
        sidebar.classList.add('collapsed');
      }
    }
  };

  window.SidebarAPI = SidebarAPI;

})(window);
