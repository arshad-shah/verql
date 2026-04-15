-- Seed data for MySQL test database

USE testdb;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(50),
    in_stock BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    total DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT,
    product_id INT,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_products_category ON products(category);

-- Sample data
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

-- Views
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

-- Create a second database to test multi-database
CREATE DATABASE IF NOT EXISTS analytics;
GRANT ALL PRIVILEGES ON analytics.* TO 'dbstudio'@'%';

USE analytics;

CREATE TABLE events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    payload JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO events (event_type, payload) VALUES
    ('page_view', '{"page": "/home", "user_id": 1}'),
    ('click', '{"element": "buy_button", "user_id": 2}'),
    ('page_view', '{"page": "/products", "user_id": 3}');
