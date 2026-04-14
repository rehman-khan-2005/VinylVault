import React, { useState, useEffect, createContext, useContext } from "react";
import { Routes, Route, Link, Navigate } from "react-router-dom";
import * as api from "./services/api";
import Search from "./pages/Search";
import Collection from "./pages/Collection";
import Marketplace from "./pages/Marketplace";
import Analytics from "./pages/Analytics";
import Login from "./pages/Login";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("vv_token");
    if (token) { api.getMe().then(r => setUser(r.data)).catch(() => localStorage.removeItem("vv_token")).finally(() => setLoading(false)); }
    else setLoading(false);
  }, []);

  const handleLogin = async (u, p) => { const r = await api.login({ username: u, password: p }); localStorage.setItem("vv_token", r.data.token); setUser(r.data.user); };
  const handleRegister = async (d) => { const r = await api.register(d); localStorage.setItem("vv_token", r.data.token); setUser(r.data.user); };
  const handleLogout = () => { localStorage.removeItem("vv_token"); setUser(null); };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <AuthContext.Provider value={{ user, handleLogin, handleRegister, handleLogout }}>
      <div className="app">
        <nav className="navbar">
          <Link to="/" className="nav-logo"><span className="logo-icon">◉</span> VinylVault</Link>
          <div className="nav-links">
            <Link to="/">Search Discogs</Link>
            {user && <Link to="/collection">My Collection</Link>}
            <Link to="/marketplace">Marketplace</Link>
            {user && <Link to="/analytics">Analytics</Link>}
          </div>
          <div className="nav-auth">
            {user ? (<><span className="nav-user">Hi, {user.display_name || user.username}</span><button onClick={handleLogout} className="btn btn-sm">Log Out</button></>) : (<Link to="/login" className="btn btn-gold btn-sm">Sign In</Link>)}
          </div>
        </nav>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Search />} />
            <Route path="/collection" element={user ? <Collection /> : <Navigate to="/login" />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/analytics" element={user ? <Analytics /> : <Navigate to="/login" />} />
            <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
          </Routes>
        </main>
        <footer className="footer"><p>VinylVault &copy; 2026 — CSCI-300 Database Project · Powered by Discogs</p></footer>
      </div>
    </AuthContext.Provider>
  );
}
export default App;
