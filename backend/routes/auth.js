const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const { authMiddleware } = require("../middleware/auth");
const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { username, email, password, display_name } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: "All fields required." });
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query("INSERT INTO users (username, email, password_hash, display_name) VALUES (?, ?, ?, ?)",
      [username, email, hash, display_name || null]);
    const token = jwt.sign({ user_id: result.insertId, username }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ token, user: { user_id: result.insertId, username, email, display_name } });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "Username or email already exists." });
    res.status(500).json({ error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const [rows] = await pool.query("SELECT * FROM users WHERE username = ?", [username]);
    if (rows.length === 0) return res.status(401).json({ error: "Invalid credentials." });
    const valid = await bcrypt.compare(password, rows[0].password_hash);
    if (!valid) return res.status(401).json({ error: "Invalid credentials." });
    const token = jwt.sign({ user_id: rows[0].user_id, username }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { user_id: rows[0].user_id, username, email: rows[0].email, display_name: rows[0].display_name } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT user_id, username, email, display_name, bio, created_at FROM users WHERE user_id = ?", [req.user.user_id]);
    if (rows.length === 0) return res.status(404).json({ error: "User not found." });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
