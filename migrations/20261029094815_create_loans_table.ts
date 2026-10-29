import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("loans", function (table) {
    table.increments();
    table.integer("toolId").unsigned().references("id").inTable("tools").onDelete('CASCADE');
    table.integer("studentId").unsigned().references("students.id");
    table.string("lentAt", 100).notNullable();
    table.string("returnedAt", 100);
  });
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("loans");
}
