import React, { useState, useEffect } from "react";
import * as api from "../services/api";

function Collection() {
  const [items, setItems] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("collection");
  const [sort, setSort] = useState("added_desc");

  const load = async () => { setLoading(true); try { const r = await api.getCollection({ sort }); setItems(r.data); } catch (e) { console.error(e); } setLoading(false); };
  const loadWish = async () => { try { const r = await api.getWishlist(); setWishlist(r.data); } catch (e) { console.error(e); } };
  useEffect(() => { load(); loadWish(); }, [sort]);

  const handleRemove = async (id) => { if (!window.confirm("Remove from collection?")) return; await api.removeFromCollection(id); load(); };
  const handleRemoveWish = async (id) => { await api.removeFromWishlist(id); loadWish(); };
  const handleList = async (itemId) => {
    const price = prompt("Asking price ($):");
    if (!price) return;
    try { await api.createListing({ item_id: itemId, asking_price: parseFloat(price) }); alert("Listed on marketplace!"); } catch (e) { alert(e.response?.data?.error || "Failed."); }
  };

  const totalValue = items.reduce((s, i) => s + (parseFloat(i.current_value) || 0), 0);
  const totalInvested = items.reduce((s, i) => s + (parseFloat(i.purchase_price) || 0), 0);

  return (
    <div>
      <div className="page-header">
        <h1>My Collection</h1>
        <p>{items.length} records · ${totalValue.toFixed(2)} total value · <a href="/" style={{ color: "#d4a843" }}>Search Discogs to add more</a></p>
      </div>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", borderBottom: "2px solid #e8e3da", paddingBottom: "0.5rem" }}>
        <button className={`btn ${tab === "collection" ? "btn-dark" : "btn-outline"}`} onClick={() => setTab("collection")}>Collection ({items.length})</button>
        <button className={`btn ${tab === "wishlist" ? "btn-dark" : "btn-outline"}`} onClick={() => setTab("wishlist")}>Wishlist ({wishlist.length})</button>
      </div>

      {tab === "collection" && (<>
        <div className="stats-row">
          <div className="card stat-card"><div className="stat-number">{items.length}</div><div className="stat-label">Records</div></div>
          <div className="card stat-card"><div className="stat-number">${totalValue.toFixed(0)}</div><div className="stat-label">Value</div></div>
          <div className="card stat-card"><div className="stat-number">${totalInvested.toFixed(0)}</div><div className="stat-label">Invested</div></div>
          <div className="card stat-card"><div className="stat-number" style={{ color: totalValue - totalInvested >= 0 ? "#27ae60" : "#c0392b" }}>{totalValue - totalInvested >= 0 ? "+" : ""}${(totalValue - totalInvested).toFixed(0)}</div><div className="stat-label">Gain/Loss</div></div>
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <select value={sort} onChange={e => setSort(e.target.value)} style={{ padding: "0.5rem", borderRadius: "8px", border: "1.5px solid #e8e3da" }}>
            <option value="added_desc">Recently Added</option><option value="value_desc">Highest Value</option><option value="value_asc">Lowest Value</option>
            <option value="title">Title A–Z</option><option value="artist">Artist A–Z</option><option value="year">Year</option>
          </select>
        </div>

        {loading ? <div className="loading">Loading...</div> : items.length === 0 ? (
          <div className="empty-state"><h3>Your collection is empty</h3><p>Go to Search Discogs to find and add records!</p></div>
        ) : (
          <div className="card-grid">{items.map(item => (
            <div key={item.item_id} className="card record-card">
              <div style={{ display: "flex", gap: "1rem" }}>
                {item.thumb_image ? <img src={item.thumb_image} alt="" style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "4px", flexShrink: 0 }} /> :
                  <div style={{ width: "60px", height: "60px", background: "#e8e3da", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", color: "#9e9a93", flexShrink: 0 }}>◉</div>}
                <div style={{ minWidth: 0 }}>
                  <div className="artist">{item.artist_name}</div>
                  <div className="title">{item.title}</div>
                  <div className="meta">{item.release_year} · {item.format}{item.label_name && ` · ${item.label_name}`}</div>
                </div>
              </div>
              {item.genres && <div className="genres" style={{ marginTop: "0.4rem" }}>{item.genres.split(", ").map(g => <span key={g} className="tag">{g}</span>)}</div>}
              <div className="value" style={{ marginTop: "0.6rem" }}>
                <span className="condition-badge">{item.condition_abbr}</span>
                <div style={{ textAlign: "right" }}>
                  <div className="value-amount">${parseFloat(item.current_value || 0).toFixed(2)}</div>
                  {item.purchase_price && <div style={{ fontSize: "0.75rem", color: "#9e9a93" }}>Paid ${parseFloat(item.purchase_price).toFixed(2)}</div>}
                </div>
              </div>
              {item.notes && <div style={{ marginTop: "0.4rem", fontSize: "0.8rem", color: "#6b6b6b", fontStyle: "italic" }}>{item.notes}</div>}
              <div style={{ marginTop: "0.6rem", display: "flex", gap: "0.5rem" }}>
                <button className="btn btn-sm btn-gold" onClick={() => handleList(item.item_id)}>Sell</button>
                {item.discogs_url && <a href={item.discogs_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline">Discogs</a>}
                <button className="btn btn-sm btn-danger" onClick={() => handleRemove(item.item_id)}>Remove</button>
              </div>
            </div>
          ))}</div>
        )}
      </>)}

      {tab === "wishlist" && (wishlist.length === 0 ? (
        <div className="empty-state"><h3>Your wishlist is empty</h3><p>Search Discogs and click "+ Wishlist" on any release.</p></div>
      ) : (
        <div className="card-grid">{wishlist.map(w => (
          <div key={w.wishlist_id} className="card record-card">
            <div style={{ display: "flex", gap: "1rem" }}>
              {(w.record_thumb || w.thumb_image) ? <img src={w.record_thumb || w.thumb_image} alt="" style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "4px" }} /> :
                <div style={{ width: "50px", height: "50px", background: "#e8e3da", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", color: "#9e9a93" }}>◉</div>}
              <div>
                <div className="title" style={{ fontSize: "0.95rem" }}>{w.record_title || w.title}</div>
                <div className="meta">{w.record_artist || w.artist_name}</div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem" }}>
              <span className={`tag ${w.priority === "High" ? "tag-gold" : ""}`}>{w.priority}</span>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                {w.max_price && <span style={{ fontSize: "0.8rem", color: "#6b6b6b" }}>Max ${parseFloat(w.max_price).toFixed(0)}</span>}
                <button className="btn btn-sm btn-danger" onClick={() => handleRemoveWish(w.wishlist_id)}>Remove</button>
              </div>
            </div>
          </div>
        ))}</div>
      ))}
    </div>
  );
}
export default Collection;
