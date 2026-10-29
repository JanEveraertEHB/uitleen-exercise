import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("loans_new", (table) => {
    table.increments();
    table.integer("toolId").unsigned().references("id").inTable("tools").onDelete("CASCADE");
    table.integer("studentId").unsigned().references("id").inTable("students").onDelete("CASCADE");
    table.string("lentAt", 100).notNullable();
    table.string("returnedAt", 100);
  });
  await knex.raw(
    'INSERT INTO "loans_new" ("id", "toolId", "studentId", "lentAt", "returnedAt") SELECT "id", "ToolId", "StudentId", "lentAt", "returnAt" FROM "loans"'
  );
  await knex.schema.dropTable("loans");
  await knex.schema.renameTable("loans_new", "loans");
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.createTable("loans_old", (table) => {
    table.increments();
    table.integer("ToolId").unsigned().references("id").inTable("tools");
    table.integer("StudentId").unsigned().references("id").inTable("students");
    table.string("lentAt", 100).notNullable();
    table.string("returnAt", 100);
  });
  await knex.raw(
    'INSERT INTO "loans_old" ("id", "ToolId", "StudentId", "lentAt", "returnAt") SELECT "id", "toolId", "studentId", "lentAt", "returnedAt" FROM "loans"'
  );
  await knex.schema.dropTable("loans");
  await knex.schema.renameTable("loans_old", "loans");
}
