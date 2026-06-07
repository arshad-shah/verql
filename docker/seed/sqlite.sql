-- Seed data for the SQLite test database.
-- Build it with: scripts/make-sqlite-testdb.sh  ->  docker/testdb.sqlite

PRAGMA foreign_keys = ON;

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'user',
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    category TEXT,
    in_stock INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    total NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER REFERENCES orders(id),
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price NUMERIC NOT NULL
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_products_category ON products(category);

INSERT INTO users (name, email, role) VALUES
    ('Alice Johnson', 'alice@example.com', 'admin'),
    ('Bob Smith', 'bob@example.com', 'user'),
    ('Carol White', 'carol@example.com', 'user'),
    ('Dave Brown', 'dave@example.com', 'editor'),
    ('Eve Davis', 'eve@example.com', 'user');

INSERT INTO products (name, price, category) VALUES
    ('Widget Pro', 29.99, 'gadgets'),
    ('Gizmo Plus', 49.99, 'gadgets'),
    ('Thingamajig', 9.99, 'accessories'),
    ('Doohickey XL', 79.99, 'tools'),
    ('Whatchamacallit', 14.99, 'accessories'),
    ('Contraption 3000', 199.99, 'tools');

INSERT INTO orders (user_id, total, status) VALUES
    (1, 79.98, 'completed'),
    (2, 49.99, 'completed'),
    (3, 209.98, 'shipped'),
    (1, 14.99, 'pending'),
    (4, 29.99, 'completed');

INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
    (1, 1, 2, 29.99),
    (1, 3, 2, 9.99),
    (2, 2, 1, 49.99),
    (3, 4, 1, 79.99),
    (3, 6, 1, 199.99),
    (4, 5, 1, 14.99),
    (5, 1, 1, 29.99);

CREATE VIEW order_summary AS
SELECT
    o.id AS order_id,
    u.name AS customer,
    o.total,
    o.status,
    COUNT(oi.id) AS item_count,
    o.created_at
FROM orders o
JOIN users u ON u.id = o.user_id
JOIN order_items oi ON oi.order_id = o.id
GROUP BY o.id, u.name, o.total, o.status, o.created_at;
