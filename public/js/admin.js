/**
 * Great Goods — Admin Single-Screen Dashboard
 */

class AdminDashboard {
  constructor() {
    this.state = null;
    this.selectedTab = 'transfers'; // 'transfers' or 'all'
    this.transferQty = 5;
  }

  async init(state) {
    this.state = state;
    this.render();
    this.bindEvents();
    this.initCharts();
  }

  render() {
    const main = document.getElementById('app-main');
    if (!main) return;

    // Calculate aggregated metrics
    let totalStock = 0;
    let totalSold = 0;
    let totalRevenue = 0;

    this.state.stores.forEach(store => {
      this.state.products.forEach(p => {
        const stock = store.inventory[p.id] || 0;
        const sold = store.sales[p.id] || 0;
        totalStock += stock;
        totalSold += sold;
        totalRevenue += sold * p.price;
      });
    });

    const pendingTransfersCount = this.state.transfers.filter(t => t.status === 'Pending Acknowledgment').length;

    main.innerHTML = `
      <!-- Top KPI Row -->
      <section class="kpi-strip">
        <div class="kpi-card">
          <div class="kpi-info">
            <h4>Total Stock (4 Stores)</h4>
            <div class="kpi-value" id="kpi-total-stock">${totalStock} <span style="font-size:0.875rem;font-weight:500;color:var(--text-muted);">units</span></div>
          </div>
          <div class="kpi-icon-wrap kpi-icon-emerald">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-info">
            <h4>Total Units Sold</h4>
            <div class="kpi-value" id="kpi-total-sold">${totalSold} <span style="font-size:0.875rem;font-weight:500;color:var(--text-muted);">items</span></div>
          </div>
          <div class="kpi-icon-wrap kpi-icon-amber">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-info">
            <h4>Cumulative Revenue</h4>
            <div class="kpi-value" id="kpi-total-revenue">$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          <div class="kpi-icon-wrap kpi-icon-cyan">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V6m0 12v-2m0 0c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-info">
            <h4>Pending Transfers</h4>
            <div class="kpi-value" id="kpi-pending-transfers" style="color: ${pendingTransfersCount > 0 ? 'var(--amber)' : 'var(--text-main)'};">${pendingTransfersCount}</div>
          </div>
          <div class="kpi-icon-wrap kpi-icon-purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
          </div>
        </div>
      </section>

      <!-- Main Admin Dashboard Content Container -->
      <div class="dashboard-container">
        <!-- 4 Stores Sales & Inventory Overview -->
        <section>
          <div class="section-title-row">
            <div class="section-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M3 7v1a3 3 0 006 0V7m0 1a3 3 0 006 0V7m0 1a3 3 0 006 0V7M4 21V11m16 10V11M9 21v-6a2 2 0 012-2h2a2 2 0 012 2v6"/></svg>
              Real-Time Store Performance & Product Inventory (All 4 Stores)
            </div>
            <div style="font-size: 0.75rem; color: var(--text-dim);">
              Hover or click graphs for breakdown • Real-time live updating
            </div>
          </div>

          <div class="stores-grid-4" id="stores-grid-container">
            ${this.renderStoreCards()}
          </div>
        </section>

        <!-- Bottom Row: Inter-Store Product Transfer + Activity / Transfer Log -->
        <section class="admin-bottom-grid">
          <!-- Product Transfer Section -->
          <div class="transfer-card">
            <h3>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
              Inter-Store Product Transfer
            </h3>
            <p class="subtitle">Reallocate food stock between stores based on demand to prevent expiry.</p>

            <form id="transfer-form">
              <div class="form-group">
                <label class="form-label" for="from-store-select">From Store (Source)</label>
                <select id="from-store-select" class="form-select" required>
                  ${this.state.stores.map((s, idx) => `
                    <option value="${s.id}" ${idx === 3 ? 'selected' : ''}>${s.name} (${s.location})</option>
                  `).join('')}
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" for="to-store-select">To Store (Destination)</label>
                <select id="to-store-select" class="form-select" required>
                  ${this.state.stores.map((s, idx) => `
                    <option value="${s.id}" ${idx === 2 ? 'selected' : ''}>${s.name} (${s.location})</option>
                  `).join('')}
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" for="product-select">Product to Transfer</label>
                <select id="product-select" class="form-select" required>
                  ${this.state.products.map(p => `
                    <option value="${p.id}">${p.name} ($${p.price.toFixed(2)})</option>
                  `).join('')}
                </select>
              </div>

              <!-- Available Stock Preview Box -->
              <div class="transfer-preview-box" id="transfer-preview-box">
                <div class="preview-row">
                  <span>Available at Source:</span>
                  <span class="preview-val" id="source-avail-stock">--</span>
                </div>
                <div class="preview-row">
                  <span>Current at Destination:</span>
                  <span class="preview-val" id="dest-current-stock">--</span>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Transfer Quantity</label>
                <div class="qty-stepper">
                  <button type="button" class="qty-btn" id="qty-minus">−</button>
                  <input type="number" id="transfer-quantity-input" class="form-input qty-input" value="5" min="1" required>
                  <button type="button" class="qty-btn" id="qty-plus">+</button>
                  <button type="button" class="quick-max-btn" id="qty-max">Max</button>
                </div>
              </div>

              <div id="transfer-error" style="color: var(--rose); font-size: 0.8125rem; margin-bottom: 0.75rem; display: none;"></div>

              <button type="submit" class="btn-primary" id="btn-execute-transfer">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 13l4 4L19 7"/></svg>
                Execute Stock Transfer
              </button>
            </form>
          </div>

          <!-- Activity & Transfer Status Section -->
          <div class="activity-card">
            <div class="activity-header-tabs">
              <div class="tab-btn-group">
                <button class="tab-btn ${this.selectedTab === 'transfers' ? 'active' : ''}" id="tab-transfers">
                  Inter-Store Transfers (${this.state.transfers.length})
                </button>
                <button class="tab-btn ${this.selectedTab === 'all' ? 'active' : ''}" id="tab-all">
                  All Transactions (${this.state.transactions.length})
                </button>
              </div>
              <div style="font-size: 0.75rem; color: var(--text-dim); display:flex; align-items:center; gap:0.5rem;">
                <span class="pulse-dot"></span> Live Log
              </div>
            </div>

            <div class="table-scroll-container" id="activity-table-container">
              ${this.renderActivityTable()}
            </div>
          </div>
        </section>
      </div>
    `;
  }

