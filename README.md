# sqlite-practice

Hey MimiSpark 👋

This is your personal playground for practicing data analysis with SQL. Run one command and get a fully populated SQLite database — thousands of realistic, messy, interconnected rows — ready for you to query, break, and learn from.

## Getting started

```bash
git clone https://github.com/YoungMayor/sqlite-practice.git
cd sqlite-practice
npm install
npm run setup
```

`npm run setup` walks you through everything interactively:

1. Pick a database type — Commerce, Education, Movies, or Social Media.
2. If that database doesn't exist yet, it gets created and populated for you.
3. If it already exists, you'll be asked whether to refresh it. Refreshing wipes the old data (this can't be undone), so you'll be asked to confirm before anything is deleted.
4. Tables are created and filled with thousands of realistic fake records using [Faker](https://fakerjs.dev/).

## Database types

| Type | Tables |
| --- | --- |
| Commerce | `customers`, `products`, `orders`, `order_items`, `reviews` |
| Education | `teachers`, `students`, `courses`, `enrollments` |
| Movies | `directors`, `actors`, `movies`, `movie_cast`, `reviews` |
| Social Media | `users`, `posts`, `comments`, `likes`, `follows` |

Each database lands at `db/{type}-database.sqlite` — for example `db/commerce-database.sqlite`.

## Exploring your database

Open it with any SQLite client, e.g.:

```bash
sqlite3 db/commerce-database.sqlite
```

Or point a GUI tool like [DB Browser for SQLite](https://sqlitebrowser.org/) or [TablePlus](https://tableplus.com/) at the file directly.

## Project structure

```
scripts/
  setup.js           interactive CLI entry point
  lib/                shared helpers (db access, personalization)
  schemas/            table definitions + data generators per database type
db/
  *.sqlite            your generated databases (created on demand)
```

Have fun exploring — every query you write here is a rep towards mastery. 🎉
