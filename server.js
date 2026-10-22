const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'store_data.json');
const SEED_FILE = path.join(__dirname, 'data', 'seed.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
// Serve Chart.js locally
app.use('/vendor/chart.js', express.static(path.join(__dirname, 'node_modules', 'chart.js', 'dist')));

// Ensure data persistence file exists
function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    const seed = fs.readFileSync(SEED_FILE, 'utf8');
    fs.writeFileSync(DATA_FILE, seed, 'utf8');
    return JSON.parse(seed);
  }
  try {
    const content = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error reading data file, falling back to seed:', err);
    const seed = fs.readFileSync(SEED_FILE, 'utf8');
    fs.writeFileSync(DATA_FILE, seed, 'utf8');
    return JSON.parse(seed);
  }
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save data:', err);
  }
}

// In-memory working copy backed by file
let appData = loadData();

// Simple token authentication simulation
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization token provided' });
  }

  const token = authHeader.replace(/^Bearer\s+/, '');
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const [username, role, storeId] = decoded.split(':');
    const user = appData.users.find(u => u.username === username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid user session' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Malformed authorization token' });
  }
}

// ---------------- REST API ROUTES ----------------

// Auth: Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const user = appData.users.find(
    u => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password
  );

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials. Please verify username and password.' });
  }

  // Token format: base64(username:role:storeId)
  const token = Buffer.from(`${user.username}:${user.role}:${user.storeId || 'all'}`).toString('base64');

  res.json({
    token,
    user: {
      username: user.username,
      name: user.name,
      role: user.role,
      title: user.title,
      storeId: user.storeId || null
    }
  });
});

// Get all stores, products, transfers, transactions (admin or general load)
app.get('/api/state', authenticate, (req, res) => {
  // Return complete state for admin, or store-scoped state for manager
  if (req.user.role === 'admin') {
    return res.json({
      stores: appData.stores,
      products: appData.products,
      transfers: appData.transfers,
      transactions: appData.transactions.slice(0, 30),
      user: req.user
    });
  }

  // Store Manager scoped view
  const store = appData.stores.find(s => s.id === req.user.storeId);
  if (!store) {
    return res.status(404).json({ error: 'Assigned store not found' });
  }

  // Manager sees their store, products, incoming transfers for their store, and their store's transactions
  const incomingTransfers = appData.transfers.filter(t => t.toStoreId === req.user.storeId);
  const storeTransactions = appData.transactions.filter(
    tx => tx.storeId === req.user.storeId || tx.toStoreId === req.user.storeId || tx.fromStoreId === req.user.storeId
  );

  res.json({
    store,
    products: appData.products,
    transfers: incomingTransfers,
    transactions: storeTransactions.slice(0, 20),
    user: req.user
  });
});

// Public demo helper: quick account list for login UI
app.get('/api/auth/demo-users', (req, res) => {
  res.json(appData.users.map(u => ({
    username: u.username,
    role: u.role,
    name: u.name,
    title: u.title,
    storeId: u.storeId || null
  })));
});

