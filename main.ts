import express, { Request, Response } from "express";
import knex from "knex";
import knexfile from "./knexfile.js";

const db = knex(knexfile);

const app = express();
const port = 3000;

// parse JSON request bodies into req.body
app.use(express.json());

// serve the frontend (index.html, script.js, ...) from the public folder
app.use(express.static("public"));

// GET all tools. lentToStudentId is null when the tool is available.
app.get("/api/tools", (req: Request, res: Response) => {
  db.select("*")
    .table("tools")
    .then((data) => {
      res.send(data);
    })
    .catch((e) => {
      console.error(e);
      res.status(500).send({ error: "Something went wrong" });
    });
});

// POST a new tool
app.post("/api/tools", (req: Request, res: Response) => {
  // only pick the fields we allow to be set, never pass req.body straight to the database
  const toolInstance = {
    name: req.body.name,
    description: req.body.description,
  };

  if (!toolInstance.name) {
    res.status(400).send({ error: "A tool needs a name" });
    return;
  }

  db.insert(toolInstance)
    .table("tools")
    .returning("*")
    .then((data) => {
      res.status(201).send(data);
    })
    .catch((e) => {
      console.error(e);
      res.status(500).send({ error: "Something went wrong" });
    });
});

// PATCH (partially update) one tool, e.g. to change its name or description
app.patch("/api/tools/:id", (req: Request, res: Response) => {
  const id = req.params.id;
  // only pick the fields we allow to be changed, never pass req.body straight to the database
  const changes = {
    name: req.body.name,
    description: req.body.description,
  };

  if (changes.name === undefined && changes.description === undefined) {
    res.status(400).send({ error: "Send a name and/or a description" });
    return;
  }

  db.update(changes)
    .table("tools")
    .where({ id: id })
    .then((updatedRows) => {
      if (updatedRows === 0) {
        res.status(404).send({ error: "Tool not found" });
        return;
      }
      res.send({ updated: updatedRows });
    })
    .catch((e) => {
      console.error(e);
      res.status(500).send({ error: "Something went wrong" });
    });
});

// DELETE one tool
app.delete("/api/tools/:id", (req: Request, res: Response) => {
  const id = req.params.id;

  db.delete()
    .table("tools")
    .where({ id: id })
    .then((deletedRows) => {
      if (deletedRows === 0) {
        res.status(404).send({ error: "Tool not found" });
        return;
      }
      res.send({ deleted: deletedRows });
    })
    .catch((e) => {
      console.error(e);
      res.status(500).send({ error: "Something went wrong" });
    });
});

// POST: a student lends out a tool.
// The student proves who they are with their student number and first name.
// These endpoints do several steps after each other, so they use async/await instead of .then()
app.post("/api/tools/:id/lend", async (req: Request, res: Response) => {
  try {
    const studentNumber = String(req.body.studentNumber ?? "").trim();
    const firstName = String(req.body.firstName ?? "").trim();

    // the student number must exist AND belong to this first name (upper or lower case does not matter)
    const student = await db
      .select("*")
      .table("students")
      .where({ studentNumber: studentNumber })
      .first();
    if (
      !student ||
      student.firstName.toLowerCase() !== firstName.toLowerCase()
    ) {
      res
        .status(401)
        .send({ error: "Student number and first name do not match" });
      return;
    }

    const tool = await db
      .select("*")
      .table("tools")
      .where({ id: req.params.id })
      .first();
    if (!tool) {
      res.status(404).send({ error: "Tool not found" });
      return;
    }

    // whereNull makes sure two students cannot lend the same tool at the same time
    const updatedRows = await db
      .update({ lentToStudentId: student.id })
      .table("tools")
      .where({ id: tool.id })
      .whereNull("lentToStudentId");
    if (updatedRows === 0) {
      res.status(409).send({ error: "This tool is already lent out" });
      return;
    }

    res.send({ ...tool, lentToStudentId: student.id });
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: "Something went wrong" });
  }
});

// POST: a tool is returned, so it is available again
app.post("/api/tools/:id/return", async (req: Request, res: Response) => {
  try {
    const tool = await db
      .select("*")
      .table("tools")
      .where({ id: req.params.id })
      .first();
    if (!tool) {
      res.status(404).send({ error: "Tool not found" });
      return;
    }

    const updatedRows = await db
      .update({ lentToStudentId: null })
      .table("tools")
      .where({ id: tool.id })
      .whereNotNull("lentToStudentId");
    if (updatedRows === 0) {
      res.status(409).send({ error: "This tool is not lent out" });
      return;
    }

    res.send({ ...tool, lentToStudentId: null });
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: "Something went wrong" });
  }
});

app.listen(port, () => {
  console.log(`Media Lab tools is running on http://localhost:${port}`);
});
