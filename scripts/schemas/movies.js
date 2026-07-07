const { seedTable } = require("../lib/db");

const COUNTS = {
  directors: 400,
  actors: 1500,
  movies: 3000,
  castPerMovie: [2, 8],
  reviews: 6000,
};

module.exports = {
  key: "movies",
  label: "Movies (movies, actors, directors, cast, reviews)",

  build(db, faker, log) {
    db.exec(`
      CREATE TABLE directors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        birth_date TEXT NOT NULL,
        country TEXT NOT NULL
      );

      CREATE TABLE actors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        birth_date TEXT NOT NULL,
        country TEXT NOT NULL
      );

      CREATE TABLE movies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        genre TEXT NOT NULL,
        release_year INTEGER NOT NULL,
        runtime_minutes INTEGER NOT NULL,
        director_id INTEGER NOT NULL REFERENCES directors(id),
        budget_usd INTEGER NOT NULL,
        revenue_usd INTEGER NOT NULL
      );

      CREATE TABLE movie_cast (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        movie_id INTEGER NOT NULL REFERENCES movies(id),
        actor_id INTEGER NOT NULL REFERENCES actors(id),
        role_name TEXT NOT NULL
      );

      CREATE TABLE reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        movie_id INTEGER NOT NULL REFERENCES movies(id),
        reviewer_name TEXT NOT NULL,
        rating REAL NOT NULL,
        comment TEXT,
        created_at TEXT NOT NULL
      );

      CREATE INDEX idx_movies_director ON movies(director_id);
      CREATE INDEX idx_cast_movie ON movie_cast(movie_id);
      CREATE INDEX idx_cast_actor ON movie_cast(actor_id);
      CREATE INDEX idx_reviews_movie ON reviews(movie_id);
    `);

    const insertDirector = db.prepare(`
      INSERT INTO directors (name, birth_date, country) VALUES (?, ?, ?)
    `);
    log(`Seeding ${COUNTS.directors} directors...`);
    seedTable(db, COUNTS.directors, () => {
      insertDirector.run(
        faker.person.fullName(),
        faker.date.birthdate({ min: 35, max: 85, mode: "age" }).toISOString(),
        faker.location.country()
      );
    });

    const insertActor = db.prepare(`
      INSERT INTO actors (name, birth_date, country) VALUES (?, ?, ?)
    `);
    log(`Seeding ${COUNTS.actors} actors...`);
    seedTable(db, COUNTS.actors, () => {
      insertActor.run(
        faker.person.fullName(),
        faker.date.birthdate({ min: 18, max: 80, mode: "age" }).toISOString(),
        faker.location.country()
      );
    });

    const genres = ["Action", "Comedy", "Drama", "Horror", "Sci-Fi", "Romance", "Documentary", "Animation", "Thriller"];
    const insertMovie = db.prepare(`
      INSERT INTO movies (title, genre, release_year, runtime_minutes, director_id, budget_usd, revenue_usd)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const insertCast = db.prepare(`
      INSERT INTO movie_cast (movie_id, actor_id, role_name) VALUES (?, ?, ?)
    `);
    log(`Seeding ${COUNTS.movies} movies (with cast)...`);
    seedTable(db, COUNTS.movies, () => {
      const budget = faker.number.int({ min: 100000, max: 250000000 });
      const info = insertMovie.run(
        faker.company.catchPhrase().replace(/[^\w\s]/g, ""),
        faker.helpers.arrayElement(genres),
        faker.number.int({ min: 1960, max: 2026 }),
        faker.number.int({ min: 75, max: 210 }),
        faker.number.int({ min: 1, max: COUNTS.directors }),
        budget,
        Math.round(budget * faker.number.float({ min: 0.2, max: 4, fractionDigits: 2 }))
      );
      const movieId = info.lastInsertRowid;
      const castCount = faker.number.int({ min: COUNTS.castPerMovie[0], max: COUNTS.castPerMovie[1] });
      for (let j = 0; j < castCount; j++) {
        insertCast.run(
          movieId,
          faker.number.int({ min: 1, max: COUNTS.actors }),
          faker.person.jobTitle()
        );
      }
    });

    const insertReview = db.prepare(`
      INSERT INTO reviews (movie_id, reviewer_name, rating, comment, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    log(`Seeding ${COUNTS.reviews} reviews...`);
    seedTable(db, COUNTS.reviews, () => {
      insertReview.run(
        faker.number.int({ min: 1, max: COUNTS.movies }),
        faker.person.fullName(),
        Number(faker.number.float({ min: 1, max: 10, fractionDigits: 1 })),
        faker.lorem.sentence(),
        faker.date.past({ years: 5 }).toISOString()
      );
    });
  },
};
