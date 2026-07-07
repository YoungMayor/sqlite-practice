const { seedTable } = require("../lib/db");

const COUNTS = {
  users: 3000,
  posts: 20000,
  comments: 40000,
  likes: 60000,
  follows: 15000,
};

module.exports = {
  key: "social-media",
  label: "Social Media (users, posts, comments, likes, follows)",

  build(db, faker, log) {
    db.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        bio TEXT,
        joined_at TEXT NOT NULL
      );

      CREATE TABLE posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        posted_at TEXT NOT NULL
      );

      CREATE TABLE comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL REFERENCES posts(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        commented_at TEXT NOT NULL
      );

      CREATE TABLE likes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL REFERENCES posts(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        liked_at TEXT NOT NULL
      );

      CREATE TABLE follows (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        follower_id INTEGER NOT NULL REFERENCES users(id),
        followee_id INTEGER NOT NULL REFERENCES users(id),
        followed_at TEXT NOT NULL
      );

      CREATE INDEX idx_posts_user ON posts(user_id);
      CREATE INDEX idx_comments_post ON comments(post_id);
      CREATE INDEX idx_comments_user ON comments(user_id);
      CREATE INDEX idx_likes_post ON likes(post_id);
      CREATE INDEX idx_likes_user ON likes(user_id);
      CREATE INDEX idx_follows_follower ON follows(follower_id);
      CREATE INDEX idx_follows_followee ON follows(followee_id);
    `);

    const insertUser = db.prepare(`
      INSERT INTO users (username, display_name, email, bio, joined_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    log(`Seeding ${COUNTS.users} users...`);
    seedTable(db, COUNTS.users, (i) => {
      const first = faker.person.firstName();
      const last = faker.person.lastName();
      insertUser.run(
        faker.internet.userName({ firstName: first, lastName: last }) + i,
        `${first} ${last}`,
        faker.internet.email({ firstName: first, lastName: last }) + `.${i}`,
        faker.lorem.sentence(),
        faker.date.past({ years: 5 }).toISOString()
      );
    });

    const insertPost = db.prepare(`
      INSERT INTO posts (user_id, content, posted_at) VALUES (?, ?, ?)
    `);
    log(`Seeding ${COUNTS.posts} posts...`);
    seedTable(db, COUNTS.posts, () => {
      insertPost.run(
        faker.number.int({ min: 1, max: COUNTS.users }),
        faker.lorem.sentences({ min: 1, max: 3 }),
        faker.date.past({ years: 3 }).toISOString()
      );
    });

    const insertComment = db.prepare(`
      INSERT INTO comments (post_id, user_id, content, commented_at) VALUES (?, ?, ?, ?)
    `);
    log(`Seeding ${COUNTS.comments} comments...`);
    seedTable(db, COUNTS.comments, () => {
      insertComment.run(
        faker.number.int({ min: 1, max: COUNTS.posts }),
        faker.number.int({ min: 1, max: COUNTS.users }),
        faker.lorem.sentence(),
        faker.date.past({ years: 3 }).toISOString()
      );
    });

    const insertLike = db.prepare(`
      INSERT INTO likes (post_id, user_id, liked_at) VALUES (?, ?, ?)
    `);
    log(`Seeding ${COUNTS.likes} likes...`);
    seedTable(db, COUNTS.likes, () => {
      insertLike.run(
        faker.number.int({ min: 1, max: COUNTS.posts }),
        faker.number.int({ min: 1, max: COUNTS.users }),
        faker.date.past({ years: 3 }).toISOString()
      );
    });

    const insertFollow = db.prepare(`
      INSERT INTO follows (follower_id, followee_id, followed_at) VALUES (?, ?, ?)
    `);
    log(`Seeding ${COUNTS.follows} follows...`);
    seedTable(db, COUNTS.follows, () => {
      let follower = faker.number.int({ min: 1, max: COUNTS.users });
      let followee = faker.number.int({ min: 1, max: COUNTS.users });
      if (follower === followee) followee = (followee % COUNTS.users) + 1;
      insertFollow.run(follower, followee, faker.date.past({ years: 4 }).toISOString());
    });
  },
};
