/**
 * Great Goods — Store Manager Single-Screen Dashboard
 */

class ManagerDashboard {
  constructor() {
    this.state = null; // store, products, transfers, transactions, user
    this.stockQty = 10;
  }

  async init(state) {
    this.state = state;
    this.render();
    this.bindEvents();
  }

  render() {
    const main = document.getElementById('app-main');
    if (!main) return;

    const store = this.state.store;
    const products = this.state.products;

    let storeTotalStock = 0;
    let storeTotalSold = 0;
    let storeRevenue = 0;

    products.forEach(p => {
      const stock = store.inventory[p.id] || 0;
      const sold = store.sales[p.id] || 0;
      storeTotalStock += stock;
      storeTotalSold += sold;
      storeRevenue += sold * p.price;
    });

    const pendingIncoming = this.state.transfers.filter(
      t => t.toStoreId === store.id && t.status === 'Pending Acknowledgment'
    );

    main.innerHTML = `
      <!-- Store Manager KPI Banner -->
      <section class="kpi-strip">
        <div class="kpi-card">
          <div class="kpi-info">
            <h4>${store.name} Total Stock</h4>
            <div class="kpi-value" id="mgr-kpi-stock">${storeTotalStock} <span style="font-size:0.875rem;font-weight:500;color:var(--text-muted);">units</span></div>
          </div>
          <div class="kpi-icon-wrap kpi-icon-emerald">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-info">
            <h4>Total Items Sold</h4>
            <div class="kpi-value" id="mgr-kpi-sold">${storeTotalSold} <span style="font-size:0.875rem;font-weight:500;color:var(--text-muted);">units</span></div>
          </div>
          <div class="kpi-icon-wrap kpi-icon-amber">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-info">
            <h4>Store Gross Sales</h4>
            <div class="kpi-value" id="mgr-kpi-revenue">$${storeRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          <div class="kpi-icon-wrap kpi-icon-cyan">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V6m0 12v-2m0 0c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-info">
            <h4>Incoming Transfers</h4>
            <div class="kpi-value" id="mgr-kpi-incoming" style="color: ${pendingIncoming.length > 0 ? 'var(--amber)' : 'var(--text-main)'};">
              ${pendingIncoming.length}
            </div>
          </div>
          <div class="kpi-icon-wrap kpi-icon-purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
          </div>
        </div>
      </section>

      <!-- Main Manager Container -->
      <div class="dashboard-container">
        <!-- Store Identity Ribbon -->
        <div style="background: rgba(30, 41, 59, 0.4); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 0.75rem 1.25rem; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div style="width: 36px; height: 36px; border-radius: 8px; background: rgba(16, 185, 129, 0.15); display: flex; align-items: center; justify-content: center; color: var(--emerald);">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M3 7v1a3 3 0 006 0V7m0 1a3 3 0 006 0V7m0 1a3 3 0 006 0V7M4 21V11m16 10V11M9 21v-6a2 2 0 012-2h2a2 2 0 012 2v6"/></svg>
            </div>
            <div>
              <h3 style="font-size: 1rem; font-weight: 700; color: #fff;">${store.name}</h3>
              <p style="font-size: 0.75rem; color: var(--text-muted);">${store.location} • Assigned Manager: <strong>${this.state.user.name}</strong></p>
            </div>
          </div>
          <span class="status-pill status-acknowledged">Authorized Store Access Only</span>
        </div>

        <div class="manager-grid">
          <!-- Left Column: Products Showcase with Simulated Sell Action -->
          <div style="display: flex; flex-direction: column; gap: 1rem;">
            <div class="section-title-row">
              <div class="section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                Store Products & Point-of-Sale (Sell Button)
              </div>
              <div style="font-size: 0.75rem; color: var(--text-dim);">
                Click "Sell" to record customer purchase and sync stock immediately
              </div>
            </div>

            <div class="products-showcase-grid">
              ${this.renderProductCards()}
            </div>

            <!-- Store Activity Table -->
            <div class="activity-card" style="margin-top: 0.5rem; min-height: 240px;">
              <div class="activity-header-tabs">
                <h4 style="font-size: 0.875rem; font-weight: 700; color: #fff;">Store Activity Feed (${store.name})</h4>
                <div style="font-size: 0.75rem; color: var(--text-dim);">Real-Time Log</div>
              </div>
              <div class="table-scroll-container" id="mgr-activity-container">
                ${this.renderStoreActivityTable()}
              </div>
            </div>
          </div>

          <!-- Right Column: Stock Addition Form + Incoming Transfer Acknowledgements -->
          <div class="manager-sidebar-panels">
            <!-- Product Addition (Stock In) Form -->
            <div class="transfer-card" style="box-shadow: 0 8px 30px rgba(6, 182, 212, 0.08); border-color: rgba(6, 182, 212, 0.3);">
              <h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4v16m8-8H4"/></svg>
                Add Inventory Stock
              </h3>
              <p class="subtitle">Quickly adjust prototype shelf stock for this store.</p>

              <form id="mgr-add-stock-form">
                <div class="form-group">
                  <label class="form-label" for="mgr-stock-product">Select Product</label>
                  <select id="mgr-stock-product" class="form-select" required>
                    ${products.map(p => `
                      <option value="${p.id}">${p.name} (Current: ${store.inventory[p.id] || 0})</option>
                    `).join('')}
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Stock Quantity to Add</label>
                  <div class="qty-stepper">
                    <button type="button" class="qty-btn" id="mgr-stock-minus">−</button>
                    <input type="number" id="mgr-stock-qty" class="form-input qty-input" value="10" min="1" required>
                    <button type="button" class="qty-btn" id="mgr-stock-plus">+</button>
                    <button type="button" class="quick-max-btn" id="mgr-stock-p5">+5</button>
                    <button type="button" class="quick-max-btn" id="mgr-stock-p10">+10</button>
                  </div>
                </div>

                <button type="submit" class="btn-primary" id="btn-add-stock" style="background: linear-gradient(135deg, #06b6d4 0%, #0284c7 100%); box-shadow: 0 4px 15px var(--cyan-glow);">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4v16m8-8H4"/></svg>
                  Add Stock to Store
                </button>
              </form>
            </div>

            <!-- Product Transfer Acknowledgements Workflow -->
            <div class="incoming-transfers-card">
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <h3 style="font-size: 1rem; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 0.5rem;">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/></svg>
                  Incoming Stock Transfers
                </h3>
                <span class="status-pill status-pending" id="mgr-pending-count-badge">
                  ${pendingIncoming.length} Pending
                </span>
              </div>
              <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: -0.25rem;">
                Acknowledge incoming products sent from other stores by Admin.
              </p>

              <div id="mgr-incoming-transfers-list" style="display: flex; flex-direction: column; gap: 0.65rem; max-height: 380px; overflow-y: auto;">
                ${this.renderIncomingTransfersList()}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderProductCards() {
    const store = this.state.store;
    return this.state.products.map(product => {
      const stock = store.inventory[product.id] || 0;
      const sold = store.sales[product.id] || 0;
      const revenue = sold * product.price;
      const isOutOfStock = stock <= 0;

      let stockColor = '#34d399';
      let stockStatus = 'In Stock';
      if (isOutOfStock) {
        stockColor = '#f87171';
        stockStatus = 'Out of Stock';
      } else if (stock <= 10) {
        stockColor = '#fbbf24';
        stockStatus = 'Low Stock';
      }

      return `
        <div class="product-item-card" id="mgr-card-${product.id}">
          <div class="product-img-wrapper">
            <img src="${product.image}" alt="${product.name}" class="product-img" loading="lazy">
            <span class="product-category-tag">${product.category}</span>
            <span class="product-price-tag">$${product.price.toFixed(2)}</span>
          </div>

          <div class="product-card-body">
            <div class="product-title-row">
              <h4>${product.name}</h4>
              <span style="font-size: 0.75rem; font-weight: 700; color: ${stockColor}; display: flex; align-items: center; gap: 0.3rem;">
                <span style="width:6px; height:6px; border-radius:50%; background:${stockColor}; display:inline-block;"></span>
                ${stockStatus}
              </span>
            </div>

            <div class="inventory-stats-box">
              <div class="inv-stat-item">
                <span class="inv-stat-label">Available Stock</span>
                <span class="inv-stat-val" id="mgr-stock-val-${product.id}" style="color:${stockColor};">${stock}</span>
              </div>
              <div class="inv-stat-item" style="text-align: right;">
                <span class="inv-stat-label">Units Sold / Rev</span>
                <span class="inv-stat-val" id="mgr-sold-val-${product.id}" style="color:#fff;">${sold} <span style="font-size:0.75rem; color:var(--text-muted); font-weight:500;">($${revenue.toFixed(0)})</span></span>
              </div>
            </div>

            <!-- Sell Button -->
            <button 
              type="button" 
              class="btn-sell" 
              id="btn-sell-${product.id}" 
              data-product-id="${product.id}"
              ${isOutOfStock ? 'disabled title="Product is out of stock"' : ''}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
              ${isOutOfStock ? 'Out of Stock' : 'Sell (1 Unit)'}
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  renderIncomingTransfersList() {
    const store = this.state.store;
    const incoming = this.state.transfers.filter(t => t.toStoreId === store.id);

    if (incoming.length === 0) {
      return `
        <div style="text-align: center; padding: 2rem; color: var(--text-dim); font-size: 0.8125rem;">
          No incoming transfers for this store.
        </div>
      `;
    }

    return incoming.map(tr => {
      const isPending = tr.status === 'Pending Acknowledgment';
      const timeStr = new Date(tr.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      return `
        <div class="incoming-transfer-item ${isPending ? 'pending' : 'acknowledged'}" id="transfer-item-${tr.id}">
          <div class="transfer-item-header">
            <span style="font-weight: 700; color: #fff;">#${tr.id.slice(-4)} • ${timeStr}</span>
            ${isPending ? `
              <span class="status-pill status-pending" style="font-size:0.7rem; padding:0.15rem 0.5rem;">
                <span class="pulse-dot" style="background:#fbbf24; width:5px; height:5px;"></span> Pending
              </span>
            ` : `
              <span class="status-pill status-acknowledged" style="font-size:0.7rem; padding:0.15rem 0.5rem;">
                ✓ Acknowledged
              </span>
            `}
          </div>

          <div class="transfer-item-content">
            Transferred <strong>+${tr.quantity} units</strong> of <strong>${tr.productName || this.getProductName(tr.productId)}</strong> from <strong>${tr.fromStoreName || tr.fromStoreId}</strong>
          </div>

          ${isPending ? `
            <div class="transfer-item-actions">
              <button type="button" class="btn-ack" data-transfer-id="${tr.id}" id="btn-ack-${tr.id}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                Acknowledge Receipt
              </button>
            </div>
          ` : `
            <div style="font-size: 0.7rem; color: var(--text-dim); margin-top: 0.2rem;">
              Confirmed by ${tr.acknowledgedBy || 'Manager'} at ${new Date(tr.acknowledgedAt || tr.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          `}
        </div>
      `;
    }).join('');
  }

  renderStoreActivityTable() {
    const txs = this.state.transactions || [];
    if (txs.length === 0) {
      return `<div style="text-align: center; padding: 2rem; color: var(--text-dim);">No transactions yet for this store.</div>`;
    }

    return `
      <table class="data-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          ${txs.map(tx => {
            const timeStr = new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            let typeBadge = '<span class="status-pill status-sale">Sale</span>';
            if (tx.type === 'transfer' || tx.type === 'transfer_acknowledged') {
              typeBadge = '<span class="status-pill status-pending">Transfer</span>';
            } else if (tx.type === 'stock_addition') {
              typeBadge = '<span class="status-pill status-stock">Restock</span>';
            }

            return `
              <tr>
                <td style="color:var(--text-dim);">${timeStr}</td>
                <td>${typeBadge}</td>
                <td style="color:#e2e8f0;">${tx.description}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  }

  getProductName(id) {
    const p = this.state.products.find(x => x.id === id);
    return p ? p.name : id;
  }

  bindEvents() {
    const store = this.state.store;

    // Sell Buttons
    this.state.products.forEach(p => {
      const btn = document.getElementById(`btn-sell-${p.id}`);
      if (btn) {
        btn.addEventListener('click', async () => {
          btn.disabled = true;
          try {
            const res = await window.api.recordSale(store.id, p.id);
            window.app.playSound();
            window.app.showToast(`Sold 1x ${p.name}!`, 'success');
          } catch (err) {
            window.app.showToast(err.message, 'error');
            btn.disabled = (store.inventory[p.id] || 0) <= 0;
          }
        });
      }
    });

    // Add Stock Form
    const addStockForm = document.getElementById('mgr-add-stock-form');
    const stockProductSelect = document.getElementById('mgr-stock-product');
    const stockQtyInput = document.getElementById('mgr-stock-qty');
    const minusBtn = document.getElementById('mgr-stock-minus');
    const plusBtn = document.getElementById('mgr-stock-plus');
    const p5Btn = document.getElementById('mgr-stock-p5');
    const p10Btn = document.getElementById('mgr-stock-p10');

    if (minusBtn) {
      minusBtn.addEventListener('click', () => {
        let val = parseInt(stockQtyInput.value, 10) || 1;
        if (val > 1) stockQtyInput.value = val - 1;
      });
    }

    if (plusBtn) {
      plusBtn.addEventListener('click', () => {
        let val = parseInt(stockQtyInput.value, 10) || 0;
        stockQtyInput.value = val + 1;
      });
    }

    if (p5Btn) {
      p5Btn.addEventListener('click', () => {
        let val = parseInt(stockQtyInput.value, 10) || 0;
        stockQtyInput.value = val + 5;
      });
    }

    if (p10Btn) {
      p10Btn.addEventListener('click', () => {
        let val = parseInt(stockQtyInput.value, 10) || 0;
        stockQtyInput.value = val + 10;
      });
    }

    if (addStockForm) {
      addStockForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const prodId = stockProductSelect.value;
        const qty = parseInt(stockQtyInput.value, 10);
        if (isNaN(qty) || qty <= 0) return;

        const btn = document.getElementById('btn-add-stock');
        btn.disabled = true;

        try {
          await window.api.addStock(store.id, prodId, qty);
          window.app.showToast(`Added +${qty} units of ${this.getProductName(prodId)}`, 'success');
        } catch (err) {
          window.app.showToast(err.message, 'error');
        } finally {
          btn.disabled = false;
        }
      });
    }

    // Acknowledge Receipt Buttons
    this.bindAckButtons();
  }

  bindAckButtons() {
    const ackBtns = document.querySelectorAll('.btn-ack');
    ackBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        const trId = btn.getAttribute('data-transfer-id');
        btn.disabled = true;
        btn.textContent = 'Acknowledging...';

        try {
          await window.api.acknowledgeTransfer(trId);
          window.app.showToast(`Transfer #${trId.slice(-4)} acknowledged!`, 'success');
        } catch (err) {
          window.app.showToast(err.message, 'error');
          btn.disabled = false;
          btn.textContent = 'Acknowledge Receipt';
        }
      });
    });
  }

  // Real-time updates for manager dashboard
  onDataUpdated(payload) {
    if (payload.stores) {
      const updatedStore = payload.stores.find(s => s.id === this.state.store.id);
      if (updatedStore) this.state.store = updatedStore;
    }

    if (payload.transaction && (payload.transaction.storeId === this.state.store.id || payload.transaction.toStoreId === this.state.store.id)) {
      this.state.transactions.unshift(payload.transaction);
      if (this.state.transactions.length > 30) this.state.transactions.pop();
    }

    this.updateProductCardsDOM();
    this.updateManagerKPIs();
    this.updateActivityFeed();
  }

  onTransferCreated(payload) {
    if (payload.stores) {
      const updatedStore = payload.stores.find(s => s.id === this.state.store.id);
      if (updatedStore) this.state.store = updatedStore;
    }

    if (payload.transfer && payload.transfer.toStoreId === this.state.store.id) {
      this.state.transfers.unshift(payload.transfer);
      window.app.showToast(`📦 Incoming Transfer: ${payload.transfer.quantity}x ${payload.transfer.productName} from ${payload.transfer.fromStoreName}`, 'warning');
    }

    if (payload.transaction && (payload.transaction.storeId === this.state.store.id || payload.transaction.toStoreId === this.state.store.id)) {
      this.state.transactions.unshift(payload.transaction);
    }

    this.updateProductCardsDOM();
    this.updateIncomingTransfersDOM();
    this.updateManagerKPIs();
    this.updateActivityFeed();
  }

  onTransferAcknowledged(payload) {
    if (payload.transfer && payload.transfer.toStoreId === this.state.store.id) {
      const idx = this.state.transfers.findIndex(t => t.id === payload.transfer.id);
      if (idx !== -1) {
        this.state.transfers[idx] = payload.transfer;
      }
    }
    if (payload.transaction && (payload.transaction.storeId === this.state.store.id || payload.transaction.toStoreId === this.state.store.id)) {
      this.state.transactions.unshift(payload.transaction);
    }

    this.updateIncomingTransfersDOM();
    this.updateManagerKPIs();
    this.updateActivityFeed();
  }

  updateProductCardsDOM() {
    const store = this.state.store;
    this.state.products.forEach(p => {
      const stock = store.inventory[p.id] || 0;
      const sold = store.sales[p.id] || 0;
      const revenue = sold * p.price;
      const isOutOfStock = stock <= 0;

      let stockColor = '#34d399';
      let stockStatus = 'In Stock';
      if (isOutOfStock) {
        stockColor = '#f87171';
        stockStatus = 'Out of Stock';
      } else if (stock <= 10) {
        stockColor = '#fbbf24';
        stockStatus = 'Low Stock';
      }

      const stockEl = document.getElementById(`mgr-stock-val-${p.id}`);
      if (stockEl) {
        stockEl.textContent = stock;
        stockEl.style.color = stockColor;
      }

      const soldEl = document.getElementById(`mgr-sold-val-${p.id}`);
      if (soldEl) {
        soldEl.innerHTML = `${sold} <span style="font-size:0.75rem; color:var(--text-muted); font-weight:500;">($${revenue.toFixed(0)})</span>`;
      }

      const sellBtn = document.getElementById(`btn-sell-${p.id}`);
      if (sellBtn) {
        sellBtn.disabled = isOutOfStock;
        sellBtn.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
          ${isOutOfStock ? 'Out of Stock' : 'Sell (1 Unit)'}
        `;
      }
    });

    // Also update Add Stock dropdown current stock hint
    const stockSelect = document.getElementById('mgr-stock-product');
    if (stockSelect) {
      Array.from(stockSelect.options).forEach(opt => {
        const prod = this.state.products.find(p => p.id === opt.value);
        if (prod) {
          opt.textContent = `${prod.name} (Current: ${store.inventory[prod.id] || 0})`;
        }
      });
    }
  }

  updateIncomingTransfersDOM() {
    const listEl = document.getElementById('mgr-incoming-transfers-list');
    if (listEl) {
      listEl.innerHTML = this.renderIncomingTransfersList();
      this.bindAckButtons();
    }
    const pendingIncoming = this.state.transfers.filter(
      t => t.toStoreId === this.state.store.id && t.status === 'Pending Acknowledgment'
    );
    const badge = document.getElementById('mgr-pending-count-badge');
    if (badge) {
      badge.textContent = `${pendingIncoming.length} Pending`;
    }
  }

  updateActivityFeed() {
    const container = document.getElementById('mgr-activity-container');
    if (container) {
      container.innerHTML = this.renderStoreActivityTable();
    }
  }

  updateManagerKPIs() {
    const store = this.state.store;
    let storeTotalStock = 0;
    let storeTotalSold = 0;
    let storeRevenue = 0;

    this.state.products.forEach(p => {
      const stock = store.inventory[p.id] || 0;
      const sold = store.sales[p.id] || 0;
      storeTotalStock += stock;
      storeTotalSold += sold;
      storeRevenue += sold * p.price;
    });

    const pendingIncoming = this.state.transfers.filter(
      t => t.toStoreId === store.id && t.status === 'Pending Acknowledgment'
    );

    const stockEl = document.getElementById('mgr-kpi-stock');
    const soldEl = document.getElementById('mgr-kpi-sold');
    const revEl = document.getElementById('mgr-kpi-revenue');
    const incomingEl = document.getElementById('mgr-kpi-incoming');

    if (stockEl) stockEl.innerHTML = `${storeTotalStock} <span style="font-size:0.875rem;font-weight:500;color:var(--text-muted);">units</span>`;
    if (soldEl) soldEl.innerHTML = `${storeTotalSold} <span style="font-size:0.875rem;font-weight:500;color:var(--text-muted);">units</span>`;
    if (revEl) revEl.textContent = `$${storeRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (incomingEl) {
      incomingEl.textContent = pendingIncoming.length;
      incomingEl.style.color = pendingIncoming.length > 0 ? 'var(--amber)' : 'var(--text-main)';
    }
  }
}

window.managerDashboard = new ManagerDashboard();
