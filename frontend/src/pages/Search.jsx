import React, { useState } from "react";
import { useAuth } from "../App";
import * as api from "../services/api";

function ReleaseModal({ discogsId, onClose }) {
  const { user } = useAuth();
  const [release, setRelease] = useState(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ condition_id: "2", purchase_price: "", current_value: "", notes: "" });

  React.useEffect(() => {
    api.discogsRelease(discogsId).then(r => { setRelease(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, [discogsId]);

  const handleImport = async (addToCollection = false) => {
    setImporting(true);
    try {
      const data = addToCollection ? {
        condition_id: parseInt(form.condition_id),
        purchase_price: form.purchase_price ? parseFloat(form.purchase_price) : null,
        current_value: form.current_value ? parseFloat(form.current_value) : null,
        notes: form.notes || null,
      } : {};
      const res = await api.discogsImport(discogsId, data);
      setImported(res.data);
      setShowAddForm(false);
    } catch (err) { alert(err.response?.data?.error || "Import failed."); }
    setImporting(false);
  };

  if (loading) return <div className="modal-overlay" onClick={onClose}><div className="modal"><div className="loading">Loading...</div></div></div>;
  if (!release) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: "700px" }}>
        {/* Header */}
        <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1.5rem" }}>
          {(release.images?.[0]?.uri || release.images?.[0]?.uri150 || release.thumb) && (
            <img src={release.images?.[0]?.uri || release.images?.[0]?.uri150 || release.thumb} alt="" style={{ width: "150px", height: "150px", objectFit: "cover", borderRadius: "8px", flexShrink: 0 }} />
          )}
          <div>
            <h2 style={{ fontSize: "1.3rem", marginBottom: "0.3rem" }}>{release.title}</h2>
            <div style={{ color: "#e07a4f", fontWeight: 600, marginBottom: "0.5rem" }}>{release.artists?.map(a => a.name).join(", ")}</div>
            <div style={{ fontSize: "0.85rem", color: "#6b6b6b" }}>
              {release.year && <span>{release.year} · </span>}{release.labels?.[0]?.name && <span>{release.labels[0].name} · </span>}
              {release.labels?.[0]?.catno && <span>{release.labels[0].catno} · </span>}{release.country}
            </div>
            <div style={{ display: "flex", gap: "0.3rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
              {release.genres?.map(g => <span key={g} className="tag">{g}</span>)}
              {release.styles?.map(s => <span key={s} className="tag tag-gold">{s}</span>)}
            </div>
            {release.formats?.length > 0 && (
              <div style={{ fontSize: "0.8rem", color: "#6b6b6b", marginTop: "0.4rem" }}>
                {release.formats.map(f => [f.qty > 1 ? `${f.qty}x` : "", f.name, ...(f.descriptions || [])].filter(Boolean).join(" ")).join(", ")}
              </div>
            )}
          </div>
        </div>

        {/* All Photos */}
        {release.images?.length > 1 && (
          <div style={{ marginBottom: "1.2rem" }}>
            <h3 style={{ fontSize: "0.95rem", marginBottom: "0.5rem" }}>Photos ({release.images.length})</h3>
            <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
              {release.images.map((img, i) => (
                <img key={i} src={img.uri150 || img.uri} alt={`${release.title} - image ${i + 1}`}
                  style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "6px", flexShrink: 0, cursor: "pointer", border: "2px solid #e8e3da" }}
                  onClick={() => window.open(img.uri, "_blank")} title={`${img.type} — click to view full size`} />
              ))}
            </div>
          </div>
        )}

        {/* Community Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.6rem", marginBottom: "1.2rem" }}>
          {[
            { val: release.community?.have || 0, label: "Have", color: "#d4a843" },
            { val: release.community?.want || 0, label: "Want", color: "#e07a4f" },
            { val: release.community?.rating?.average ? release.community.rating.average.toFixed(1) : "—", label: `Rating (${release.community?.rating?.count || 0})`, color: "#1a1a2e" },
            { val: release.lowest_price ? `$${release.lowest_price}` : "—", label: `${release.num_for_sale || 0} for sale`, color: "#27ae60" },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center", padding: "0.7rem", background: "#faf8f4", borderRadius: "6px" }}>
              <div style={{ fontSize: "1.2rem", fontWeight: 700, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: "0.7rem", color: "#9e9a93" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tracklist */}
        {release.tracklist?.filter(t => t.type === "track").length > 0 && (
          <div style={{ marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "0.95rem", marginBottom: "0.5rem" }}>Tracklist</h3>
            <div style={{ background: "#faf8f4", borderRadius: "8px", padding: "0.3rem" }}>
              {release.tracklist.filter(t => t.type === "track").map((t, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "0.35rem 0.6rem", borderBottom: "1px solid #e8e3da", fontSize: "0.85rem" }}>
                  <div><span style={{ color: "#9e9a93", marginRight: "0.8rem", minWidth: "28px", display: "inline-block" }}>{t.position}</span>{t.title}</div>
                  <span style={{ color: "#9e9a93", flexShrink: 0 }}>{t.duration}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Credits */}
        {release.extraartists?.length > 0 && (
          <div style={{ marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "0.95rem", marginBottom: "0.3rem" }}>Credits</h3>
            <div style={{ fontSize: "0.8rem", color: "#6b6b6b" }}>
              {release.extraartists.slice(0, 8).map((e, i) => <div key={i}><strong>{e.name}</strong> — {e.role}</div>)}
              {release.extraartists.length > 8 && <div style={{ color: "#9e9a93" }}>+{release.extraartists.length - 8} more</div>}
            </div>
          </div>
        )}

        {/* Videos */}
        {release.videos?.length > 0 && (
          <div style={{ marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "0.95rem", marginBottom: "0.3rem" }}>Videos</h3>
            {release.videos.slice(0, 3).map((v, i) => (
              <a key={i} href={v.uri} target="_blank" rel="noreferrer" style={{ display: "block", fontSize: "0.85rem", color: "#d4a843", marginBottom: "0.2rem" }}>{v.title}</a>
            ))}
          </div>
        )}

        {/* Add to Collection Form */}
        {user && showAddForm && !imported && (
          <div style={{ background: "#faf8f4", borderRadius: "8px", padding: "1rem", marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "0.95rem", marginBottom: "0.8rem" }}>Add to Your Collection</h3>
            <div className="form-group">
              <label>Condition</label>
              <select value={form.condition_id} onChange={e => setForm({ ...form, condition_id: e.target.value })}>
                <option value="1">Mint (M)</option><option value="2">Near Mint (NM)</option><option value="3">Very Good Plus (VG+)</option>
                <option value="4">Very Good (VG)</option><option value="5">Good Plus (G+)</option><option value="6">Good (G)</option>
                <option value="7">Fair (F)</option><option value="8">Poor (P)</option>
              </select>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Purchase Price ($)</label><input type="number" step="0.01" value={form.purchase_price} onChange={e => setForm({ ...form, purchase_price: e.target.value })} /></div>
              <div className="form-group"><label>Current Value ($)</label><input type="number" step="0.01" value={form.current_value} onChange={e => setForm({ ...form, current_value: e.target.value })} /></div>
            </div>
            <div className="form-group"><label>Notes</label><input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Pressing details, sleeve condition..." /></div>
            <button className="btn btn-gold" onClick={() => handleImport(true)} disabled={importing}>{importing ? "Adding..." : "Add to Collection"}</button>
          </div>
        )}

        {/* Actions */}
        <div className="modal-actions">
          <a href={release.discogs_url} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ fontSize: "0.8rem" }}>View on Discogs</a>
          <button className="btn btn-outline" onClick={onClose}>Close</button>
          {user && !imported && !showAddForm && (
            <>
              <button className="btn btn-dark" onClick={() => handleImport(false)} disabled={importing}>Import Only</button>
              <button className="btn btn-gold" onClick={() => setShowAddForm(true)}>Add to Collection</button>
            </>
          )}
          {user && !imported && !showAddForm && (
            <button className="btn btn-outline" style={{ fontSize: "0.8rem" }} onClick={async () => {
              try {
                const titleParts = (release.title || "").split(" - ");
                await api.addToWishlist({ discogs_id: String(discogsId), title: release.title, artist_name: release.artists?.[0]?.name, thumb_image: release.thumb });
                alert("Added to wishlist!");
              } catch (err) { alert(err.response?.data?.error || "Failed."); }
            }}>+ Wishlist</button>
          )}
          {imported && <span style={{ color: "#27ae60", fontWeight: 600, fontSize: "0.9rem" }}>{imported.message}</span>}
        </div>
      </div>
    </div>
  );
}

