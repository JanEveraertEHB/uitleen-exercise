import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
      await knex.schema.createTable("loans", function (table) {
        table.increments();
        table.integer("ToolId").unsigned().references("id").inTable("tools");
        table.integer("StudentId").unsigned().references("id").inTable("students");
        table.string("lentAt", 100).notNullable();
        table.string("returnAt", 100);
  });
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable("loans");
}

