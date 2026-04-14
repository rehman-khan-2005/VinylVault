import React, { useState, useEffect } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import * as api from "../services/api";

const COLORS = ["#d4a843", "#e07a4f", "#1a1a2e", "#2d2d3f", "#9e9a93", "#27ae60", "#3498db", "#8e44ad", "#e74c3c", "#1abc9c"];

function Analytics() {
  const [summary, setSummary] = useState(null);
  const [genres, setGenres] = useState([]);
  const [topRecords, setTopRecords] = useState([]);
  const [decades, setDecades] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getAnalyticsSummary(), api.getAnalyticsGenres(), api.getAnalyticsTopValuable(10),
      api.getAnalyticsDecades(), api.getAnalyticsConditions(), api.getWishlistMatches(),
    ]).then(([s, g, t, d, c, m]) => {
      setSummary(s.data); setGenres(g.data); setTopRecords(t.data);
      setDecades(d.data); setConditions(c.data); setMatches(m.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading analytics...</div>;

  return (
    <div>
      <div className="page-header"><h1>Collection Analytics</h1><p>Insights and stats about your vinyl collection</p></div>
      {summary && (
        <div className="stats-row">
          <div className="card stat-card"><div className="stat-number">{summary.total_records}</div><div className="stat-label">Total Records</div></div>
          <div className="card stat-card"><div className="stat-number">${parseFloat(summary.total_value).toFixed(0)}</div><div className="stat-label">Collection Value</div></div>
          <div className="card stat-card"><div className="stat-number">${parseFloat(summary.total_invested).toFixed(0)}</div><div className="stat-label">Total Invested</div></div>
          <div className="card stat-card"><div className="stat-number" style={{ color: parseFloat(summary.total_gain) >= 0 ? "#27ae60" : "#c0392b" }}>{parseFloat(summary.total_gain) >= 0 ? "+" : ""}${parseFloat(summary.total_gain).toFixed(0)}</div><div className="stat-label">Net Gain/Loss</div></div>
        </div>
      )}
      <div className="analytics-grid">
        <div className="card"><h3>Genre Distribution</h3><div className="chart-container">
          <ResponsiveContainer width="100%" height="100%"><PieChart>
            <Pie data={genres} dataKey="record_count" nameKey="genre_name" cx="50%" cy="50%" outerRadius={80}
              label={({ genre_name, percent }) => `${genre_name} ${(percent * 100).toFixed(0)}%`}>
              {genres.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie><Tooltip /></PieChart></ResponsiveContainer></div></div>
        <div className="card"><h3>Records by Decade</h3><div className="chart-container">
          <ResponsiveContainer width="100%" height="100%"><BarChart data={decades}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e8e3da" /><XAxis dataKey="decade" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} /><Tooltip /><Bar dataKey="count" fill="#d4a843" radius={[4, 4, 0, 0]} />
          </BarChart></ResponsiveContainer></div></div>
        <div className="card"><h3>Condition Breakdown</h3><div className="chart-container">
          <ResponsiveContainer width="100%" height="100%"><BarChart data={conditions} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e8e3da" /><XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis dataKey="condition_name" type="category" tick={{ fontSize: 11 }} width={100} /><Tooltip />
            <Bar dataKey="count" fill="#e07a4f" radius={[0, 4, 4, 0]} />
          </BarChart></ResponsiveContainer></div></div>
        <div className="card"><h3>Value by Decade</h3><div className="chart-container">
          <ResponsiveContainer width="100%" height="100%"><BarChart data={decades}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e8e3da" /><XAxis dataKey="decade" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
            <Tooltip formatter={(v) => [`$${parseFloat(v).toFixed(0)}`, "Value"]} />
            <Bar dataKey="total_value" fill="#1a1a2e" radius={[4, 4, 0, 0]} />
          </BarChart></ResponsiveContainer></div></div>
      </div>
      <div className="card" style={{ marginTop: "1.5rem" }}><h3>Most Valuable Records</h3>
        {topRecords.length === 0 ? <p style={{ color: "#9e9a93", padding: "1rem 0" }}>No valued records yet.</p> : (
          <table className="data-table" style={{ marginTop: "1rem" }}>
            <thead><tr><th>#</th><th>Record</th><th>Artist</th><th>Year</th><th>Cond.</th><th>Paid</th><th>Value</th><th>Gain</th></tr></thead>
            <tbody>{topRecords.map((r, i) => (
              <tr key={r.item_id}><td>{i + 1}</td><td><strong>{r.title}</strong></td><td>{r.artist_name}</td><td>{r.release_year}</td>
                <td><span className="condition-badge">{r.condition_abbr}</span></td>
                <td>${parseFloat(r.purchase_price || 0).toFixed(2)}</td>
                <td style={{ fontWeight: 700, color: "#d4a843" }}>${parseFloat(r.current_value).toFixed(2)}</td>
                <td style={{ color: parseFloat(r.gain) >= 0 ? "#27ae60" : "#c0392b" }}>{parseFloat(r.gain) >= 0 ? "+" : ""}${parseFloat(r.gain).toFixed(2)}</td>
              </tr>))}</tbody></table>)}
      </div>
      {matches.length > 0 && (
        <div className="card" style={{ marginTop: "1.5rem" }}><h3>Wishlist Matches Available</h3>
          <table className="data-table"><thead><tr><th>Record</th><th>Artist</th><th>Your Max</th><th>Asking</th><th>Seller</th></tr></thead>
            <tbody>{matches.map((m, i) => (
              <tr key={i}><td><strong>{m.title}</strong></td><td>{m.artist_name}</td>
                <td>{m.max_price ? `$${parseFloat(m.max_price).toFixed(2)}` : "Any"}</td>
                <td style={{ color: "#d4a843", fontWeight: 600 }}>${parseFloat(m.asking_price).toFixed(2)}</td>
                <td>{m.seller_name}</td></tr>))}</tbody></table></div>)}
    </div>
  );
}
export default Analytics;
