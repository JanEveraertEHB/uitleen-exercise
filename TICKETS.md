# Tickets

Every ticket needs three things: a **migration**, a **backend change** (endpoints) and a **frontend change**. Each ticket has its own **branch**: create it from `main`, work on it, and open a pull request when you are done.

A ticket only needs a seed when it has a **Seeds** section. If there is none, do not add one.

The tickets do **not** depend on each other. You can do any ticket on its own, in any order, starting from `main`. Every ticket has its own tables and columns.

Remember: never change a migration that already ran, always make a new one (`npm run migrate:make name_of_the_migration`), make one migration per change, and write a working `down` function.

**Definition of done (every ticket):** test your `down` before you open the pull request. Run `npx knex migrate:rollback` followed by `npm run migrate` (and `npm run seed` if your ticket has seeds). It must work without errors. Note that `rollback` undoes the whole last batch, so it can undo several of your migrations at once.

Every pull request is checked automatically against `.github/pr-requirements.md`. When a ticket brings its own rules, add them there under the number of the ticket (`ML-3.1`, `ML-3.2`, ...), so rules of different tickets never clash.

Tips for all tickets:
- `escapeHtml` in `public/Tool.ts` is exported, so your own classes can use it too.
- SQLite cannot add a foreign key to an existing table without rebuilding it, and that fails when other tables point to it and contain data. Prefer a new table (like a link table) over a new foreign key column on a table that others point to.

---

## ML-1 · Loan history

**Branch:** `feature/ml-1-loan-history`

**Story:** As a visitor, I want to see how often a tool has been lent out, by whom (first name only) and for how long, so I know how much a tool is used.

**Migration**
- Create a new `loans` table with: `id`, `toolId` (foreign key to `tools.id`), `studentId` (foreign key to `students.id`), `lentAt` (required) and `returnedAt` (empty until the tool is returned).
- Tip: store dates as text with `new Date().toISOString()`.
- Think about it: tools that are lent out right now have no row in `loans` yet. What happens when they are returned?
- Think about it: deleting a tool that has a history must still work. Look up `onDelete` in the Knex documentation.

**Endpoints**
- Change `POST /api/tools/:id/lend`: besides marking the tool as lent out, it adds a row to `loans`.
- Change `POST /api/tools/:id/return`: it fills in `returnedAt` of the open loan (the row of this tool where `returnedAt` is empty).
- New: `GET /api/tools/:id/history`: returns the loans of one tool, newest first, with `firstName`, `lentAt` and `returnedAt`. Never return the student number. Returns `404` when the tool does not exist (tip: `join`).

**Frontend**
- Make a `Loan` class in `public/`, like the `Tool` class, with a `renderHtmlString()` that renders one row of a table.
- Add a **History** button to every tool. It shows a history table for that tool, with the text "Lent out 3 times" above it and one row per loan: first name, lent on, and for how long (e.g. `3 days` or `2 hours`).
- A loan that was not returned yet shows "Still lent out" instead of a duration.

**Acceptance criteria**
- [x] Lend a tool and return it: the history shows one row with the first name and a duration.
- [x] A tool that was lent out three times shows "Lent out 3 times" and three rows, newest first.
- [x] A tool that is lent out right now shows "Still lent out".
- [x] The response of `GET /api/tools/:id/history` contains no student numbers.
- [x] The history of a tool that does not exist returns `404`.
- [x] Deleting a tool that has a history works, and its history is gone too.

---

## ML-2 · Report broken tools when returning

**Branch:** `feature/ml-2-broken-reports`

**Story:** As a student returning a tool, I want to tell the coordinator when something is broken, so the coordinator knows what to repair and the next student is not surprised.

**Migration**
- Create a new `broken_reports` table with: `id`, `toolId` (foreign key to `tools.id`), `description` (required), `unusable` (boolean, default `false`) and `createdAt`.
- In a separate migration, add an `unusable` boolean column (default `false`) to `tools`.
- Think about it: why is `unusable` stored in both tables?
- Think about it: deleting a tool that has reports must still work. Look up `onDelete` in the Knex documentation.

**Endpoints**
- New: `POST /api/tools/:id/broken-reports` with body `{ description, unusable }`: saves the report and returns `201` with it. Returns `400` when the description is empty and `404` when the tool does not exist. When `unusable` is `true`, the tool itself is marked as unusable too.
- New: `GET /api/broken-reports`: returns all reports, newest first, including the `name` of the tool (tip: `join`).
- Change `POST /api/tools/:id/lend`: returns `409` when the tool is unusable.
- Change `GET /api/tools` if needed, so the frontend knows which tools are unusable.

