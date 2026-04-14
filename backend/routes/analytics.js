const express = require("express");
const pool = require("../config/db");
const { authMiddleware } = require("../middleware/auth");
const router = express.Router();
router.use(authMiddleware);

router.get("/summary", async (req, res) => {
  try { const [rows] = await pool.query("SELECT * FROM v_collection_summary WHERE user_id = ?", [req.user.user_id]);
    res.json(rows[0] || { total_records: 0, total_value: 0, total_invested: 0, total_gain: 0 });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/genres", async (req, res) => {
  try { const [rows] = await pool.query("SELECT * FROM v_genre_distribution WHERE user_id = ? ORDER BY record_count DESC", [req.user.user_id]); res.json(rows); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/top-valuable", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ci.item_id, r.title, r.artist_name, r.release_year, r.thumb_image,
       ci.purchase_price, ci.current_value, (ci.current_value - ci.purchase_price) AS gain,
       ct.abbreviation AS condition_abbr
       FROM collection_items ci JOIN records r ON ci.record_id = r.record_id
       JOIN condition_types ct ON ci.condition_id = ct.condition_id
       WHERE ci.user_id = ? AND ci.current_value IS NOT NULL
       ORDER BY ci.current_value DESC LIMIT ?`, [req.user.user_id, parseInt(req.query.limit) || 10]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/decades", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT CONCAT(FLOOR(r.release_year / 10) * 10, 's') AS decade, COUNT(*) AS count,
       COALESCE(SUM(ci.current_value), 0) AS total_value
       FROM collection_items ci JOIN records r ON ci.record_id = r.record_id
       WHERE ci.user_id = ? AND r.release_year IS NOT NULL
       GROUP BY FLOOR(r.release_year / 10) ORDER BY FLOOR(r.release_year / 10)`, [req.user.user_id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/conditions", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ct.name AS condition_name, ct.abbreviation, COUNT(*) AS count
       FROM collection_items ci JOIN condition_types ct ON ci.condition_id = ct.condition_id
       WHERE ci.user_id = ? GROUP BY ct.condition_id ORDER BY ct.sort_order`, [req.user.user_id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
