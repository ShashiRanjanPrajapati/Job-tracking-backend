const fs = require("fs");
const path = require("path");
const { pool } = require("../config/db");

async function ensureMigrationTable(connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}

async function getExecutedMigrations(connection) {
  const [rows] = await connection.query("SELECT name FROM _migrations ORDER BY id ASC");
  return rows.map((r) => r.name);
}

function getMigrationFiles() {
  const migrationsDir = __dirname;
  return fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".js") && file !== "runner.js")
    .sort();
}

async function runUp() {
  const connection = await pool.getConnection();
  try {
    await ensureMigrationTable(connection);
    const executed = await getExecutedMigrations(connection);
    const allFiles = getMigrationFiles();
    const pending = allFiles.filter((file) => !executed.includes(file));

    if (pending.length === 0) {
      console.log(" Everything up to date. No pending migrations.");
      return;
    }

    console.log(` Running ${pending.length} pending migration(s)...`);

    for (const file of pending) {
      console.log(`\n Migrating: ${file}`);
      const migration = require(path.join(__dirname, file));
      if (typeof migration.up !== "function") {
        throw new Error(`Migration ${file} must export an 'up' function`);
      }

      await connection.beginTransaction();
      try {
        await migration.up(connection);
        await connection.query("INSERT INTO _migrations (name) VALUES (?)", [file]);
        await connection.commit();
        console.log(` Migrated:  ${file}`);
      } catch (err) {
        await connection.rollback();
        console.error(` Failed on: ${file}`);
        throw err;
      }
    }

    console.log("\n All migrations finished successfully!");
  } finally {
    connection.release();
  }
}

async function runDown() {
  const connection = await pool.getConnection();
  try {
    await ensureMigrationTable(connection);
    const [rows] = await connection.query("SELECT name FROM _migrations ORDER BY id DESC LIMIT 1");

    if (rows.length === 0) {
      console.log(" Nothing to rollback. No migrations have been recorded.");
      return;
    }

    const lastMigrationName = rows[0].name;
    const migrationPath = path.join(__dirname, lastMigrationName);

    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found on disk: ${lastMigrationName}`);
    }

    const migration = require(migrationPath);
    if (typeof migration.down !== "function") {
      throw new Error(`Migration ${lastMigrationName} must export a 'down' function`);
    }

    console.log(`\n Rolling back: ${lastMigrationName}`);
    await connection.beginTransaction();
    try {
      await migration.down(connection);
      await connection.query("DELETE FROM _migrations WHERE name = ?", [lastMigrationName]);
      await connection.commit();
      console.log(` Rolled back: ${lastMigrationName}`);
    } catch (err) {
      await connection.rollback();
      console.error(` Rollback failed for: ${lastMigrationName}`);
      throw err;
    }
  } finally {
    connection.release();
  }
}

async function runStatus() {
  const connection = await pool.getConnection();
  try {
    await ensureMigrationTable(connection);
    const executed = await getExecutedMigrations(connection);
    const allFiles = getMigrationFiles();

    console.log("\n--- Migration Status ---");
    for (const file of allFiles) {
      const isApplied = executed.includes(file);
      console.log(`${isApplied ? "[x] APPLIED" : "[ ] PENDING"} - ${file}`);
    }
    console.log("------------------------\n");
  } finally {
    connection.release();
  }
}

async function main() {
  const command = process.argv[2] || "up";

  try {
    if (command === "up") {
      await runUp();
    } else if (command === "down" || command === "rollback") {
      await runDown();
    } else if (command === "status") {
      await runStatus();
    } else {
      console.log("Unknown command. Usage: node migrations/runner.js [up|down|status]");
    }
  } catch (error) {
    console.error("\n❌ Migration error:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