**Frontend**
- Clicking **Return** no longer returns the tool immediately. A small form appears: "Did everything go right?" with the radio buttons **Yes** and **No**.
  - **Yes**: the tool is returned, like before.
  - **No**: two more fields appear: "What is broken?" (text) and two radio buttons, **Still usable** and **Unusable**. On submit the report is saved and the tool is returned.
- An unusable tool shows "Unusable" on the front page and has no **Lend** button.
- Add a "Broken reports" section for the coordinator that lists all reports: tool name, description, whether it is unusable, and the date.

**Acceptance criteria**
- [ ] Returning with **Yes** works as before and saves no report.
- [ ] Returning with **No** and a description saves a report and returns the tool.
- [ ] Returning with **No** and an empty description is not possible (`400` from the API, and a message in the frontend).
- [ ] A report marked **Unusable** makes the tool show "Unusable" and it cannot be lent out, not even by calling `POST /api/tools/:id/lend` directly (`409`).
- [ ] A report marked **Still usable** does not block lending.
- [ ] One tool can have multiple reports.
- [ ] A description like `<b>cracked</b>` is shown as plain text, not as bold.
- [ ] Deleting a tool that has reports works, and its reports are gone too.

**Stretch:** Without more work, an unusable tool stays unusable forever. Let `PATCH /api/tools/:id` accept `unusable` and add a **Repaired** button for unusable tools.

---

## ML-3 · Categories

**Branch:** `feature/ml-3-categories`

**Story:** As a visitor, I want tools grouped in categories (phones, VR headsets, cameras, ...), so I can find what I need faster.

**Migration**
- Create a new `categories` table with: `id` and `name` (required, unique).
- In a separate migration, add a `categoryId` column (foreign key to `categories.id`) to `tools`. It is empty for tools without a category, so the tools that already exist keep working.

**Endpoints**
- New: `GET /api/categories`: returns all categories, sorted by name.
- New: `POST /api/categories` with body `{ name }`: returns `201` with the new category, `400` when the name is empty and `409` when a category with that name already exists.
- Change `POST /api/tools` and `PATCH /api/tools/:id`: they accept an optional `categoryId`. Return `404` when that category does not exist.
- Change `GET /api/tools`: every tool also comes with the `categoryName`, and the list can be filtered with `?categoryId=2`. Tip: use `leftJoin`, so tools without a category stay in the list.

**Frontend**
- Add `categoryId` and `categoryName` to the `Tool` class and show the category on every tool.
- Add a `<select>` with the categories to the "Add a tool" form, plus a small form to create a new category.
- Add a filter `<select>` above the list ("All categories", "Phones", ...) that shows only the tools of that category.

**Acceptance criteria**
- [ ] A new tool can be added with a category, and the category is shown on the tool.
- [ ] Tools that were added before this ticket are still in the list, without a category.
- [ ] Filtering on a category only shows the tools of that category, and "All categories" shows everything again.
- [ ] Creating a category that already exists returns `409`.
- [ ] Adding a tool with a category that does not exist returns `404`.

---

## ML-4 · Register new students

**Branch:** `feature/ml-4-student-registration`

**Story:** As a new student, I want to register myself with my student number and first name, so I can lend out tools.

**Migration**
- Create a new `roles` table with: `id` and `name` (required, unique).
- In a separate migration, create a link table `student_roles` (a pivot table, many-to-many) with: `studentId` (foreign key to `students.id`) and `roleId` (foreign key to `roles.id`). Together they are the primary key, so a student can have a role only once. Look up `primary` and `onDelete` in the Knex documentation.
- Why a link table and not a `roleId` column on `students`? Adding a foreign key column to `students` makes SQLite rebuild that table, which fails while `tools` points to students. A new table avoids the problem and also lets a student have more than one role later.
- Think about it: the students that already exist have no role yet. How do they get one? Tip: the seeds run after the migrations.

**Seeds**
- Add `seeds/00_roles.ts` (the `00` makes it run before `01_students.ts`) that seeds the roles `STUDENT` and `ADMIN`. `ADMIN` is not used yet. Like the students seed, it must be safe to run twice.
- Change `seeds/01_students.ts` so every seeded student gets the `STUDENT` role (a row in `student_roles`), including students that are already in the database without a role. Running it twice must not create double rows.

**Endpoints**
- New: `POST /api/students` with body `{ studentNumber, firstName }`: creates the student with the role `STUDENT` and returns `201` with the new student, including the name of the role. Returns `400` when the student number is not exactly 5 digits or the first name is empty, and `409` when the student number is already registered.
- Creating the student and linking the role belong together: look up `db.transaction` in the Knex documentation.
- The role is looked up by name on the server. It is never taken from `req.body`: a visitor must not be able to register as `ADMIN`.
- Tip: keep the student number a string, so `00123` keeps its zeros.

