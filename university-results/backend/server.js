const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'university_results',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// ─── ROUTES ───────────────────────────────────────────────────

// GET all universities
app.get('/api/universities', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM universities ORDER BY name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET results with optional filters
app.get('/api/results', async (req, res) => {
  try {
    const { university, semester, year } = req.query;
    let query = `
      SELECT r.id, s.reg_no, s.name AS student_name, u.name AS university,
             r.semester, sub.name AS subject, r.marks, r.grade, r.status, r.year
      FROM results r
      JOIN students s ON r.student_id = s.id
      JOIN universities u ON r.university_id = u.id
      JOIN subjects sub ON r.subject_id = sub.id
      WHERE 1=1
    `;
    const params = [];
    if (university) { query += ' AND r.university_id = ?'; params.push(university); }
    if (semester)   { query += ' AND r.semester = ?';      params.push(semester); }
    if (year)       { query += ' AND r.year = ?';          params.push(year); }
    query += ' ORDER BY s.name, r.semester LIMIT 200';

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET student result by registration number
app.get('/api/results/student/:regNo', async (req, res) => {
  try {
    const { regNo } = req.params;
    const [studentRows] = await pool.query(
      `SELECT s.*, u.name AS university_name, d.name AS department_name
       FROM students s
       JOIN universities u ON s.university_id = u.id
       JOIN departments d ON s.department_id = d.id
       WHERE s.reg_no = ?`, [regNo]
    );
    if (!studentRows.length) return res.status(404).json({ error: 'Student not found' });

    const student = studentRows[0];
    const [subjects] = await pool.query(
      `SELECT sub.code, sub.name, r.internal_marks AS internal,
              r.external_marks AS external, r.marks AS total, r.grade, r.status
       FROM results r
       JOIN subjects sub ON r.subject_id = sub.id
       WHERE r.student_id = ? ORDER BY sub.code`, [student.id]
    );

    const totalMarks = subjects.reduce((sum, s) => sum + s.total, 0);
    const maxMarks = subjects.length * 100;
    const percentage = ((totalMarks / maxMarks) * 100).toFixed(1);
    const cgpa = (percentage / 10).toFixed(1);
    const overallStatus = subjects.every(s => s.status === 'Pass') ? 'Pass' : 'Fail';

    res.json({
      name: student.name,
      reg_no: student.reg_no,
      university: student.university_name,
      department: student.department_name,
      semester: student.current_semester,
      year: student.admission_year,
      cgpa,
      subjects,
      total_marks: `${totalMarks}/${maxMarks}`,
      percentage,
      overall_status: overallStatus,
      rank: student.rank || 'N/A',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET summary stats
app.get('/api/stats', async (req, res) => {
  try {
    const [[{ total_universities }]] = await pool.query('SELECT COUNT(*) AS total_universities FROM universities');
    const [[{ total_students }]]    = await pool.query('SELECT COUNT(*) AS total_students FROM students');
    const [[{ total_results }]]     = await pool.query('SELECT COUNT(*) AS total_results FROM results');
    const [[{ pass_count }]]        = await pool.query("SELECT COUNT(*) AS pass_count FROM results WHERE status='Pass'");
    res.json({ total_universities, total_students, total_results, pass_rate: ((pass_count / total_results) * 100).toFixed(1) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date() }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
