const { seedTable } = require("../lib/db");

const COUNTS = {
  categories: 8,
  customers: 2000,
  addresses: 2600,
  coupons: 100,
  products: 500,
  orders: 5000,
  reviews: 3000,
};

const CATEGORY_NAMES = ["Electronics", "Home & Kitchen", "Fashion", "Books", "Toys", "Sports", "Beauty", "Groceries"];

module.exports = {
  key: "commerce",
  label: "Commerce (customers, products, orders, reviews, coupons)",

  build(db, faker, log) {
    db.exec(`
      CREATE TABLE categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      );

      CREATE TABLE customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        phone TEXT,
        city TEXT,
        country TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE addresses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL REFERENCES customers(id),
        label TEXT NOT NULL,
        line1 TEXT NOT NULL,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        postal_code TEXT NOT NULL,
        country TEXT NOT NULL,
        is_default INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE coupons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL UNIQUE,
        discount_percent INTEGER NOT NULL,
        expires_at TEXT NOT NULL,
        active INTEGER NOT NULL
      );

      CREATE TABLE products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category_id INTEGER NOT NULL REFERENCES categories(id),
        price REAL NOT NULL,
        stock_quantity INTEGER NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL REFERENCES customers(id),
        address_id INTEGER NOT NULL REFERENCES addresses(id),
        coupon_id INTEGER REFERENCES coupons(id),
        status TEXT NOT NULL,
        ordered_at TEXT NOT NULL,
        total_amount REAL NOT NULL
      );

      CREATE TABLE order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL REFERENCES orders(id),
        product_id INTEGER NOT NULL REFERENCES products(id),
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL
      );

      CREATE TABLE reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL REFERENCES products(id),
        customer_id INTEGER NOT NULL REFERENCES customers(id),
        rating INTEGER NOT NULL,
        comment TEXT,
        created_at TEXT NOT NULL
      );

      CREATE INDEX idx_addresses_customer ON addresses(customer_id);
      CREATE INDEX idx_products_category ON products(category_id);
      CREATE INDEX idx_orders_customer ON orders(customer_id);
      CREATE INDEX idx_orders_address ON orders(address_id);
      CREATE INDEX idx_order_items_order ON order_items(order_id);
      CREATE INDEX idx_order_items_product ON order_items(product_id);
      CREATE INDEX idx_reviews_product ON reviews(product_id);
    `);

    const insertCategory = db.prepare(`INSERT INTO categories (name) VALUES (?)`);
    log(`Seeding ${COUNTS.categories} categories...`);
    CATEGORY_NAMES.forEach((name) => insertCategory.run(name));

    const insertCustomer = db.prepare(`
      INSERT INTO customers (first_name, last_name, email, phone, city, country, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    log(`Seeding ${COUNTS.customers} customers...`);
    seedTable(db, COUNTS.customers, (i) => {
      const first = faker.person.firstName();
      const last = faker.person.lastName();
      insertCustomer.run(
        first,
        last,
        faker.internet.email({ firstName: first, lastName: last, allowSpecialCharacters: false }) + `.${i}`,
        faker.phone.number(),
        faker.location.city(),
        faker.location.country(),
        faker.date.past({ years: 3 }).toISOString()
      );
    });

    const addressLabels = ["Home", "Work", "Other"];
    const insertAddress = db.prepare(`
      INSERT INTO addresses (customer_id, label, line1, city, state, postal_code, country, is_default)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    log(`Seeding ${COUNTS.addresses} addresses...`);
    seedTable(db, COUNTS.addresses, (i) => {
      insertAddress.run(
        faker.number.int({ min: 1, max: COUNTS.customers }),
        faker.helpers.arrayElement(addressLabels),
        faker.location.streetAddress(),
        faker.location.city(),
        faker.location.state(),
        faker.location.zipCode(),
        faker.location.country(),
        i % 3 === 0 ? 1 : 0
      );
    });

    const insertCoupon = db.prepare(`
      INSERT INTO coupons (code, discount_percent, expires_at, active)
      VALUES (?, ?, ?, ?)
    `);
    log(`Seeding ${COUNTS.coupons} coupons...`);
    seedTable(db, COUNTS.coupons, () => {
      const expiresAt = faker.date.future({ years: 1 });
      insertCoupon.run(
        faker.string.alphanumeric({ length: 8, casing: "upper" }),
        faker.helpers.arrayElement([5, 10, 15, 20, 25, 30, 50]),
        expiresAt.toISOString(),
        expiresAt > new Date() ? 1 : 0
      );
    });

    const insertProduct = db.prepare(`
      INSERT INTO products (name, category_id, price, stock_quantity, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    log(`Seeding ${COUNTS.products} products...`);
    seedTable(db, COUNTS.products, () => {
      insertProduct.run(
        faker.commerce.productName(),
        faker.number.int({ min: 1, max: COUNTS.categories }),
        Number(faker.commerce.price({ min: 2, max: 1500 })),
        faker.number.int({ min: 0, max: 5000 }),
        faker.date.past({ years: 2 }).toISOString()
      );
    });

    const statuses = ["pending", "processing", "shipped", "delivered", "cancelled", "refunded"];
    const insertOrder = db.prepare(`
      INSERT INTO orders (customer_id, address_id, coupon_id, status, ordered_at, total_amount)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const insertOrderItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, quantity, unit_price)
      VALUES (?, ?, ?, ?)
    `);
    log(`Seeding ${COUNTS.orders} orders (with line items)...`);
    seedTable(db, COUNTS.orders, () => {
      const customerId = faker.number.int({ min: 1, max: COUNTS.customers });
      const itemCount = faker.number.int({ min: 1, max: 5 });
      let total = 0;
      const orderInfo = insertOrder.run(
        customerId,
        faker.number.int({ min: 1, max: COUNTS.addresses }),
        faker.datatype.boolean({ probability: 0.3 }) ? faker.number.int({ min: 1, max: COUNTS.coupons }) : null,
        faker.helpers.arrayElement(statuses),
        faker.date.past({ years: 2 }).toISOString(),
        0
      );
      const orderId = orderInfo.lastInsertRowid;
      for (let j = 0; j < itemCount; j++) {
        const productId = faker.number.int({ min: 1, max: COUNTS.products });
        const quantity = faker.number.int({ min: 1, max: 4 });
        const unitPrice = Number(faker.commerce.price({ min: 2, max: 1500 }));
        total += quantity * unitPrice;
        insertOrderItem.run(orderId, productId, quantity, unitPrice);
      }
      db.prepare("UPDATE orders SET total_amount = ? WHERE id = ?").run(Number(total.toFixed(2)), orderId);
    });

    const insertReview = db.prepare(`
      INSERT INTO reviews (product_id, customer_id, rating, comment, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    log(`Seeding ${COUNTS.reviews} reviews...`);
    seedTable(db, COUNTS.reviews, () => {
      insertReview.run(
        faker.number.int({ min: 1, max: COUNTS.products }),
        faker.number.int({ min: 1, max: COUNTS.customers }),
        faker.number.int({ min: 1, max: 5 }),
        faker.lorem.sentence(),
        faker.date.past({ years: 2 }).toISOString()
      );
    });
  },
};
