/**
 * Great Goods — Core App Controller, Authentication, & UI Shell
 */

class AppController {
  constructor() {
    this.currentUser = null;
    this.audioCtx = null;
  }

  async init() {
    this.bindHeaderActions();
    this.setupRealtimeListeners();

    if (window.api.token && window.api.user) {
      this.currentUser = window.api.user;
      await this.loadApp();
    } else {
      this.showLoginModal();
    }
  }

  setupRealtimeListeners() {
    window.api.on('data_updated', (data) => {
      if (this.currentUser) {
        if (this.currentUser.role === 'admin') {
          window.adminDashboard.onDataUpdated(data);
        } else if (this.currentUser.role === 'manager') {
          window.managerDashboard.onDataUpdated(data);
        }
      }
    });

    window.api.on('transfer_created', (data) => {
      if (this.currentUser) {
        if (this.currentUser.role === 'admin') {
          window.adminDashboard.onTransferCreated(data);
        } else if (this.currentUser.role === 'manager') {
          window.managerDashboard.onTransferCreated(data);
        }
      }
    });

    window.api.on('transfer_acknowledged', (data) => {
      if (this.currentUser) {
        if (this.currentUser.role === 'admin') {
          window.adminDashboard.onTransferAcknowledged(data);
        } else if (this.currentUser.role === 'manager') {
          window.managerDashboard.onTransferAcknowledged(data);
        }
      }
    });

    window.api.on('data_reset', () => {
      this.showToast('Demo data was reset to prototype seed.', 'info');
      this.loadApp();
    });
  }

  async loadApp() {
    this.updateHeaderUserInfo();
    try {
      const state = await window.api.getState();

      if (this.currentUser.role === 'admin') {
        await window.adminDashboard.init(state);
      } else {
        await window.managerDashboard.init(state);
      }

      this.hideLoginModal();
    } catch (err) {
      console.error('Failed to load application state:', err);
      this.showToast(err.message, 'error');
      this.showLoginModal();
    }
  }

  updateHeaderUserInfo() {
    const userContainer = document.getElementById('header-user-info');
    const resetBtn = document.getElementById('header-reset-btn');

    if (!userContainer) return;

    if (this.currentUser) {
      const roleLabel = this.currentUser.role === 'admin' ? 'Business Owner (Admin)' : 'Store Manager';
      const initials = this.currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2);

      userContainer.innerHTML = `
        <div class="user-badge">
          <div class="user-avatar">${initials}</div>
          <div style="text-align: left; line-height: 1.2;">
            <div style="font-weight: 700; color: #fff;">${this.currentUser.name}</div>
            <div style="font-size: 0.7rem; color: var(--text-muted);">${roleLabel}</div>
          </div>
        </div>
      `;

      if (resetBtn) {
        resetBtn.style.display = this.currentUser.role === 'admin' ? 'inline-flex' : 'none';
      }
    } else {
      userContainer.innerHTML = '';
      if (resetBtn) resetBtn.style.display = 'none';
    }
  }

  bindHeaderActions() {
    const logoutBtn = document.getElementById('header-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        window.api.logout();
        this.currentUser = null;
        window.chartManager.destroyAll();
        document.getElementById('app-main').innerHTML = '';
        this.updateHeaderUserInfo();
        this.showLoginModal();
      });
    }

    const resetBtn = document.getElementById('header-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', async () => {
        if (confirm('Reset all inventory, sales, and transfers back to original prototype seed data?')) {
          try {
            await window.api.resetData();
          } catch (err) {
            this.showToast(err.message, 'error');
          }
        }
      });
    }
  }

  showLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) {
      modal.style.display = 'flex';
      this.setupLoginModalListeners();
    }
  }

  hideLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  setupLoginModalListeners() {
    const form = document.getElementById('login-form');
    const errorEl = document.getElementById('login-error');
    const demoBtns = document.querySelectorAll('.demo-account-btn');

    if (form) {
      form.onsubmit = async (e) => {
        e.preventDefault();
        errorEl.style.display = 'none';
        const u = document.getElementById('login-username').value.trim();
        const p = document.getElementById('login-password').value;

        try {
          const res = await window.api.login(u, p);
          this.currentUser = res.user;
          this.showToast(`Welcome back, ${this.currentUser.name}!`, 'success');
          await this.loadApp();
        } catch (err) {
          errorEl.textContent = err.message;
          errorEl.style.display = 'block';
        }
      };
    }

    demoBtns.forEach(btn => {
      btn.onclick = async () => {
        const u = btn.getAttribute('data-username');
        const p = btn.getAttribute('data-password');
        errorEl.style.display = 'none';

        try {
          const res = await window.api.login(u, p);
          this.currentUser = res.user;
          this.showToast(`Logged in as ${this.currentUser.name} (${this.currentUser.title})`, 'success');
          await this.loadApp();
        } catch (err) {
          errorEl.textContent = err.message;
          errorEl.style.display = 'block';
        }
      };
    });
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
    `;

    if (type === 'success') {
      icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>`;
    } else if (type === 'warning') {
      icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`;
    } else if (type === 'error') {
      icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 18L18 6M6 6l12 12"/></svg>`;
    }

    toast.innerHTML = `
      <div style="flex-shrink:0;">${icon}</div>
      <div style="flex:1; font-weight: 500;">${message}</div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 3800);
  }

  playSound() {
    try {
      if (!this.audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioContext();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, this.audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880.00, this.audioCtx.currentTime + 0.12); // A5

      gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.2);
    } catch (e) {
      // Audio not permitted or supported
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new AppController();
  window.app.init();
});
