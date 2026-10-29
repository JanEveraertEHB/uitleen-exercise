import type { Knex } from "knex";

// Database configuration, used by main.ts and by the knex CLI (npm run migrate)
const config: Knex.Config = {
  client: "better-sqlite3",
  useNullAsDefault: true,
  connection: {
    filename: "./db/medialab.db",
  },
  migrations: {
    tableName: "knex_migrations",
    // only run the compiled migrations, not the .ts sources sitting next to them
    loadExtensions: [".js"],
  },
  seeds: {
    directory: "./seeds",
    // only run the compiled seeds, not the .ts sources sitting next to them
    loadExtensions: [".js"],
  },
};


// no
export default config;
