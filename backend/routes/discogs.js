const express = require("express");
const https = require("https");
const pool = require("../config/db");
const { authMiddleware } = require("../middleware/auth");
const router = express.Router();

const UA = "VinylVault/1.0";
function discogsGet(path) {
  let url = path.startsWith("http") ? path : `https://api.discogs.com${path}`;
  // Add token if available
  const token = process.env.DISCOGS_TOKEN;
  if (token) {
    url += (url.includes("?") ? "&" : "?") + `token=${token}`;
  }
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": UA } }, (res) => {
      let d = ""; res.on("data", (c) => (d += c));
      res.on("end", () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } });
    }).on("error", reject);
  });
}

// Search Discogs
router.get("/search", async (req, res) => {
  try {
    const { q, type = "release", genre, style, year, format, country, page = 1, per_page = 25 } = req.query;
    let qs = `?q=${encodeURIComponent(q || "")}&type=${type}&page=${page}&per_page=${per_page}`;
    if (genre) qs += `&genre=${encodeURIComponent(genre)}`;
    if (style) qs += `&style=${encodeURIComponent(style)}`;
    if (year) qs += `&year=${encodeURIComponent(year)}`;
    if (format) qs += `&format=${encodeURIComponent(format)}`;
    if (country) qs += `&country=${encodeURIComponent(country)}`;
    const data = await discogsGet(`/database/search${qs}`);
    res.json({ results: (data.results || []).map(r => ({
      id: r.id, type: r.type, title: r.title, year: r.year, country: r.country,
      format: r.format, label: r.label, genre: r.genre, style: r.style,
      thumb: r.thumb, cover_image: r.cover_image, community: r.community,
    })), pagination: data.pagination || {} });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Release details
router.get("/release/:id", async (req, res) => {
  try {
    const d = await discogsGet(`/releases/${req.params.id}`);
    res.json({
      id: d.id, title: d.title, year: d.year, country: d.country, notes: d.notes,
      discogs_url: `https://www.discogs.com/release/${d.id}`,
      artists: (d.artists || []).map(a => ({ id: a.id, name: a.name })),
      labels: (d.labels || []).map(l => ({ id: l.id, name: l.name, catno: l.catno })),
      formats: (d.formats || []).map(f => ({ name: f.name, qty: f.qty, descriptions: f.descriptions })),
      genres: d.genres || [], styles: d.styles || [],
      tracklist: (d.tracklist || []).map(t => ({ position: t.position, title: t.title, duration: t.duration, type: t.type_ })),
      images: (d.images || []).map(i => ({ type: i.type, uri: i.uri, uri150: i.uri150 })),
      thumb: d.thumb,
      community: { have: d.community?.have || 0, want: d.community?.want || 0,
        rating: { average: d.community?.rating?.average || 0, count: d.community?.rating?.count || 0 } },
      num_for_sale: d.num_for_sale || 0, lowest_price: d.lowest_price || null,
      extraartists: (d.extraartists || []).map(e => ({ name: e.name, role: e.role })),
      identifiers: d.identifiers || [],
      videos: (d.videos || []).map(v => ({ title: v.title, uri: v.uri, duration: v.duration })),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Master release
router.get("/master/:id", async (req, res) => {
  try { const d = await discogsGet(`/masters/${req.params.id}`); res.json(d); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
router.get("/master/:id/versions", async (req, res) => {
  try {
    const { page = 1, per_page = 25 } = req.query;
    const d = await discogsGet(`/masters/${req.params.id}/versions?page=${page}&per_page=${per_page}`);
    res.json({ versions: d.versions || [], pagination: d.pagination || {} });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Artist
router.get("/artist/:id", async (req, res) => {
  try {
    const d = await discogsGet(`/artists/${req.params.id}`);
    res.json({ id: d.id, name: d.name, real_name: d.realname, profile: d.profile, urls: d.urls,
      images: (d.images || []).map(i => ({ type: i.type, uri: i.uri, uri150: i.uri150 })),
      members: d.members || [], groups: d.groups || [] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.get("/artist/:id/releases", async (req, res) => {
  try {
    const { page = 1, per_page = 25, sort = "year", sort_order = "asc" } = req.query;
    const d = await discogsGet(`/artists/${req.params.id}/releases?page=${page}&per_page=${per_page}&sort=${sort}&sort_order=${sort_order}`);
    res.json({ releases: d.releases || [], pagination: d.pagination || {} });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Label
router.get("/label/:id", async (req, res) => {
  try {
    const d = await discogsGet(`/labels/${req.params.id}`);
    res.json({ id: d.id, name: d.name, profile: d.profile, urls: d.urls,
      images: (d.images || []).map(i => ({ type: i.type, uri: i.uri, uri150: i.uri150 })),
      sublabels: d.sublabels || [], parent_label: d.parent_label || null });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.get("/label/:id/releases", async (req, res) => {
  try {
    const { page = 1, per_page = 25 } = req.query;
    const d = await discogsGet(`/labels/${req.params.id}/releases?page=${page}&per_page=${per_page}`);
    res.json({ releases: d.releases || [], pagination: d.pagination || {} });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Marketplace pricing
router.get("/pricing/:id", async (req, res) => {
  try { const d = await discogsGet(`/marketplace/price_suggestions/${req.params.id}`); res.json(d); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// ============================================================
// IMPORT from Discogs → local DB + add to collection
// ============================================================

const GENRE_MAP = {
  "Rock": "Rock", "Jazz": "Jazz", "Hip Hop": "Hip-Hop", "Electronic": "Electronic",
  "Funk / Soul": "R&B/Soul", "Soul": "R&B/Soul", "Funk": "R&B/Soul",
  "Classical": "Classical", "Pop": "Pop", "Blues": "Blues", "Country": "Country",
  "Punk": "Punk", "Metal": "Metal", "Reggae": "Reggae",
  "Folk, World, & Country": "Folk", "Latin": "Latin", "Stage & Screen": "Soundtrack",
};

router.post("/import/:discogsId", authMiddleware, async (req, res) => {
  try {
    const discogsId = req.params.discogsId;
    const { condition_id, purchase_price, current_value, notes: userNotes } = req.body;

    // Check if already in DB
    const [existing] = await pool.query("SELECT record_id FROM records WHERE discogs_id = ?", [discogsId]);
    let recordId;

    if (existing.length > 0) {
      recordId = existing[0].record_id;
    } else {
      // Fetch from Discogs
      const d = await discogsGet(`/releases/${discogsId}`);
      const artistName = d.artists?.[0]?.name || "Unknown Artist";
      const labelName = d.labels?.[0]?.name || null;
      const catNo = d.labels?.[0]?.catno || null;
      const coverImage = d.images?.[0]?.uri || d.thumb || null;
      const thumbImage = d.thumb || d.images?.[0]?.uri150 || null;

      // Determine format
      let format = "LP";
      if (d.formats?.length > 0) {
        const desc = d.formats.map(f => ((f.descriptions || []).join(" ") + " " + (f.name || "")).toLowerCase()).join(" ");
        if (desc.includes("box set")) format = "Box Set";
        else if (desc.includes("2xlp") || desc.includes("double")) format = "2xLP";
        else if (desc.includes("single") || desc.includes('7"')) format = '7" Single';
        else if (desc.includes("ep") || desc.includes('10"')) format = "EP";
        else if (desc.includes('12"')) format = '12"';
        else format = d.formats[0].name || "LP";
      }

      const [result] = await pool.query(
        `INSERT INTO records (title, artist_name, artist_discogs_id, label_name, label_discogs_id,
          release_year, catalog_number, format, country, notes, discogs_id, discogs_url,
          cover_image, thumb_image, community_have, community_want, community_rating,
          lowest_price, num_for_sale) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [d.title || "Untitled", artistName.substring(0, 200),
          d.artists?.[0]?.id ? String(d.artists[0].id) : null,
          labelName ? labelName.substring(0, 200) : null,
          d.labels?.[0]?.id ? String(d.labels[0].id) : null,
          d.year || null, catNo ? catNo.substring(0, 50) : null,
          format, d.country || null, d.notes ? d.notes.substring(0, 2000) : null,
          String(discogsId), `https://www.discogs.com/release/${discogsId}`,
          coverImage, thumbImage,
          d.community?.have || 0, d.community?.want || 0,
          d.community?.rating?.average || null,
          d.lowest_price || null, d.num_for_sale || 0]
      );
      recordId = result.insertId;

      // Tracklist
      if (d.tracklist?.length > 0) {
        for (let i = 0; i < d.tracklist.length; i++) {
          const t = d.tracklist[i];
          if (t.type_ === "track") {
            await pool.query("INSERT INTO tracklists (record_id, position, title, duration, sort_order) VALUES (?,?,?,?,?)",
              [recordId, t.position, (t.title || "").substring(0, 300), t.duration || null, i]);
          }
        }
      }

      // Genres
      if (d.genres) {
        for (const g of d.genres) {
          const mapped = GENRE_MAP[g];
          if (mapped) {
            const [gr] = await pool.query("SELECT genre_id FROM genres WHERE name = ?", [mapped]);
            if (gr.length > 0) await pool.query("INSERT IGNORE INTO record_genres (record_id, genre_id) VALUES (?,?)", [recordId, gr[0].genre_id]);
          }
        }
      }
    }

    // Add to collection if condition provided
    if (condition_id) {
      try {
        const [ci] = await pool.query(
          `INSERT INTO collection_items (user_id, record_id, condition_id, purchase_price, current_value, notes)
           VALUES (?,?,?,?,?,?)`,
          [req.user.user_id, recordId, condition_id, purchase_price || null, current_value || null, userNotes || null]);
        return res.status(201).json({ record_id: recordId, item_id: ci.insertId, message: "Imported and added to collection!" });
      } catch (err) {
        if (err.code === "ER_DUP_ENTRY") return res.json({ record_id: recordId, message: "Already in your collection." });
        throw err;
      }
    }

    res.status(201).json({ record_id: recordId, message: "Imported to VinylVault!" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get tracklist for a local record
router.get("/tracklist/:recordId", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM tracklists WHERE record_id = ? ORDER BY sort_order", [req.params.recordId]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