  renderStoreCards() {
    return this.state.stores.map(store => {
      return `
        <div class="store-card" id="store-card-${store.id}">
          <div class="store-card-header">
            <div>
              <div class="store-name">${store.name}</div>
              <div class="store-location">${store.location}</div>
            </div>
            <span class="store-badge">Store #${store.id.replace('store-', '')}</span>
          </div>

          <!-- Graph Area -->
          <div class="store-chart-wrapper">
            <canvas id="chart-${store.id}"></canvas>
          </div>

          <!-- Product Stock and Sales List -->
          <div class="store-products-list">
            ${this.state.products.map(product => {
              const stock = store.inventory[product.id] || 0;
              const sold = store.sales[product.id] || 0;
              let stockClass = 'stock-high';
              if (stock <= 10) stockClass = 'stock-low';
              else if (stock <= 25) stockClass = 'stock-mid';

              const dotClass = product.id === 'prod-1' ? 'dot-sourdough' : (product.id === 'prod-2' ? 'dot-yogurt' : 'dot-juice');

              return `
                <div class="product-row-compact" id="inv-row-${store.id}-${product.id}">
                  <div class="product-label-wrap">
                    <span class="product-dot ${dotClass}"></span>
                    <span class="product-name-txt">${product.shortName}</span>
                  </div>
                  <div class="product-metrics-wrap">
                    <span class="stock-tag ${stockClass}" title="Available Stock in Store">
                      ${stock} in stock
                    </span>
                    <span class="sales-tag" title="Total Units Sold">
                      ${sold} sold
                    </span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }).join('');
  }

