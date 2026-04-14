const express = require("express");
const pool = require("../config/db");
const { authMiddleware, optionalAuth } = require("../middleware/auth");
const router = express.Router();

// Browse active listings
router.get("/", optionalAuth, async (req, res) => {
  try {
    const { status = "Active" } = req.query;
    const [rows] = await pool.query(
      `SELECT m.*, r.title, r.artist_name, r.release_year, r.format, r.thumb_image, r.discogs_url,
       ct.name AS condition_name, ct.abbreviation AS condition_abbr,
       seller.username AS seller_name, seller.display_name AS seller_display,
       buyer.username AS buyer_name
       FROM marketplace m
       JOIN collection_items ci ON m.item_id = ci.item_id
       JOIN records r ON ci.record_id = r.record_id
       JOIN condition_types ct ON ci.condition_id = ct.condition_id
       JOIN users seller ON m.seller_id = seller.user_id
       LEFT JOIN users buyer ON m.buyer_id = buyer.user_id
       WHERE m.status = ? ORDER BY m.created_at DESC`, [status]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create listing
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { item_id, asking_price, description } = req.body;
    const [items] = await pool.query("SELECT * FROM collection_items WHERE item_id = ? AND user_id = ?", [item_id, req.user.user_id]);
    if (items.length === 0) return res.status(403).json({ error: "You don't own this item." });
    const [result] = await pool.query("INSERT INTO marketplace (seller_id, item_id, asking_price, description) VALUES (?,?,?,?)",
      [req.user.user_id, item_id, asking_price, description || null]);
    res.status(201).json({ listing_id: result.insertId, message: "Listed for sale!" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Buy / express interest
router.put("/:id/buy", authMiddleware, async (req, res) => {
  try {
    const [listings] = await pool.query("SELECT * FROM marketplace WHERE listing_id = ?", [req.params.id]);
    if (listings.length === 0) return res.status(404).json({ error: "Not found." });
    if (listings[0].status !== "Active") return res.status(400).json({ error: "Not available." });
    if (listings[0].seller_id === req.user.user_id) return res.status(400).json({ error: "Can't buy your own." });
    await pool.query("UPDATE marketplace SET buyer_id = ?, status = 'Pending' WHERE listing_id = ?", [req.user.user_id, req.params.id]);
    res.json({ message: "Interest expressed. Seller will confirm." });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Complete sale
router.put("/:id/complete", authMiddleware, async (req, res) => {
  try {
    const [listings] = await pool.query("SELECT * FROM marketplace WHERE listing_id = ?", [req.params.id]);
    if (listings.length === 0) return res.status(404).json({ error: "Not found." });
    if (listings[0].seller_id !== req.user.user_id) return res.status(403).json({ error: "Only seller can complete." });
    await pool.query("UPDATE marketplace SET status = 'Sold', sold_at = NOW() WHERE listing_id = ?", [req.params.id]);
    if (listings[0].buyer_id) {
      await pool.query("UPDATE collection_items SET user_id = ? WHERE item_id = ?", [listings[0].buyer_id, listings[0].item_id]);
    }
    res.json({ message: "Sale completed. Record transferred." });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Cancel listing
router.put("/:id/cancel", authMiddleware, async (req, res) => {
  try {
    const [result] = await pool.query("UPDATE marketplace SET status = 'Cancelled' WHERE listing_id = ? AND seller_id = ?", [req.params.id, req.user.user_id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Not found." });
    res.json({ message: "Listing cancelled." });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
