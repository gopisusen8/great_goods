/**
 * Great Goods — API & Real-Time Sync Client
 * Resilient for both WebSocket and Serverless (Vercel) environments
 */

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('great_goods_token') || null;
    this.user = JSON.parse(localStorage.getItem('great_goods_user') || 'null');
    this.socket = null;
    this.listeners = new Map();
    this.lastStateHash = '';
    this.pollInterval = null;
    this.initSocket();
    this.startPolling();
  }

  initSocket() {
    if (typeof io !== 'undefined') {
      try {
        this.socket = io({
          transports: ['websocket', 'polling'],
          timeout: 4000,
          reconnectionAttempts: 4
        });

        this.socket.on('connect', () => {
          console.log('[Socket] Connected with ID:', this.socket.id);
          this.updateSyncStatus(true);
        });

        this.socket.on('disconnect', () => {
          console.log('[Socket] Disconnected - polling continues');
          this.updateSyncStatus(true, 'LIVE SYNC');
        });

        this.socket.on('connect_error', () => {
          // In serverless (Vercel), websockets gracefully fallback to live sync via polling
          this.updateSyncStatus(true, 'LIVE SYNC');
        });

        this.socket.on('data_updated', (data) => {
          this.emit('data_updated', data);
        });

        this.socket.on('transfer_created', (data) => {
          this.emit('transfer_created', data);
        });

        this.socket.on('transfer_acknowledged', (data) => {
          this.emit('transfer_acknowledged', data);
        });

        this.socket.on('data_reset', (data) => {
          this.emit('data_reset', data);
        });
      } catch (err) {
        console.warn('Socket.io initialization skipped, relying on polling:', err);
        this.updateSyncStatus(true, 'LIVE SYNC');
      }
    } else {
      this.updateSyncStatus(true, 'LIVE SYNC');
    }
  }

  startPolling() {
    if (this.pollInterval) clearInterval(this.pollInterval);

    // Poll every 3.5 seconds to sync data across devices/tabs on serverless cloud
    this.pollInterval = setInterval(async () => {
      if (!this.token || !this.user) return;
      try {
        const state = await this.getState();
        const hash = JSON.stringify({
          stores: state.stores || state.store,
          transfersCount: (state.transfers || []).length,
          lastAck: (state.transfers || []).map(t => t.status).join(',')
        });

        if (this.lastStateHash && this.lastStateHash !== hash) {
          // State changed remotely!
          if (this.user.role === 'admin' && window.adminDashboard) {
            window.adminDashboard.state = state;
            window.adminDashboard.refreshAllStoreStockRows();
            window.adminDashboard.updateKPIs();
            window.adminDashboard.updateActivityTable();
            window.adminDashboard.refreshTransferPreview();
          } else if (this.user.role === 'manager' && window.managerDashboard) {
            window.managerDashboard.state = state;
            window.managerDashboard.updateProductCardsDOM();
            window.managerDashboard.updateIncomingTransfersDOM();
            window.managerDashboard.updateManagerKPIs();
            window.managerDashboard.updateActivityFeed();
          }
        }
        this.lastStateHash = hash;
      } catch (e) {
        // Silent background poll error
      }
    }, 3500);
  }

  updateSyncStatus(isLive, label = 'LIVE SYNC') {
    const syncPill = document.getElementById('sync-status-indicator');
    if (syncPill) {
      if (isLive) {
        syncPill.innerHTML = `<span class="pulse-dot"></span> ${label}`;
        syncPill.style.borderColor = 'rgba(16, 185, 129, 0.25)';
        syncPill.style.color = 'var(--emerald)';
      } else {
        syncPill.innerHTML = '<span class="pulse-dot" style="background:#f59e0b;animation:none;"></span> CONNECTING...';
        syncPill.style.borderColor = 'rgba(245, 158, 11, 0.25)';
        syncPill.style.color = 'var(--amber)';
      }
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(cb => cb(data));
    }
  }

  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async login(username, password) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');

    this.token = data.token;
    this.user = data.user;
    localStorage.setItem('great_goods_token', this.token);
    localStorage.setItem('great_goods_user', JSON.stringify(this.user));
    return data;
  }

  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('great_goods_token');
    localStorage.removeItem('great_goods_user');
  }

  async getDemoUsers() {
    const res = await fetch('/api/auth/demo-users');
    return await res.json();
  }

  async getState() {
    const res = await fetch('/api/state', {
      headers: this.getHeaders()
    });
    if (res.status === 401) {
      this.logout();
      window.location.reload();
      throw new Error('Session expired');
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch state');
    return data;
  }

  async recordSale(storeId, productId) {
    const res = await fetch(`/api/stores/${storeId}/sell`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ productId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Sale failed');

    // Immediate local dispatch for instant 0ms UI feedback
    this.emit('data_updated', {
      type: 'SALE',
      storeId,
      productId,
      newInventory: data.store.inventory[productId],
      newSales: data.store.sales[productId],
      transaction: data.transaction,
      stores: data.stores
    });

    return data;
  }

  async addStock(storeId, productId, quantity) {
    const res = await fetch(`/api/stores/${storeId}/stock`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ productId, quantity })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Stock addition failed');

    this.emit('data_updated', {
      type: 'STOCK_ADDED',
      storeId,
      productId,
      newInventory: data.store.inventory[productId],
      transaction: data.transaction,
      stores: data.stores
    });

    return data;
  }

  async transferStock(fromStoreId, toStoreId, productId, quantity) {
    const res = await fetch('/api/transfers', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ fromStoreId, toStoreId, productId, quantity })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Stock transfer failed');

    this.emit('transfer_created', {
      type: 'TRANSFER_CREATED',
      transfer: data.transfer,
      stores: data.stores,
      transfers: data.transfers
    });

    return data;
  }

  async acknowledgeTransfer(transferId) {
    const res = await fetch(`/api/transfers/${transferId}/acknowledge`, {
      method: 'POST',
      headers: this.getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Transfer acknowledgement failed');

    this.emit('transfer_acknowledged', {
      type: 'TRANSFER_ACKNOWLEDGED',
      transfer: data.transfer,
      transfers: data.transfers
    });

    return data;
  }

  async resetData() {
    const res = await fetch('/api/reset', {
      method: 'POST',
      headers: this.getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Reset failed');

    this.emit('data_reset', data);
    return data;
  }
}

window.api = new ApiClient();
