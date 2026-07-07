const { seedTable } = require("../lib/db");

const COUNTS = {
  restaurants: 200,
  menuItems: 3000,
  customers: 2500,
  drivers: 300,
  orders: 8000,
};

module.exports = {
  key: "food-delivery",
  label: "Food Delivery (restaurants, menu items, customers, drivers, orders)",

  build(db, faker, log) {
    db.exec(`
      CREATE TABLE restaurants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        cuisine TEXT NOT NULL,
        city TEXT NOT NULL,
        rating REAL NOT NULL
      );

      CREATE TABLE menu_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        restaurant_id INTEGER NOT NULL REFERENCES restaurants(id),
        name TEXT NOT NULL,
        price REAL NOT NULL,
        category TEXT NOT NULL
      );

      CREATE TABLE customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        city TEXT NOT NULL,
        joined_at TEXT NOT NULL
      );

      CREATE TABLE drivers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        vehicle_type TEXT NOT NULL,
        rating REAL NOT NULL
      );

      CREATE TABLE orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL REFERENCES customers(id),
        restaurant_id INTEGER NOT NULL REFERENCES restaurants(id),
        driver_id INTEGER REFERENCES drivers(id),
        status TEXT NOT NULL,
        placed_at TEXT NOT NULL,
        delivered_at TEXT,
        total_amount REAL NOT NULL
      );

      CREATE TABLE order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL REFERENCES orders(id),
        menu_item_id INTEGER NOT NULL REFERENCES menu_items(id),
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL
      );

      CREATE INDEX idx_menu_items_restaurant ON menu_items(restaurant_id);
      CREATE INDEX idx_orders_customer ON orders(customer_id);
      CREATE INDEX idx_orders_restaurant ON orders(restaurant_id);
      CREATE INDEX idx_orders_driver ON orders(driver_id);
      CREATE INDEX idx_order_items_order ON order_items(order_id);
      CREATE INDEX idx_order_items_menu_item ON order_items(menu_item_id);
    `);

    const cuisines = ["Italian", "Chinese", "Mexican", "Indian", "Japanese", "Thai", "American", "Mediterranean", "Korean", "Vegan"];
    const insertRestaurant = db.prepare(`
      INSERT INTO restaurants (name, cuisine, city, rating) VALUES (?, ?, ?, ?)
    `);
    log(`Seeding ${COUNTS.restaurants} restaurants...`);
    seedTable(db, COUNTS.restaurants, () => {
      insertRestaurant.run(
        `${faker.company.name()} ${faker.helpers.arrayElement(["Kitchen", "Bistro", "Grill", "Eatery", "Diner"])}`,
        faker.helpers.arrayElement(cuisines),
        faker.location.city(),
        Number(faker.number.float({ min: 2.5, max: 5, fractionDigits: 1 }))
      );
    });

    const menuCategories = ["Appetizer", "Main Course", "Dessert", "Beverage", "Side"];
    const insertMenuItem = db.prepare(`
      INSERT INTO menu_items (restaurant_id, name, price, category) VALUES (?, ?, ?, ?)
    `);
    log(`Seeding ${COUNTS.menuItems} menu items...`);
    seedTable(db, COUNTS.menuItems, () => {
      insertMenuItem.run(
        faker.number.int({ min: 1, max: COUNTS.restaurants }),
        faker.commerce.productName(),
        Number(faker.commerce.price({ min: 3, max: 45 })),
        faker.helpers.arrayElement(menuCategories)
      );
    });

    const insertCustomer = db.prepare(`
      INSERT INTO customers (first_name, last_name, email, city, joined_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    log(`Seeding ${COUNTS.customers} customers...`);
    seedTable(db, COUNTS.customers, (i) => {
      const first = faker.person.firstName();
      const last = faker.person.lastName();
      insertCustomer.run(
        first,
        last,
        faker.internet.email({ firstName: first, lastName: last }) + `.${i}`,
        faker.location.city(),
        faker.date.past({ years: 4 }).toISOString()
      );
    });

    const vehicleTypes = ["bike", "scooter", "car", "on foot"];
    const insertDriver = db.prepare(`
      INSERT INTO drivers (first_name, last_name, vehicle_type, rating) VALUES (?, ?, ?, ?)
    `);
    log(`Seeding ${COUNTS.drivers} drivers...`);
    seedTable(db, COUNTS.drivers, () => {
      insertDriver.run(
        faker.person.firstName(),
        faker.person.lastName(),
        faker.helpers.arrayElement(vehicleTypes),
        Number(faker.number.float({ min: 3, max: 5, fractionDigits: 1 }))
      );
    });

    const statuses = ["placed", "preparing", "out_for_delivery", "delivered", "cancelled"];
    const insertOrder = db.prepare(`
      INSERT INTO orders (customer_id, restaurant_id, driver_id, status, placed_at, delivered_at, total_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const insertOrderItem = db.prepare(`
      INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price) VALUES (?, ?, ?, ?)
    `);
    log(`Seeding ${COUNTS.orders} orders (with line items)...`);
    seedTable(db, COUNTS.orders, () => {
      const status = faker.helpers.arrayElement(statuses);
      const placedAt = faker.date.past({ years: 2 });
      const isDelivered = status === "delivered";
      const itemCount = faker.number.int({ min: 1, max: 5 });
      let total = 0;

      const orderInfo = insertOrder.run(
        faker.number.int({ min: 1, max: COUNTS.customers }),
        faker.number.int({ min: 1, max: COUNTS.restaurants }),
        status === "placed" ? null : faker.number.int({ min: 1, max: COUNTS.drivers }),
        status,
        placedAt.toISOString(),
        isDelivered ? faker.date.soon({ days: 1, refDate: placedAt }).toISOString() : null,
        0
      );
      const orderId = orderInfo.lastInsertRowid;
      for (let j = 0; j < itemCount; j++) {
        const menuItemId = faker.number.int({ min: 1, max: COUNTS.menuItems });
        const quantity = faker.number.int({ min: 1, max: 3 });
        const unitPrice = Number(faker.commerce.price({ min: 3, max: 45 }));
        total += quantity * unitPrice;
        insertOrderItem.run(orderId, menuItemId, quantity, unitPrice);
      }
      db.prepare("UPDATE orders SET total_amount = ? WHERE id = ?").run(Number(total.toFixed(2)), orderId);
    });
  },
};
