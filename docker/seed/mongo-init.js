// Seed data for MongoDB test database

db = db.getSiblingDB('testdb');

// Users collection
db.users.insertMany([
  { name: 'Alice Johnson', email: 'alice@example.com', role: 'admin', createdAt: new Date() },
  { name: 'Bob Smith', email: 'bob@example.com', role: 'user', createdAt: new Date() },
  { name: 'Carol White', email: 'carol@example.com', role: 'user', createdAt: new Date() },
  { name: 'Dave Brown', email: 'dave@example.com', role: 'editor', createdAt: new Date() },
  { name: 'Eve Davis', email: 'eve@example.com', role: 'user', createdAt: new Date() },
]);

db.users.createIndex({ email: 1 }, { unique: true });

// Products collection
db.products.insertMany([
  { name: 'Widget Pro', price: 29.99, category: 'gadgets', inStock: true },
  { name: 'Gizmo Plus', price: 49.99, category: 'gadgets', inStock: true },
  { name: 'Thingamajig', price: 9.99, category: 'accessories', inStock: true },
  { name: 'Doohickey XL', price: 79.99, category: 'tools', inStock: true },
  { name: 'Whatchamacallit', price: 14.99, category: 'accessories', inStock: false },
  { name: 'Contraption 3000', price: 199.99, category: 'tools', inStock: true },
]);

db.products.createIndex({ category: 1 });

// Orders collection (embedded pattern)
db.orders.insertMany([
  {
    customer: 'Alice Johnson',
    total: 79.98,
    status: 'completed',
    items: [
      { product: 'Widget Pro', quantity: 2, unitPrice: 29.99 },
      { product: 'Thingamajig', quantity: 2, unitPrice: 9.99 },
    ],
    createdAt: new Date(),
  },
  {
    customer: 'Bob Smith',
    total: 49.99,
    status: 'completed',
    items: [{ product: 'Gizmo Plus', quantity: 1, unitPrice: 49.99 }],
    createdAt: new Date(),
  },
  {
    customer: 'Carol White',
    total: 209.98,
    status: 'shipped',
    items: [
      { product: 'Doohickey XL', quantity: 1, unitPrice: 79.99 },
      { product: 'Contraption 3000', quantity: 1, unitPrice: 199.99 },
    ],
    createdAt: new Date(),
  },
]);

db.orders.createIndex({ status: 1 });
db.orders.createIndex({ customer: 1 });

// Events collection (time-series-like)
db.events.insertMany([
  { type: 'page_view', page: '/home', userId: 1, ts: new Date() },
  { type: 'click', element: 'buy_button', userId: 2, ts: new Date() },
  { type: 'page_view', page: '/products', userId: 3, ts: new Date() },
  { type: 'purchase', orderId: 1, userId: 1, ts: new Date() },
]);

db.events.createIndex({ type: 1, ts: -1 });
