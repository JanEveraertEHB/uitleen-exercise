import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
      await knex.schema.createTable("loans", function (table) {
        table.increments();
        table.string("name", 100).notNullable();
        table.string("description", 500);
        table.integer("lentAt").unsigned().references("id").inTable("students");
        table.integer("returnedAt").unsigned().references("id").inTable("students");
  });
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable("loans");
}

