/**
 * Migration: 001_create_applications_table
 */

async function up(connection) {
  console.log("  -> Creating table 'applications'...");
  await connection.query(`
    CREATE TABLE IF NOT EXISTS applications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company VARCHAR(255) NOT NULL,
      role VARCHAR(255) NOT NULL,
      status VARCHAR(50) DEFAULT 'applied',
      appliedDate DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedDate DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}

async function down(connection) {
  console.log("  -> Dropping table 'applications'...");
  await connection.query("DROP TABLE IF EXISTS applications;");
}

module.exports = { up, down };