**Frontend**
- Add a "Register" form with a student number input, a first name input and a **Register** button.
- Show a message when it worked ("Welcome, Emma! You can now lend out tools.") and the message of the API when it did not (e.g. the student number is already registered).

**Acceptance criteria**
- [ ] A newly registered student has the role `STUDENT`.
- [ ] A newly registered student can lend out a tool right away with the same student number and first name.
- [ ] Sending `"role": "ADMIN"` or a `roleId` in the body of `POST /api/students` changes nothing: the student still gets `STUDENT`.
- [ ] A student number that is not 5 digits, or an empty first name, returns `400`.
- [ ] Registering a student number that already exists returns `409`.
- [ ] Running `npm run seed` twice does not create double roles or double `student_roles` rows and does not fail.
- [ ] After `npm run seed`, all 20 seeded students have the role `STUDENT`.
- [ ] The migrations also work while a tool is lent out (so there is data pointing to `students`).

---

## ML-5 · Images for tools

**Branch:** `feature/ml-5-tool-images`

**Story:** As a visitor, I want to see a picture of every tool, so I know what I am about to lend out.

**Migration**
- Add an optional `imageUrl` string column (up to 500 characters) to `tools`. It is empty for tools without a picture, so the tools that already exist keep working.
- We only store the URL of the picture. Uploading files is not part of this ticket.

**Endpoints**
- Change `POST /api/tools` and `PATCH /api/tools/:id`: they accept an optional `imageUrl`.
- Return `400` when an `imageUrl` is given that does not start with `http://` or `https://`. Think about it: why is that important? (Look up what a `javascript:` URL does.)
- `GET /api/tools` returns the `imageUrl` too, without any other change.

**Frontend**
- Add `imageUrl` to the `Tool` class and show the picture in `renderHtmlString()` with an `<img>`. Use the name of the tool as the `alt` text.
- A tool without an `imageUrl` shows no `<img>` at all, so there is no broken picture icon.
- Add a text input for the image URL to the "Add a tool" form.

**Acceptance criteria**
- [ ] A tool added with an image URL shows the picture.
- [ ] Tools without an image URL, including the ones that existed before this ticket, still show normally.
- [ ] An `imageUrl` like `javascript:alert(1)` or `not a url` returns `400`.
- [ ] An image URL that contains a quote (`"`) does not break the HTML of the page.
- [ ] Every picture has an `alt` text.

---

## ML-6 · Manuals and tutorials

**Branch:** `feature/ml-6-manuals-and-tutorials`

**Story:** As a visitor, I want to find links to the manual or a tutorial of a tool, so I know how to use it before I lend it out.

**Migration**
- Create a new `tool_links` table with: `id`, `toolId` (foreign key to `tools.id`), `title` (required), `url` (required, up to 500 characters) and `type` (`'manual'` or `'tutorial'`, default `'manual'`).
- Think about it: what should happen to the links when their tool is deleted? Look up `onDelete` in the Knex documentation.

**Endpoints**
- New: `POST /api/tools/:id/links` with body `{ title, url, type }`: saves the link and returns `201` with it. Returns `400` when the title is empty, when the url does not start with `http://` or `https://`, or when the type is not one of the allowed types. Returns `404` when the tool does not exist.
- New: `GET /api/tools/:id/links`: returns the links of one tool. Returns `404` when the tool does not exist.
- New: `DELETE /api/links/:id`: removes one link, `404` when it does not exist.
- Check the existing `DELETE /api/tools/:id`: deleting a tool that has links must still work.

**Frontend**
- Make a `ToolLink` class in `public/`, like the `Tool` class, with a `renderHtmlString()` that renders one link.
- Add an **Info** button to every tool. It shows the links of that tool, split in manuals and tutorials, and a small form to add a link (title, url and a `<select>` for the type).
- Links open in a new tab. Add `rel="noopener noreferrer"` to them. Think about it: why?
- Every link has a **Remove** button.

**Acceptance criteria**
- [ ] A manual and a tutorial can be added to a tool and are shown under the right heading.
- [ ] One tool can have multiple links.
- [ ] A link opens in a new tab.
- [ ] A url like `javascript:alert(1)` returns `400`. So does a type that is not allowed, or an empty title.
- [ ] Adding a link to a tool that does not exist returns `404`.
- [ ] A title like `<b>Quest 3</b>` is shown as plain text, not as bold.
- [ ] Removing a link works and the link is gone after refreshing the page.
- [ ] Deleting a tool that has links works, and its links are gone too.

---

## ML-7 · Coordinator page: cancel lendings

**Branch:** `feature/ml-7-coordinator-lendings`

**Story:** As a coordinator, I want a page with everything that is lent out right now, where I can cancel a lending with a reason, so I can handle problems (a tool that never comes back, a tool lent to the wrong student, ...) and still see afterwards what happened.

