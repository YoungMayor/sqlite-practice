#!/usr/bin/env node

const inquirer = require("inquirer");
const chalk = require("chalk");
const { faker } = require("@faker-js/faker");

const mentee = require("./lib/mentee");
const { dbExists, deleteDb, openDb, dbPath } = require("./lib/db");

const SCHEMAS = [
  require("./schemas/commerce"),
  require("./schemas/education"),
  require("./schemas/movies"),
  require("./schemas/social-media"),
  require("./schemas/healthcare"),
  require("./schemas/library"),
  require("./schemas/food-delivery"),
];

function log(message) {
  console.log(chalk.gray(`  ${message}`));
}

async function main() {
  console.log();
  console.log(chalk.cyanBright.bold(mentee.welcome()));
  console.log(chalk.dim(mentee.encouragement()));
  console.log();

  const { type } = await inquirer.prompt([
    {
      type: "list",
      name: "type",
      message: "What kind of database do you want to build today?",
      choices: SCHEMAS.map((s) => ({ name: s.label, value: s.key })),
    },
  ]);

  const schema = SCHEMAS.find((s) => s.key === type);

  if (dbExists(type)) {
    console.log();
    console.log(
      chalk.yellow(
        `Looks like ${dbPath(type).split("/").pop()} already exists, ${mentee.MENTEE_NAME}.`,
      ),
    );

    const { refresh } = await inquirer.prompt([
      {
        type: "confirm",
        name: "refresh",
        message: "Do you want to refresh it with brand new data?",
        default: false,
      },
    ]);

    if (!refresh) {
      console.log(
        chalk.dim(
          "No worries, leaving your existing database untouched. See you next time!",
        ),
      );
      return;
    }

    const { confirmed } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirmed",
        message: chalk.red(
          "This will permanently delete the existing database and cannot be undone. Are you sure?",
        ),
        default: false,
      },
    ]);

    if (!confirmed) {
      console.log(chalk.dim("Good call, taking no chances. Cancelling."));
      return;
    }

    deleteDb(type);
    console.log(chalk.dim("Old database cleared out."));
  }

  console.log();
  console.log(
    chalk.green(
      `Alright ${mentee.MENTEE_NAME}, building your ${schema.label} database...`,
    ),
  );
  console.log();

  const db = openDb(type);
  const startedAt = Date.now();

  try {
    schema.build(db, faker, log);
  } finally {
    db.close();
  }

  const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);

  console.log();
  console.log(
    chalk.greenBright.bold(
      `All done! Your database is ready at ${dbPath(type)}`,
    ),
  );
  console.log(
    chalk.dim(
      `Took ${seconds}s. Go get curious with some queries, ${mentee.MENTEE_NAME}.`,
    ),
  );
  console.log();
}

main().catch((err) => {
  console.error(
    chalk.red("Something went wrong while setting up your database:"),
  );
  console.error(err);
  process.exit(1);
});