  renderActivityTable() {
    if (this.selectedTab === 'transfers') {
      if (!this.state.transfers || this.state.transfers.length === 0) {
        return `<div style="text-align:center; padding: 2rem; color: var(--text-dim);">No transfers recorded yet.</div>`;
      }
      return `
        <table class="data-table">
          <thead>
            <tr>
              <th>ID & Time</th>
              <th>Route (Source ➔ Dest)</th>
              <th>Product & Quantity</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${this.state.transfers.map(tr => {
              const dateStr = new Date(tr.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const isAck = tr.status === 'Acknowledged';
              return `
                <tr>
                  <td>
                    <div style="font-weight:700; color:#fff;">#${tr.id.slice(-4)}</div>
                    <div style="font-size:0.7rem; color:var(--text-dim);">${dateStr}</div>
                  </td>
                  <td>
                    <div style="font-weight:600;">${tr.fromStoreName || this.getStoreName(tr.fromStoreId)}</div>
                    <div style="font-size:0.75rem; color:var(--text-muted);">➔ ${tr.toStoreName || this.getStoreName(tr.toStoreId)}</div>
                  </td>
                  <td>
                    <div style="font-weight:600; color:#fff;">+${tr.quantity} units</div>
                    <div style="font-size:0.75rem; color:var(--text-muted);">${tr.productName || this.getProductName(tr.productId)}</div>
                  </td>
                  <td>
                    ${isAck ? `
                      <span class="status-pill status-acknowledged">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg>
                        Acknowledged
                      </span>
                      ${tr.acknowledgedBy ? `<div style="font-size:0.6875rem; color:var(--text-dim); margin-top:2px;">by ${tr.acknowledgedBy}</div>` : ''}
                    ` : `
                      <span class="status-pill status-pending">
                        <span class="pulse-dot" style="background:#fbbf24; width:6px; height:6px;"></span>
                        Pending Receipt
                      </span>
                    `}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    } else {
      if (!this.state.transactions || this.state.transactions.length === 0) {
        return `<div style="text-align:center; padding: 2rem; color: var(--text-dim);">No transactions recorded yet.</div>`;
      }
      return `
        <table class="data-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Type</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            ${this.state.transactions.map(tx => {
              const timeStr = new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
              let typeBadge = '<span class="status-pill status-sale">Sale</span>';
              if (tx.type === 'transfer' || tx.type === 'transfer_acknowledged') {
                typeBadge = '<span class="status-pill status-pending">Transfer</span>';
              } else if (tx.type === 'stock_addition') {
                typeBadge = '<span class="status-pill status-stock">Restock</span>';
              }

              return `
                <tr>
                  <td style="color:var(--text-dim); white-space:nowrap;">${timeStr}</td>
                  <td>${typeBadge}</td>
                  <td>
                    <div style="font-size:0.8125rem; color:#e2e8f0;">${tx.description || tx.productName}</div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    }
  }

  getStoreName(id) {
    const s = this.state.stores.find(x => x.id === id);
    return s ? s.name : id;
  }

  getProductName(id) {
    const p = this.state.products.find(x => x.id === id);
    return p ? p.name : id;
  }

  initCharts() {
    this.state.stores.forEach(store => {
      window.chartManager.initStoreChart(`chart-${store.id}`, store, this.state.products);
    });
  }

