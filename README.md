# Great Goods — Real-Time Multi-Store Inventory & Sales Management

A real-time, responsive multi-store operations platform for a business managing **four retail stores** stocking the **same three high-demand food products**. The system empowers the business owner to monitor live sales graphs and inventory levels across all stores, redistribute stock between branches to eliminate food wastage and avoid stockouts, and enables store managers to simulate sales, adjust inventory, and acknowledge incoming product transfers with instant real-time synchronization.

---

## 🌟 Key Features

### 1. Unified Single-Screen Admin Dashboard (Business Owner)
- **Live Sales Graphs**: Dedicated Chart.js interactive sales graph for each of the 4 stores, breaking down sales for all 3 products with distinct brand color coding.
- **Real-Time Inventory Status**: Visual stock tags (`In Stock`, `Low Stock`, `Out of Stock`) and sales counts for every product at every store.
- **Inter-Store Product Transfer Control**:
  - Source store dropdown, destination store dropdown, product selector, and quantity stepper (`+` / `−` / `Max`).
  - Available stock preview at source and destination before executing.
  - Strict validation rules:
    - Source and destination stores must differ.
    - Transfer quantity must be greater than zero.
    - Source store must have sufficient available stock.
  - Immediate stock deduction at source and addition at destination upon transfer.
- **Live Activity & Transfer Status Log**:
  - Filterable by *All Transactions* or *Inter-Store Transfers*.
  - Live status tracking: `Pending Receipt` (pulsing amber) ➔ `✓ Acknowledged` (emerald pill with manager name and timestamp).

### 2. Store Manager Dashboard (Store-Isolated POS)
- **Restricted Store Scope**: Store managers can access and operate only on their assigned store. Inter-store transfer initiation and cross-store inventory modification are strictly blocked.
- **Product Showcase & Simulated Point-of-Sale**:
  - High-resolution studio product photos for all 3 food items.
  - Live inventory count and total sales revenue.
  - **Simulated "Sell (1 Unit)" Action**: Decrements inventory by 1, increments product sales, records transaction with timestamp, and broadcasts real-time update to Admin and Manager screens. Automatically disabled when inventory hits 0.
- **Inventory Stock Addition Form**:
  - Manager can add shelf stock using product selector and stepper buttons (`+`, `−`, `+5`, `+10`).
- **Product Transfer Acknowledgement Workflow**:
  - Dedicated notification card showing incoming stock transfers with source store name, product, quantity, and time.
  - **"Acknowledge Receipt" Button**: Confirms physical receipt of transferred goods and updates status to `Acknowledged` in real-time on both Manager and Admin dashboards.
- **Store Activity Feed**: Live chronological transaction feed for the assigned store.

### 3. Real-Time Synchronization & Data Persistence
- **Socket.io Real-Time Engine**: Changes made in any window or browser tab instantly update all other active dashboards without requiring manual page refresh.
- **Persistent Backend Storage**: JSON storage (`data/store_data.json`) backed by `data/seed.json` guarantees data persistence across server restarts.
- **One-Click Demo Reset**: Business owner can reset the entire system back to pristine seed data at any time.

---

## 🏪 Store & Product Setup

### Four Stores
1. **Downtown Central** (`store-1`) — 101 Market St, Financial District
2. **Westside Market** (`store-2`) — 454 West Boulevard, Arts Quarter
3. **East Bay Express** (`store-3`) — 782 Marina Way, Harborfront
4. **Northwood Hub** (`store-4`) — 320 Pine Hill Rd, Uptown Center

### Three Shared Food Products
1. **Artisan Sourdough Loaf** ($6.50) — Golden crusted, naturally fermented loaf (Amber `#F59E0B`)
2. **Organic Greek Yogurt Cup** ($4.20) — Creamy yogurt with wild honey and blueberries (Cyan `#06B6D4`)
3. **Cold-Pressed Green Juice** ($5.80) — Fresh kale, cucumber, mint, and green apple blend (Emerald `#10B981`)

---

## 🔑 Authentication & Demo Credentials

| Role | Username | Password | Assigned Scope | Name |
| :--- | :--- | :--- | :--- | :--- |
| **Business Owner (Admin)** | `admin` | `admin123` | **All 4 Stores** | Victoria Sterling |
| **Store 1 Manager** | `manager1` | `pass123` | Downtown Central | Alex Rivera |
| **Store 2 Manager** | `manager2` | `pass123` | Westside Market | Elena Vance |
| **Store 3 Manager** | `manager3` | `pass123` | East Bay Express | Marcus Chen |
| **Store 4 Manager** | `manager4` | `pass123` | Northwood Hub | Sofia Morales |

> **Note**: The login screen provides **⚡ 1-Click Demo Login** buttons for instant access to any role during demonstrations and evaluation.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation & Running Locally

1. Clone or navigate to the repository:
   ```bash
   cd great_goods
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the application:
   ```bash
   npm start
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

5. **Multi-Window Testing**:
   - Open Tab 1: Log in as **Business Owner (Admin)**.
   - Open Tab 2 (or an Incognito window): Log in as **Store 3 Manager**.
   - In Tab 2, click **Sell (1 Unit)** or **Add Stock**.
   - Observe Tab 1 immediately updating sales charts, store inventory badges, and activity logs in real-time without page refresh!

---

## 🧪 Automated Test Suite

Run the end-to-end integration test suite verifying authentication, transfer rules, sales simulation, stock additions, and role-based access control:

```bash
node test_workflow.js
```

All 12 validation and lifecycle tests should pass cleanly.