// Store Action: Simulate Product Sale (Manager or Admin)
app.post('/api/stores/:storeId/sell', authenticate, (req, res) => {
  const { storeId } = req.params;
  const { productId } = req.body;

  // Authorization check
  if (req.user.role !== 'admin' && req.user.storeId !== storeId) {
    return res.status(403).json({ error: 'Access denied: You can only record sales for your assigned store.' });
  }

  const store = appData.stores.find(s => s.id === storeId);
  if (!store) return res.status(404).json({ error: 'Store not found' });

  const product = appData.products.find(p => p.id === productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  // Inventory validation: prevent sales when available inventory is zero
  const currentStock = store.inventory[productId] || 0;
  if (currentStock <= 0) {
    return res.status(400).json({ error: `Cannot complete sale: ${product.name} is currently out of stock at ${store.name}.` });
  }

  // Deduct inventory by 1, increase sales count by 1
  store.inventory[productId] = currentStock - 1;
  store.sales[productId] = (store.sales[productId] || 0) + 1;

  // Update sales history graph data point (latest bucket)
  if (store.salesHistory && store.salesHistory[productId]) {
    const lastIdx = store.salesHistory[productId].length - 1;
    store.salesHistory[productId][lastIdx] += 1;
  }

  const tx = {
    id: `tx-${Date.now()}`,
    type: 'sale',
    storeId,
    storeName: store.name,
    productId,
    productName: product.name,
    quantity: 1,
    unitPrice: product.price,
    timestamp: new Date().toISOString(),
    description: `Sale: 1x ${product.name} ($${product.price.toFixed(2)}) at ${store.name}`
  };

  appData.transactions.unshift(tx);
  if (appData.transactions.length > 100) appData.transactions.pop();
  saveData(appData);

  // Broadcast real-time update
  const payload = {
    type: 'SALE',
    storeId,
    productId,
    newInventory: store.inventory[productId],
    newSales: store.sales[productId],
    salesHistory: store.salesHistory,
    transaction: tx,
    stores: appData.stores
  };

  io.emit('data_updated', payload);

  res.json({
    success: true,
    message: `Sold 1 unit of ${product.name} at ${store.name}`,
    store,
    transaction: tx
  });
});

// Store Action: Product Addition (Manager or Admin)
app.post('/api/stores/:storeId/stock', authenticate, (req, res) => {
  const { storeId } = req.params;
  const { productId, quantity } = req.body;
  const qty = parseInt(quantity, 10);

  // Authorization check
  if (req.user.role !== 'admin' && req.user.storeId !== storeId) {
    return res.status(403).json({ error: 'Access denied: You can only adjust inventory for your assigned store.' });
  }

  if (isNaN(qty) || qty <= 0) {
    return res.status(400).json({ error: 'Stock quantity must be a positive integer.' });
  }

  const store = appData.stores.find(s => s.id === storeId);
  if (!store) return res.status(404).json({ error: 'Store not found' });

  const product = appData.products.find(p => p.id === productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  store.inventory[productId] = (store.inventory[productId] || 0) + qty;

  const tx = {
    id: `tx-${Date.now()}`,
    type: 'stock_addition',
    storeId,
    storeName: store.name,
    productId,
    productName: product.name,
    quantity: qty,
    timestamp: new Date().toISOString(),
    description: `Stock Added: +${qty} ${product.name} at ${store.name}`
  };

  appData.transactions.unshift(tx);
  if (appData.transactions.length > 100) appData.transactions.pop();
  saveData(appData);

  // Broadcast real-time update
  io.emit('data_updated', {
    type: 'STOCK_ADDED',
    storeId,
    productId,
    newInventory: store.inventory[productId],
    transaction: tx,
    stores: appData.stores
  });

  res.json({
    success: true,
    message: `Added ${qty} units of ${product.name} to ${store.name}`,
    store,
    transaction: tx
  });
});

// Admin Action: Inter-Store Product Transfer
app.post('/api/transfers', authenticate, (req, res) => {
  // Strictly Admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized: Only the Business Owner (Admin) can initiate inter-store transfers.' });
  }

  const { fromStoreId, toStoreId, productId, quantity } = req.body;
  const qty = parseInt(quantity, 10);

  // Rule 1: The source and destination stores must be different
  if (!fromStoreId || !toStoreId || fromStoreId === toStoreId) {
    return res.status(400).json({ error: 'Source and destination stores must be different.' });
  }

  // Rule 2: The selected quantity must be greater than zero
  if (isNaN(qty) || qty <= 0) {
    return res.status(400).json({ error: 'Transfer quantity must be greater than zero.' });
  }

  const fromStore = appData.stores.find(s => s.id === fromStoreId);
  const toStore = appData.stores.find(s => s.id === toStoreId);
  if (!fromStore || !toStore) {
    return res.status(404).json({ error: 'Selected source or destination store could not be found.' });
  }

  const product = appData.products.find(p => p.id === productId);
  if (!product) {
    return res.status(404).json({ error: 'Selected product not found.' });
  }

  // Rule 3: The source store must have sufficient available inventory
  const availableStock = fromStore.inventory[productId] || 0;
  if (availableStock < qty) {
    return res.status(400).json({
      error: `Insufficient inventory at ${fromStore.name}. Available: ${availableStock}, Requested: ${qty}`
    });
  }

  // Execute transfer: deduct from source, add to destination
  fromStore.inventory[productId] -= qty;
  toStore.inventory[productId] = (toStore.inventory[productId] || 0) + qty;

  const transfer = {
    id: `tr-${Date.now()}`,
    fromStoreId,
    fromStoreName: fromStore.name,
    toStoreId,
    toStoreName: toStore.name,
    productId,
    productName: product.name,
    quantity: qty,
    status: 'Pending Acknowledgment',
    createdAt: new Date().toISOString(),
    acknowledgedAt: null,
    acknowledgedBy: null
  };

  const tx = {
    id: `tx-${Date.now()}`,
    type: 'transfer',
    fromStoreId,
    toStoreId,
    productId,
    productName: product.name,
    quantity: qty,
    transferId: transfer.id,
    timestamp: new Date().toISOString(),
    description: `Inter-Store Transfer: ${qty}x ${product.name} from ${fromStore.name} to ${toStore.name} (Pending Acknowledgment)`
  };

  appData.transfers.unshift(transfer);
  appData.transactions.unshift(tx);
  if (appData.transactions.length > 100) appData.transactions.pop();
  saveData(appData);

  // Broadcast real-time update to all clients (Admin and Managers)
  io.emit('transfer_created', {
    type: 'TRANSFER_CREATED',
    transfer,
    transaction: tx,
    stores: appData.stores,
    transfers: appData.transfers
  });

  res.json({
    success: true,
    message: `Successfully transferred ${qty} ${product.name} from ${fromStore.name} to ${toStore.name}.`,
    transfer,
    stores: appData.stores
  });
});

// Store Manager Action: Acknowledge Incoming Product Transfer
app.post('/api/transfers/:transferId/acknowledge', authenticate, (req, res) => {
  const { transferId } = req.params;
  const transfer = appData.transfers.find(t => t.id === transferId);

  if (!transfer) {
    return res.status(404).json({ error: 'Transfer record not found.' });
  }

  // Manager can only acknowledge transfers intended for their store, admin can acknowledge any
  if (req.user.role !== 'admin' && req.user.storeId !== transfer.toStoreId) {
    return res.status(403).json({ error: 'Access denied: You can only acknowledge transfers for your assigned store.' });
  }

  if (transfer.status === 'Acknowledged') {
    return res.status(400).json({ error: 'This transfer has already been acknowledged.' });
  }

  transfer.status = 'Acknowledged';
  transfer.acknowledgedAt = new Date().toISOString();
  transfer.acknowledgedBy = req.user.name;

  const toStore = appData.stores.find(s => s.id === transfer.toStoreId);
  const storeName = toStore ? toStore.name : 'Destination Store';

  const tx = {
    id: `tx-${Date.now()}`,
    type: 'transfer_acknowledged',
    transferId: transfer.id,
    storeId: transfer.toStoreId,
    timestamp: new Date().toISOString(),
    description: `Transfer Acknowledged: ${transfer.quantity}x ${transfer.productName} received at ${storeName} by ${req.user.name}`
  };

  appData.transactions.unshift(tx);
  saveData(appData);

  // Broadcast real-time acknowledgment
  io.emit('transfer_acknowledged', {
    type: 'TRANSFER_ACKNOWLEDGED',
    transfer,
    transaction: tx,
    transfers: appData.transfers
  });

  res.json({
    success: true,
    message: `Transfer #${transfer.id} acknowledged successfully.`,
    transfer
  });
});

// Demo Helper: Reset data to initial seed
app.post('/api/reset', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admin can reset system data' });
  }
  const seed = fs.readFileSync(SEED_FILE, 'utf8');
  fs.writeFileSync(DATA_FILE, seed, 'utf8');
  appData = JSON.parse(seed);

  io.emit('data_reset', {
    message: 'System data reset to initial prototype state.',
    stores: appData.stores,
    transfers: appData.transfers,
    transactions: appData.transactions
  });

  res.json({ success: true, message: 'Data reset to initial prototype state successfully.' });
});

// Fallback to index.html for client-side navigation
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// WebSocket Connection handling
io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(` Great Goods Server Running on http://localhost:${PORT}`);
  console.log(` Role-based Real-Time Multi-Store Management System`);
  console.log(`=================================================`);
});
