const fs = require("fs");
const path = require("path");
const { pool } = require("../config/db");

async function seed() {
  const dataFilePath = path.join(__dirname, "../data.json");
  if (!fs.existsSync(dataFilePath)) {
    console.error("❌ data.json not found!");
    process.exit(1);
  }

  const raw = fs.readFileSync(dataFilePath, "utf-8");
  const { applications } = JSON.parse(raw);

  if (!applications || applications.length === 0) {
    console.log("⚠️ No applications to seed in data.json.");
    return;
  }

  const connection = await pool.getConnection();
  try {
    console.log(`\n🌱 Seeding ${applications.length} applications from data.json into MySQL...`);

    let insertedCount = 0;
    for (const app of applications) {
      const appliedDate = app.appliedDate
        ? new Date(app.appliedDate).toISOString().slice(0, 19).replace("T", " ")
        : new Date().toISOString().slice(0, 19).replace("T", " ");

      const updatedDate = app.updatedDate
        ? new Date(app.updatedDate).toISOString().slice(0, 19).replace("T", " ")
        : appliedDate;

      // Use INSERT ... ON DUPLICATE KEY UPDATE to make it safe to run multiple times
      await connection.query(
        `INSERT INTO applications (id, company, role, status, appliedDate, updatedDate)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           company = VALUES(company),
           role = VALUES(role),
           status = VALUES(status),
           appliedDate = VALUES(appliedDate),
           updatedDate = VALUES(updatedDate)`,
        [app.id, app.company, app.role, app.status, appliedDate, updatedDate]
      );
      insertedCount++;
    }

    console.log(`✅ Successfully seeded ${insertedCount} applications!\n`);
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    process.exit(1);
  } finally {
    connection.release();
    await pool.end();
  }
}

seed();
