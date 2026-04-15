-- Seed data for PostgreSQL test database

CREATE SCHEMA IF NOT EXISTS sales;
CREATE SCHEMA IF NOT EXISTS analytics;

-- ── Public schema ──────────────────────────────────────────────────────────

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    category VARCHAR(50),
    in_stock BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    total NUMERIC(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id),
    product_id INT REFERENCES products(id),
    quantity INT NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL
);

-- ── Sales schema ───────────────────────────────────────────────────────────

CREATE TABLE sales.regions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    country VARCHAR(50) NOT NULL
);

CREATE TABLE sales.targets (
    id SERIAL PRIMARY KEY,
    region_id INT REFERENCES sales.regions(id),
    quarter VARCHAR(10) NOT NULL,
    target_amount NUMERIC(12,2) NOT NULL
);

-- ── Indexes ────────────────────────────────────────────────────────────────

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_products_category ON products(category);

-- ── Sample data ────────────────────────────────────────────────────────────

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

INSERT INTO sales.regions (name, country) VALUES
    ('Northeast', 'US'),
    ('West Coast', 'US'),
    ('Central', 'US'),
    ('London', 'UK');

INSERT INTO sales.targets (region_id, quarter, target_amount) VALUES
    (1, '2026-Q1', 150000.00),
    (1, '2026-Q2', 175000.00),
    (2, '2026-Q1', 200000.00),
    (3, '2026-Q1', 100000.00),
    (4, '2026-Q1', 120000.00);

-- ── Views ──────────────────────────────────────────────────────────────────

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
