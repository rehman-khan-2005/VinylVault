const express = require("express");
const pool = require("../config/db");
const { authMiddleware } = require("../middleware/auth");
const router = express.Router();
router.use(authMiddleware);

// GET collection
router.get("/", async (req, res) => {
  try {
    const { sort = "added_desc" } = req.query;
    let order = "ORDER BY ci.added_at DESC";
    if (sort === "value_desc") order = "ORDER BY ci.current_value DESC";
    else if (sort === "value_asc") order = "ORDER BY ci.current_value ASC";
    else if (sort === "title") order = "ORDER BY r.title ASC";
    else if (sort === "artist") order = "ORDER BY r.artist_name ASC";
    else if (sort === "year") order = "ORDER BY r.release_year DESC";
    const [rows] = await pool.query(
      `SELECT ci.*, r.title, r.artist_name, r.release_year, r.format, r.label_name,
       r.thumb_image, r.cover_image, r.discogs_url, r.discogs_id,
       r.community_have, r.community_want, r.lowest_price,
       ct.name AS condition_name, ct.abbreviation AS condition_abbr,
       GROUP_CONCAT(DISTINCT g.name ORDER BY g.name SEPARATOR ', ') AS genres
       FROM collection_items ci JOIN records r ON ci.record_id = r.record_id
       JOIN condition_types ct ON ci.condition_id = ct.condition_id
       LEFT JOIN record_genres rg ON r.record_id = rg.record_id
       LEFT JOIN genres g ON rg.genre_id = g.genre_id
       WHERE ci.user_id = ? GROUP BY ci.item_id ${order}`, [req.user.user_id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Add to collection (record must already exist in DB — imported via discogs)
router.post("/", async (req, res) => {
  try {
    const { record_id, condition_id, purchase_price, current_value, purchase_date, notes } = req.body;
    if (!record_id || !condition_id) return res.status(400).json({ error: "record_id and condition_id required." });
    const [result] = await pool.query(
      `INSERT INTO collection_items (user_id, record_id, condition_id, purchase_price, current_value, purchase_date, notes)
       VALUES (?,?,?,?,?,?,?)`,
      [req.user.user_id, record_id, condition_id, purchase_price || null, current_value || null, purchase_date || null, notes || null]);
    res.status(201).json({ item_id: result.insertId, message: "Added to collection." });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "Already in your collection." });
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { condition_id, purchase_price, current_value, purchase_date, notes } = req.body;
    const [result] = await pool.query(
      `UPDATE collection_items SET condition_id=?, purchase_price=?, current_value=?, purchase_date=?, notes=? WHERE item_id=? AND user_id=?`,
      [condition_id, purchase_price || null, current_value || null, purchase_date || null, notes || null, req.params.id, req.user.user_id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Not found." });
    res.json({ message: "Updated." });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete("/:id", async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM collection_items WHERE item_id = ? AND user_id = ?", [req.params.id, req.user.user_id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Not found." });
    res.json({ message: "Removed." });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Wishlist — can add directly from Discogs without importing
router.get("/wishlist", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT w.*, r.title AS record_title, r.artist_name AS record_artist, r.thumb_image AS record_thumb
       FROM wishlists w LEFT JOIN records r ON w.record_id = r.record_id
       WHERE w.user_id = ? ORDER BY FIELD(w.priority, 'High','Medium','Low'), w.added_at DESC`, [req.user.user_id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/wishlist", async (req, res) => {
  try {
    const { record_id, discogs_id, title, artist_name, thumb_image, priority, max_price } = req.body;
    const [result] = await pool.query(
      "INSERT INTO wishlists (user_id, record_id, discogs_id, title, artist_name, thumb_image, priority, max_price) VALUES (?,?,?,?,?,?,?,?)",
      [req.user.user_id, record_id || null, discogs_id || null, title || null, artist_name || null, thumb_image || null, priority || "Medium", max_price || null]);
    res.status(201).json({ wishlist_id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete("/wishlist/:id", async (req, res) => {
  try { await pool.query("DELETE FROM wishlists WHERE wishlist_id = ? AND user_id = ?", [req.params.id, req.user.user_id]); res.json({ message: "Removed." }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