function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [filters, setFilters] = useState({ genre: "", year: "", format: "", country: "" });

  const search = async (page = 1) => {
    const hasQuery = query.trim();
    const hasFilters = filters.genre || filters.year || filters.format || filters.country;
    if (!hasQuery && !hasFilters) return;
    setLoading(true);
    try {
      const p = { type: "release", page, per_page: 25 };
      if (hasQuery) p.q = query;
      if (filters.genre) p.genre = filters.genre;
      if (filters.year) p.year = filters.year;
      if (filters.format) p.format = filters.format;
      if (filters.country) p.country = filters.country;
      const res = await api.discogsSearch(p);
      setResults(res.data.results); setPagination(res.data.pagination);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  // Auto-search when filters change
  const filterSearch = (newFilters) => {
    setFilters(newFilters);
    const hasQuery = query.trim();
    const hasFilters = newFilters.genre || newFilters.year || newFilters.format || newFilters.country;
    if (hasQuery || hasFilters) {
      setTimeout(() => {
        const p = { type: "release", page: 1, per_page: 25 };
        if (query.trim()) p.q = query;
        if (newFilters.genre) p.genre = newFilters.genre;
        if (newFilters.year) p.year = newFilters.year;
        if (newFilters.format) p.format = newFilters.format;
        if (newFilters.country) p.country = newFilters.country;
        setLoading(true);
        api.discogsSearch(p).then(res => { setResults(res.data.results); setPagination(res.data.pagination); }).catch(console.error).finally(() => setLoading(false));
      }, 0);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Search Database</h1>
        <p>Find any record in the world's largest music database — search by keyword, genre, year, or format</p>
      </div>

      <form onSubmit={e => { e.preventDefault(); search(1); }} className="search-bar">
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search artists, albums, labels... (optional)" style={{ flex: 2 }} />
        <select value={filters.genre} onChange={e => filterSearch({ ...filters, genre: e.target.value })}>
          <option value="">All Genres</option>
          {["Rock","Jazz","Hip Hop","Electronic","Funk / Soul","Classical","Pop","Blues","Country","Punk","Metal","Reggae","Latin"].map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <select value={filters.format} onChange={e => filterSearch({ ...filters, format: e.target.value })}>
          <option value="">All Formats</option><option value="Vinyl">Vinyl</option><option value="CD">CD</option><option value="Cassette">Cassette</option>
        </select>
        <select value={filters.year} onChange={e => filterSearch({ ...filters, year: e.target.value })}>
          <option value="">All Years</option>
          {Array.from({ length: 80 }, (_, i) => 2025 - i).map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={filters.country} onChange={e => filterSearch({ ...filters, country: e.target.value })}>
          <option value="">All Countries</option>
          {["US","UK","Japan","Germany","France","Canada","Australia","Italy","Netherlands","Brazil","Jamaica"].map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button type="submit" className="btn btn-gold">Search</button>
      </form>

      {loading ? <div className="loading">Searching Discogs...</div> : results.length === 0 ? (
        (!query && !filters.genre && !filters.year && !filters.format) ? (
          <div className="empty-state">
            <h3>Search the Discogs database</h3>
            <p>Search by keyword, or just select a genre, year, or format to browse.</p>
          </div>
        ) : <div className="empty-state"><h3>No results found</h3><p>Try different keywords or filters.</p></div>
      ) : (<>
        <div style={{ marginBottom: "1rem", fontSize: "0.85rem", color: "#6b6b6b" }}>
          {pagination.items || 0} results — Page {pagination.page || 1} of {pagination.pages || 1}
        </div>
        <div className="card-grid">
          {results.map(r => (
            <div key={r.id} className="card record-card" onClick={() => setSelectedId(r.id)} style={{ cursor: "pointer" }}>
              <div style={{ display: "flex", gap: "1rem" }}>
                {(r.cover_image || r.thumb) ? <img src={r.cover_image || r.thumb} alt="" style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "4px", flexShrink: 0 }} /> :
                  <div style={{ width: "60px", height: "60px", background: "#e8e3da", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", color: "#9e9a93", flexShrink: 0 }}>◉</div>}
                <div style={{ minWidth: 0 }}>
                  <div className="title" style={{ fontSize: "0.95rem" }}>{r.title}</div>
                  <div className="meta">{r.year && <span>{r.year}</span>}{r.country && <span> · {r.country}</span>}{r.label?.[0] && <span> · {r.label[0]}</span>}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.3rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                {r.format?.map((f, i) => <span key={i} className="tag">{f}</span>)}
                {r.genre?.map((g, i) => <span key={`g-${i}`} className="tag tag-gold">{g}</span>)}
              </div>
              {r.community && <div style={{ marginTop: "0.4rem", fontSize: "0.75rem", color: "#9e9a93" }}>{r.community.have || 0} have · {r.community.want || 0} want</div>}
            </div>
          ))}
        </div>
        {pagination.pages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "2rem" }}>
            <button className="btn btn-outline" disabled={pagination.page <= 1} onClick={() => search(pagination.page - 1)}>← Previous</button>
            <span style={{ padding: "0.6rem 1rem", fontSize: "0.9rem", color: "#6b6b6b" }}>Page {pagination.page} of {pagination.pages}</span>
            <button className="btn btn-outline" disabled={pagination.page >= pagination.pages} onClick={() => search(pagination.page + 1)}>Next →</button>
          </div>
        )}
      </>)}
      {selectedId && <ReleaseModal discogsId={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  );
}
export default Search;
