const { pool } = require("../config/db");

class Application {
  /**
   * Find all applications with optional status filter, sorting, and pagination
   */
  static async findAll({ status, sort, page, limit } = {}) {
    let sql = "SELECT * FROM applications";
    const params = [];

    if (status) {
      sql += " WHERE status = ?";
      params.push(status);
    }

    if (sort === "date") {
      sql += " ORDER BY appliedDate ASC";
    } else {
      sql += " ORDER BY id ASC";
    }

    if (page && limit) {
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const offset = (pageNum - 1) * limitNum;
      sql += " LIMIT ? OFFSET ?";
      params.push(limitNum, offset);
    }

    const [rows] = await pool.query(sql, params);
    return rows;
  }

  /**
   * Find a single application by its primary key ID
   */
  static async findById(id) {
    const [rows] = await pool.query("SELECT * FROM applications WHERE id = ?", [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Aggregate application counts grouped by status
   */
  static async getStats() {
    const [rows] = await pool.query(
      "SELECT status, COUNT(*) as count FROM applications GROUP BY status"
    );

    const byStatus = {};
    let total = 0;
    for (const row of rows) {
      byStatus[row.status] = Number(row.count);
      total += Number(row.count);
    }

    return { total, byStatus };
  }

  /**
   * Create a new job application record
   */
  static async create({ company, role, status = "applied" }) {
    const [result] = await pool.query(
      "INSERT INTO applications (company, role, status) VALUES (?, ?, ?)",
      [company, role, status]
    );

    return this.findById(result.insertId);
  }

  /**
   * Partially or fully update an existing application
   */
  static async update(id, updates = {}) {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    const fields = [];
    const params = [];

    if (updates.company !== undefined) {
      fields.push("company = ?");
      params.push(updates.company);
    }
    if (updates.role !== undefined) {
      fields.push("role = ?");
      params.push(updates.role);
    }
    if (updates.status !== undefined) {
      fields.push("status = ?");
      params.push(updates.status);
    }

    if (fields.length > 0) {
      params.push(id);
      await pool.query(`UPDATE applications SET ${fields.join(", ")} WHERE id = ?`, params);
    }

    return this.findById(id);
  }

  /**
   * Delete an application by ID
   */
  static async delete(id) {
    const [result] = await pool.query("DELETE FROM applications WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }
}

module.exports = Application;