**Migration**
- Add a `lentAt` text column to `tools`. It is empty while the tool is available.
- In a separate migration, create a new `lending_cancellations` table with: `id`, `toolId` (foreign key to `tools.id`), `studentId` (foreign key to `students.id`), `reason` (required) and `canceledAt` (required).
- A canceled lending is **not forgotten**: it is stored in `lending_cancellations`, so there is a record of what happened and why.
- Think about it: deleting a tool that has cancellations must still work. Look up `onDelete` in the Knex documentation.

**Endpoints**
- Change `POST /api/tools/:id/lend`: it also fills in `lentAt` (`new Date().toISOString()`). Change `POST /api/tools/:id/return`: it empties `lentAt` again.
- New: `GET /api/lendings`: returns all tools that are lent out right now, with the `name` of the tool, the `firstName` of the student and `lentAt`, oldest first. Tip: `join`, and select your columns one by one, because `tools` and `students` both have an `id`.
- New: `POST /api/tools/:id/cancel-lending` with body `{ reason }`: makes the tool available again and stores a row in `lending_cancellations` with the student who had the tool. Returns `400` when the reason is empty, `404` when the tool does not exist and `409` when the tool is not lent out. Tip: both changes belong together, so look up `db.transaction` in the Knex documentation.
- There is no login yet, so everyone who knows the URL can use these endpoints. Never return student numbers: they are part of how students identify themselves. Think about it: what must be added before this goes live?

**Frontend**
- Make a `Lending` class in `public/`, like the `Tool` class, with a `renderHtmlString()` that renders one row of a table.
- Add a new page `public/coordinator.html` with its own script `public/coordinator.ts`, and link to it from `index.html` (and back).
- The page shows a table of everything that is lent out: tool, first name and lent since.
- Every row has a **Cancel** button. It asks for a reason (required) and then cancels the lending. The row disappears, and the tool is available again on the front page.

**Acceptance criteria**
- [ ] The page only shows tools that are lent out right now, and no student numbers.
- [ ] Canceling with a reason removes the row, the tool is available again, and `lending_cancellations` has a new row with the tool, the student, the reason and the date.
- [ ] Canceling without a reason returns `400`, and the page shows a message.
- [ ] Canceling a tool that is not lent out returns `409`, and one that does not exist returns `404`.
- [ ] `lentAt` is filled in when a tool is lent out and empty again after it is returned.
- [ ] Deleting a tool that has cancellations works.

---

## ML-8 · Reservations

**Branch:** `feature/ml-8-reservations`

**Story:** As a student, I want to reserve a tool for a period in the future, so it is there when I need it.

Reservations do not influence lending in this ticket: only the reservations themselves are stored and shown.

**Migration**
- Create a new `reservations` table with: `id`, `toolId` (foreign key to `tools.id`), `studentId` (foreign key to `students.id`), `startDate` and `endDate` (both required, text in the format `YYYY-MM-DD`).
- Think about it: deleting a tool that has reservations must still work. Look up `onDelete` in the Knex documentation.

**Endpoints**
- New: `POST /api/tools/:id/reservations` with body `{ studentNumber, firstName, startDate, endDate }`. The student is checked the same way as when lending a tool (`401` when the number and first name do not match). Returns `201` with the new reservation.
  - `400` when a date is missing or is not a valid `YYYY-MM-DD` date, when `startDate` is in the past, or when `endDate` is before `startDate`.
  - `404` when the tool does not exist.
  - `409` when the tool is already reserved on one of those days. Reservations that share a day count as overlapping. Tip: dates in this format can be compared as text.
- New: `GET /api/tools/:id/reservations`: returns the upcoming reservations of one tool (`endDate` is today or later), earliest first, with `firstName`, `startDate` and `endDate`. Never return student numbers. Returns `404` when the tool does not exist.

**Frontend**
- Make a `Reservation` class in `public/`, like the `Tool` class, with a `renderHtmlString()` that renders one reservation.
- Add a **Reserve** button to every tool. It shows the upcoming reservations of that tool (first name, from, until) and a small form with two date inputs. The student number and first name come from the "Who are you?" inputs at the top of the page.
- Show the message of the API when something goes wrong (not recognized, overlapping, invalid dates).

**Acceptance criteria**
- [ ] A reservation for next week is saved and shows up in the list of the tool.
- [ ] A second reservation that overlaps the first one returns `409`.
- [ ] A reservation that starts on the day another one ends returns `409`.
- [ ] A reservation right after the end of another one works.
- [ ] An end date before the start date, a start date in the past, or a date like `2026-13-45` returns `400`.
- [ ] A wrong first name for the student number returns `401`.
- [ ] A tool that does not exist returns `404`.
- [ ] No response contains student numbers.
- [ ] Deleting a tool that has reservations works, and its reservations are gone too.