  bindEvents() {
    // Stepper buttons
    const qtyInput = document.getElementById('transfer-quantity-input');
    const minusBtn = document.getElementById('qty-minus');
    const plusBtn = document.getElementById('qty-plus');
    const maxBtn = document.getElementById('qty-max');
    const fromSelect = document.getElementById('from-store-select');
    const toSelect = document.getElementById('to-store-select');
    const prodSelect = document.getElementById('product-select');
    const form = document.getElementById('transfer-form');
    const errorEl = document.getElementById('transfer-error');

    const updatePreview = () => {
      const fromId = fromSelect.value;
      const toId = toSelect.value;
      const prodId = prodSelect.value;

      const fromStore = this.state.stores.find(s => s.id === fromId);
      const toStore = this.state.stores.find(s => s.id === toId);

      const fromStock = fromStore ? (fromStore.inventory[prodId] || 0) : 0;
      const toStock = toStore ? (toStore.inventory[prodId] || 0) : 0;

      const srcAvailEl = document.getElementById('source-avail-stock');
      const destCurrEl = document.getElementById('dest-current-stock');

      if (srcAvailEl) srcAvailEl.textContent = `${fromStock} units`;
      if (destCurrEl) destCurrEl.textContent = `${toStock} units`;

      // Check if from == to
      if (fromId === toId) {
        errorEl.textContent = 'Transfer rule violation: Source and Destination stores must be different.';
        errorEl.style.display = 'block';
      } else {
        errorEl.style.display = 'none';
      }
    };

    if (fromSelect) fromSelect.addEventListener('change', updatePreview);
    if (toSelect) toSelect.addEventListener('change', updatePreview);
    if (prodSelect) prodSelect.addEventListener('change', updatePreview);

    updatePreview();

    if (minusBtn) {
      minusBtn.addEventListener('click', () => {
        let val = parseInt(qtyInput.value, 10) || 1;
        if (val > 1) {
          qtyInput.value = val - 1;
        }
      });
    }

    if (plusBtn) {
      plusBtn.addEventListener('click', () => {
        let val = parseInt(qtyInput.value, 10) || 0;
        const fromId = fromSelect.value;
        const prodId = prodSelect.value;
        const fromStore = this.state.stores.find(s => s.id === fromId);
        const maxStock = fromStore ? (fromStore.inventory[prodId] || 0) : 999;
        if (val < maxStock) {
          qtyInput.value = val + 1;
        }
      });
    }

    if (maxBtn) {
      maxBtn.addEventListener('click', () => {
        const fromId = fromSelect.value;
        const prodId = prodSelect.value;
        const fromStore = this.state.stores.find(s => s.id === fromId);
        const maxStock = fromStore ? (fromStore.inventory[prodId] || 0) : 1;
        qtyInput.value = Math.max(1, maxStock);
      });
    }

    // Form submit
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorEl.style.display = 'none';

        const fromStoreId = fromSelect.value;
        const toStoreId = toSelect.value;
        const productId = prodSelect.value;
        const quantity = parseInt(qtyInput.value, 10);

        if (fromStoreId === toStoreId) {
          errorEl.textContent = 'Rule violation: Source and Destination stores must be different.';
          errorEl.style.display = 'block';
          return;
        }

        if (isNaN(quantity) || quantity <= 0) {
          errorEl.textContent = 'Rule violation: Quantity must be greater than zero.';
          errorEl.style.display = 'block';
          return;
        }

        const fromStore = this.state.stores.find(s => s.id === fromStoreId);
        const availableStock = fromStore ? (fromStore.inventory[productId] || 0) : 0;
        if (quantity > availableStock) {
          errorEl.textContent = `Insufficient stock: ${fromStore.name} only has ${availableStock} units available.`;
          errorEl.style.display = 'block';
          return;
        }

        const btn = document.getElementById('btn-execute-transfer');
        btn.disabled = true;
        btn.innerHTML = `<span class="pulse-dot"></span> Processing Transfer...`;

        try {
          const res = await window.api.transferStock(fromStoreId, toStoreId, productId, quantity);
          window.app.showToast(`Transferred ${quantity}x ${this.getProductName(productId)} successfully!`, 'success');
          qtyInput.value = Math.min(5, Math.max(1, availableStock - quantity));
          updatePreview();
        } catch (err) {
          errorEl.textContent = err.message;
          errorEl.style.display = 'block';
          window.app.showToast(err.message, 'error');
        } finally {
          btn.disabled = false;
          btn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 13l4 4L19 7"/></svg>
            Execute Stock Transfer
          `;
        }
      });
    }

    // Tab switching
    const tabTransfers = document.getElementById('tab-transfers');
    const tabAll = document.getElementById('tab-all');
    if (tabTransfers) {
      tabTransfers.addEventListener('click', () => {
        this.selectedTab = 'transfers';
        tabTransfers.classList.add('active');
        if (tabAll) tabAll.classList.remove('active');
        this.updateActivityTable();
      });
    }
    if (tabAll) {
      tabAll.addEventListener('click', () => {
        this.selectedTab = 'all';
        tabAll.classList.add('active');
        if (tabTransfers) tabTransfers.classList.remove('active');
        this.updateActivityTable();
      });
    }
  }

  updateActivityTable() {
    const container = document.getElementById('activity-table-container');
    if (container) {
      container.innerHTML = this.renderActivityTable();
    }
  }

  // Real-time event handler called when server emits data_updated
  onDataUpdated(payload) {
    if (payload.stores) {
      this.state.stores = payload.stores;
    }
    if (payload.transaction) {
      this.state.transactions.unshift(payload.transaction);
      if (this.state.transactions.length > 50) this.state.transactions.pop();
    }

    // Update specific store card inventory & sales values in DOM
    if (payload.storeId && payload.productId) {
      const store = this.state.stores.find(s => s.id === payload.storeId);
      if (store) {
        const stock = store.inventory[payload.productId];
        const sold = store.sales[payload.productId];
        const row = document.getElementById(`inv-row-${store.id}-${payload.productId}`);
        if (row) {
          let stockClass = 'stock-high';
          if (stock <= 10) stockClass = 'stock-low';
          else if (stock <= 25) stockClass = 'stock-mid';

          const stockTag = row.querySelector('.stock-tag');
          if (stockTag) {
            stockTag.className = `stock-tag ${stockClass}`;
            stockTag.textContent = `${stock} in stock`;
          }
          const salesTag = row.querySelector('.sales-tag');
          if (salesTag) {
            salesTag.textContent = `${sold} sold`;
          }
        }
      }

      // Update Chart in real-time
      if (payload.salesHistory) {
        window.chartManager.updateStoreChart(payload.storeId, payload.salesHistory);
      } else {
        window.chartManager.incrementSale(payload.storeId, payload.productId);
      }
    }

    this.updateKPIs();
    this.updateActivityTable();
    this.refreshTransferPreview();
  }

  onTransferCreated(payload) {
    if (payload.stores) this.state.stores = payload.stores;
    if (payload.transfers) this.state.transfers = payload.transfers;
    if (payload.transaction) {
      this.state.transactions.unshift(payload.transaction);
    }

    // Update all 4 store cards' stock numbers in DOM
    this.refreshAllStoreStockRows();
    this.updateKPIs();
    this.updateActivityTable();
    this.refreshTransferPreview();
  }

  onTransferAcknowledged(payload) {
    if (payload.transfers) this.state.transfers = payload.transfers;
    if (payload.transaction) {
      this.state.transactions.unshift(payload.transaction);
    }
    this.updateKPIs();
    this.updateActivityTable();
  }

  refreshAllStoreStockRows() {
    this.state.stores.forEach(store => {
      this.state.products.forEach(p => {
        const row = document.getElementById(`inv-row-${store.id}-${p.id}`);
        if (row) {
          const stock = store.inventory[p.id] || 0;
          const sold = store.sales[p.id] || 0;
          let stockClass = 'stock-high';
          if (stock <= 10) stockClass = 'stock-low';
          else if (stock <= 25) stockClass = 'stock-mid';

          const stockTag = row.querySelector('.stock-tag');
          if (stockTag) {
            stockTag.className = `stock-tag ${stockClass}`;
            stockTag.textContent = `${stock} in stock`;
          }
        }
      });
    });
  }

  refreshTransferPreview() {
    const fromSelect = document.getElementById('from-store-select');
    const toSelect = document.getElementById('to-store-select');
    const prodSelect = document.getElementById('product-select');
    if (!fromSelect || !toSelect || !prodSelect) return;

    const fromStore = this.state.stores.find(s => s.id === fromSelect.value);
    const toStore = this.state.stores.find(s => s.id === toSelect.value);
    const prodId = prodSelect.value;

    const fromStock = fromStore ? (fromStore.inventory[prodId] || 0) : 0;
    const toStock = toStore ? (toStore.inventory[prodId] || 0) : 0;

    const srcAvailEl = document.getElementById('source-avail-stock');
    const destCurrEl = document.getElementById('dest-current-stock');

    if (srcAvailEl) srcAvailEl.textContent = `${fromStock} units`;
    if (destCurrEl) destCurrEl.textContent = `${toStock} units`;
  }

  updateKPIs() {
    let totalStock = 0;
    let totalSold = 0;
    let totalRevenue = 0;

    this.state.stores.forEach(store => {
      this.state.products.forEach(p => {
        const stock = store.inventory[p.id] || 0;
        const sold = store.sales[p.id] || 0;
        totalStock += stock;
        totalSold += sold;
        totalRevenue += sold * p.price;
      });
    });

    const pendingCount = this.state.transfers.filter(t => t.status === 'Pending Acknowledgment').length;

    const stockEl = document.getElementById('kpi-total-stock');
    const soldEl = document.getElementById('kpi-total-sold');
    const revEl = document.getElementById('kpi-total-revenue');
    const pendingEl = document.getElementById('kpi-pending-transfers');

    if (stockEl) stockEl.innerHTML = `${totalStock} <span style="font-size:0.875rem;font-weight:500;color:var(--text-muted);">units</span>`;
    if (soldEl) soldEl.innerHTML = `${totalSold} <span style="font-size:0.875rem;font-weight:500;color:var(--text-muted);">items</span>`;
    if (revEl) revEl.textContent = `$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (pendingEl) {
      pendingEl.textContent = pendingCount;
      pendingEl.style.color = pendingCount > 0 ? 'var(--amber)' : 'var(--text-main)';
    }
  }
}

window.adminDashboard = new AdminDashboard();
