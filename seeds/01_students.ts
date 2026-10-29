import type { Knex } from "knex";

// Sample students, so you can lend out tools while developing.
// The student numbers and first names are made up.
const students = [
  { studentNumber: "41873", firstName: "Stebph" },
  { studentNumber: "52310", firstName: "Lars" },
  { studentNumber: "30456", firstName: "Enio Bries" },
  { studentNumber: "27741", firstName: "Lucas" },
  { studentNumber: "63092", firstName: "Mila" },
  { studentNumber: "18835", firstName: "Finn" },
  { studentNumber: "74126", firstName: "Zoë" },
  { studentNumber: "35509", firstName: "Arthur" },
  { studentNumber: "90284", firstName: "Nora" },
  { studentNumber: "46617", firstName: "Jules" },
  { studentNumber: "12958", firstName: "Sara" },
  { studentNumber: "83371", firstName: "Mohamed" },
  { studentNumber: "59042", firstName: "Lena" },
  { studentNumber: "21764", firstName: "Viktor" },
  { studentNumber: "68493", firstName: "Amira" },
  { studentNumber: "37158", firstName: "Thomas" },
  { studentNumber: "80625", firstName: "Yara" },
  { studentNumber: "14307", firstName: "Milan" },
  { studentNumber: "72980", firstName: "Elise" },
  { studentNumber: "55216", firstName: "Daan" },
];

export async function seed(knex: Knex): Promise<void> {
  // onConflict().ignore() skips students that already exist, so running the seed twice is safe
  await knex("students").insert(students).onConflict("studentNumber").ignore();
}
