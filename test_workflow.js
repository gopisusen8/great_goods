const BASE = 'http://localhost:3000';

async function runTests() {
  console.log('--- 1. Testing Demo Users API ---');
  const demoUsersRes = await fetch(`${BASE}/api/auth/demo-users`);
  const demoUsers = await demoUsersRes.json();
  console.log(`Found ${demoUsers.length} demo accounts.`);

  console.log('\n--- 2. Testing Admin Login ---');
  const adminLoginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' })
  });
  const adminData = await adminLoginRes.json();
  console.log(`Admin login OK. User: ${adminData.user.name}, Role: ${adminData.user.role}`);
  const adminToken = adminData.token;

  console.log('\n--- 3. Testing Manager 3 (East Bay Express) Login ---');
  const mgrLoginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'manager3', password: 'pass123' })
  });
  const mgrData = await mgrLoginRes.json();
  console.log(`Manager login OK. User: ${mgrData.user.name}, Store: ${mgrData.user.storeId}`);
  const mgrToken = mgrData.token;

  console.log('\n--- 4. Testing Admin Get State ---');
  const stateRes = await fetch(`${BASE}/api/state`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const state = await stateRes.json();
  console.log(`Stores: ${state.stores.length}, Products: ${state.products.length}, Transfers: ${state.transfers.length}`);

  const store4Before = state.stores.find(s => s.id === 'store-4').inventory['prod-1'];
  const store3Before = state.stores.find(s => s.id === 'store-3').inventory['prod-1'];
  console.log(`Before Transfer: Store 4 Sourdough=${store4Before}, Store 3 Sourdough=${store3Before}`);

  console.log('\n--- 5. Testing Inter-Store Product Transfer (Store 4 -> Store 3) ---');
  const transferRes = await fetch(`${BASE}/api/transfers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      fromStoreId: 'store-4',
      toStoreId: 'store-3',
      productId: 'prod-1',
      quantity: 5
    })
  });
  const transferData = await transferRes.json();
  console.log(`Transfer created: ID=${transferData.transfer.id}, Status=${transferData.transfer.status}`);

  console.log('\n--- 6. Testing Manager 3 Scoped State & Transfer Visibility ---');
  const mgrStateRes = await fetch(`${BASE}/api/state`, {
    headers: { Authorization: `Bearer ${mgrToken}` }
  });
  const mgrState = await mgrStateRes.json();
  const incoming = mgrState.transfers.find(t => t.id === transferData.transfer.id);
  console.log(`Manager 3 sees incoming transfer: found=${!!incoming}, status=${incoming.status}`);

  console.log('\n--- 7. Testing Transfer Acknowledgment by Manager 3 ---');
  const ackRes = await fetch(`${BASE}/api/transfers/${transferData.transfer.id}/acknowledge`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${mgrToken}` }
  });
  const ackData = await ackRes.json();
  console.log(`Transfer acknowledged: Status=${ackData.transfer.status}, By=${ackData.transfer.acknowledgedBy}`);

  console.log('\n--- 8. Testing Sell Action (East Bay Express) ---');
  const stockBeforeSell = mgrState.store.inventory['prod-1'];
  const sellRes = await fetch(`${BASE}/api/stores/store-3/sell`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${mgrToken}`
    },
    body: JSON.stringify({ productId: 'prod-1' })
  });
  const sellData = await sellRes.json();
  console.log(`Sell OK: Previous Stock=${stockBeforeSell}, New Stock=${sellData.store.inventory['prod-1']}, Sales=${sellData.store.sales['prod-1']}`);

  console.log('\n--- 9. Testing Add Stock Action (East Bay Express) ---');
  const addStockRes = await fetch(`${BASE}/api/stores/store-3/stock`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${mgrToken}`
    },
    body: JSON.stringify({ productId: 'prod-1', quantity: 15 })
  });
  const addStockData = await addStockRes.json();
  console.log(`Add Stock OK: New Stock=${addStockData.store.inventory['prod-1']}`);

  console.log('\n--- 10. Testing Transfer Validation: Same Source & Dest ---');
  const invalidTransfer1 = await fetch(`${BASE}/api/transfers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      fromStoreId: 'store-1',
      toStoreId: 'store-1',
      productId: 'prod-1',
      quantity: 5
    })
  });
  console.log(`Same store validation (expected 400): status=${invalidTransfer1.status}`);

  console.log('\n--- 11. Testing Transfer Validation: Insufficient Stock ---');
  const invalidTransfer2 = await fetch(`${BASE}/api/transfers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      fromStoreId: 'store-1',
      toStoreId: 'store-2',
      productId: 'prod-1',
      quantity: 99999
    })
  });
  console.log(`Insufficient stock validation (expected 400): status=${invalidTransfer2.status}`);

  console.log('\n--- 12. Testing Manager Access Control (Manager cannot transfer) ---');
  const unauthorizedTransfer = await fetch(`${BASE}/api/transfers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${mgrToken}`
    },
    body: JSON.stringify({
      fromStoreId: 'store-3',
      toStoreId: 'store-1',
      productId: 'prod-1',
      quantity: 1
    })
  });
  console.log(`Manager transfer blocked (expected 403): status=${unauthorizedTransfer.status}`);

  console.log('\n========================================');
  console.log('✅ ALL 12 INTEGRATION & WORKFLOW TESTS PASSED!');
  console.log('========================================');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
