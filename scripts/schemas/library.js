const { seedTable } = require("../lib/db");

const COUNTS = {
  authors: 800,
  books: 3000,
  members: 2000,
  loans: 9000,
  reservations: 1500,
};

module.exports = {
  key: "library",
  label: "Library (authors, books, members, loans, reservations)",

  build(db, faker, log) {
    db.exec(`
      CREATE TABLE authors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        country TEXT NOT NULL,
        birth_year INTEGER NOT NULL
      );

      CREATE TABLE books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author_id INTEGER NOT NULL REFERENCES authors(id),
        genre TEXT NOT NULL,
        isbn TEXT NOT NULL UNIQUE,
        published_year INTEGER NOT NULL,
        copies_total INTEGER NOT NULL
      );

      CREATE TABLE members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        joined_at TEXT NOT NULL,
        membership_type TEXT NOT NULL
      );

      CREATE TABLE loans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_id INTEGER NOT NULL REFERENCES books(id),
        member_id INTEGER NOT NULL REFERENCES members(id),
        borrowed_at TEXT NOT NULL,
        due_at TEXT NOT NULL,
        returned_at TEXT
      );

      CREATE TABLE reservations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_id INTEGER NOT NULL REFERENCES books(id),
        member_id INTEGER NOT NULL REFERENCES members(id),
        reserved_at TEXT NOT NULL,
        status TEXT NOT NULL
      );

      CREATE INDEX idx_books_author ON books(author_id);
      CREATE INDEX idx_loans_book ON loans(book_id);
      CREATE INDEX idx_loans_member ON loans(member_id);
      CREATE INDEX idx_reservations_book ON reservations(book_id);
      CREATE INDEX idx_reservations_member ON reservations(member_id);
    `);

    const insertAuthor = db.prepare(`
      INSERT INTO authors (name, country, birth_year) VALUES (?, ?, ?)
    `);
    log(`Seeding ${COUNTS.authors} authors...`);
    seedTable(db, COUNTS.authors, () => {
      insertAuthor.run(
        faker.person.fullName(),
        faker.location.country(),
        faker.number.int({ min: 1900, max: 2000 })
      );
    });

    const genres = ["Fiction", "Non-Fiction", "Mystery", "Sci-Fi", "Fantasy", "Biography", "History", "Romance", "Poetry", "Self-Help"];
    const insertBook = db.prepare(`
      INSERT INTO books (title, author_id, genre, isbn, published_year, copies_total)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    log(`Seeding ${COUNTS.books} books...`);
    seedTable(db, COUNTS.books, () => {
      insertBook.run(
        faker.lorem.words({ min: 2, max: 5 }).replace(/\b\w/g, (c) => c.toUpperCase()),
        faker.number.int({ min: 1, max: COUNTS.authors }),
        faker.helpers.arrayElement(genres),
        faker.commerce.isbn(),
        faker.number.int({ min: 1950, max: 2026 }),
        faker.number.int({ min: 1, max: 15 })
      );
    });

    const membershipTypes = ["standard", "student", "premium", "senior"];
    const insertMember = db.prepare(`
      INSERT INTO members (first_name, last_name, email, joined_at, membership_type)
      VALUES (?, ?, ?, ?, ?)
    `);
    log(`Seeding ${COUNTS.members} members...`);
    seedTable(db, COUNTS.members, (i) => {
      const first = faker.person.firstName();
      const last = faker.person.lastName();
      insertMember.run(
        first,
        last,
        faker.internet.email({ firstName: first, lastName: last }) + `.${i}`,
        faker.date.past({ years: 8 }).toISOString(),
        faker.helpers.arrayElement(membershipTypes)
      );
    });

    const insertLoan = db.prepare(`
      INSERT INTO loans (book_id, member_id, borrowed_at, due_at, returned_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    log(`Seeding ${COUNTS.loans} loans...`);
    seedTable(db, COUNTS.loans, () => {
      const borrowedAt = faker.date.past({ years: 3 });
      const dueAt = new Date(borrowedAt.getTime() + 14 * 24 * 60 * 60 * 1000);
      const isReturned = faker.datatype.boolean({ probability: 0.75 });
      insertLoan.run(
        faker.number.int({ min: 1, max: COUNTS.books }),
        faker.number.int({ min: 1, max: COUNTS.members }),
        borrowedAt.toISOString(),
        dueAt.toISOString(),
        isReturned ? faker.date.between({ from: borrowedAt, to: new Date() }).toISOString() : null
      );
    });

    const reservationStatuses = ["pending", "ready", "fulfilled", "cancelled"];
    const insertReservation = db.prepare(`
      INSERT INTO reservations (book_id, member_id, reserved_at, status)
      VALUES (?, ?, ?, ?)
    `);
    log(`Seeding ${COUNTS.reservations} reservations...`);
    seedTable(db, COUNTS.reservations, () => {
      insertReservation.run(
        faker.number.int({ min: 1, max: COUNTS.books }),
        faker.number.int({ min: 1, max: COUNTS.members }),
        faker.date.past({ years: 1 }).toISOString(),
        faker.helpers.arrayElement(reservationStatuses)
      );
    });
  },
};
