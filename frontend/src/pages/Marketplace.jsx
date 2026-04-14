import React, { useState, useEffect } from "react";
import { useAuth } from "../App";
import * as api from "../services/api";

function Marketplace() {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("Active");

  const load = async () => { setLoading(true); try { const r = await api.getListings({ status: statusFilter }); setListings(r.data); } catch (e) { console.error(e); } setLoading(false); };
  useEffect(() => { load(); }, [statusFilter]);

  const handleBuy = async (id) => { if (!user) return alert("Please sign in."); if (!window.confirm("Express interest?")) return; try { await api.buyListing(id); load(); } catch (e) { alert(e.response?.data?.error || "Failed."); } };
  const handleComplete = async (id) => { if (!window.confirm("Confirm sale complete?")) return; try { await api.completeSale(id); load(); } catch (e) { alert(e.response?.data?.error || "Failed."); } };
  const handleCancel = async (id) => { if (!window.confirm("Cancel listing?")) return; try { await api.cancelListing(id); load(); } catch (e) { alert(e.response?.data?.error || "Failed."); } };

  return (
    <div>
      <div className="page-header"><h1>Marketplace</h1><p>Buy and sell vinyl records with other collectors</p></div>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {["Active", "Pending", "Sold"].map(s => (
          <button key={s} className={`btn btn-sm ${statusFilter === s ? "btn-dark" : "btn-outline"}`} onClick={() => setStatusFilter(s)}>{s}</button>
        ))}
      </div>
      {loading ? <div className="loading">Loading...</div> : listings.length === 0 ? (
        <div className="empty-state"><h3>No {statusFilter.toLowerCase()} listings</h3><p>{statusFilter === "Active" ? "List records from your collection to start selling!" : "None found."}</p></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {listings.map(l => (
            <div key={l.listing_id} className="card trade-card">
              <div className="trade-info" style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                {l.thumb_image && <img src={l.thumb_image} alt="" style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "4px" }} />}
                <div>
                  <h3>{l.title}</h3>
                  <div className="trade-meta">{l.artist_name} · {l.release_year} · {l.format} <span className="condition-badge" style={{ marginLeft: "0.5rem" }}>{l.condition_abbr}</span></div>
                  <div className="trade-meta" style={{ marginTop: "0.3rem" }}>
                    Seller: <strong>{l.seller_display || l.seller_name}</strong>
                    {l.buyer_name && <> · Buyer: <strong>{l.buyer_name}</strong></>}
                  </div>
                  {l.description && <div style={{ fontSize: "0.8rem", color: "#6b6b6b", marginTop: "0.2rem", fontStyle: "italic" }}>{l.description}</div>}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div className="trade-price">${parseFloat(l.asking_price).toFixed(2)}</div>
                {l.status === "Active" && user && l.seller_id !== user.user_id && <button className="btn btn-gold btn-sm" onClick={() => handleBuy(l.listing_id)}>Buy</button>}
                {l.status === "Pending" && user && l.seller_id === user.user_id && <button className="btn btn-success btn-sm" onClick={() => handleComplete(l.listing_id)}>Confirm Sale</button>}
                {(l.status === "Active" || l.status === "Pending") && user && l.seller_id === user.user_id && <button className="btn btn-danger btn-sm" onClick={() => handleCancel(l.listing_id)}>Cancel</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
export default Marketplace;
