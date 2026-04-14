import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../App";

function Login() {
  const { handleLogin, handleRegister } = useAuth();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ username: "", password: "", email: "", display_name: "" });
  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const onSubmit = async (e) => {
    e.preventDefault(); setError("");
    try { if (isRegister) await handleRegister(form); else await handleLogin(form.username, form.password); navigate("/"); }
    catch (err) { setError(err.response?.data?.error || "Something went wrong."); }
  };
  return (
    <div className="login-page"><div className="card">
      <h2>{isRegister ? "Create Account" : "Sign In"}</h2>
      {error && <div className="error-msg">{error}</div>}
      <form onSubmit={onSubmit}>
        <div className="form-group"><label>Username</label><input name="username" value={form.username} onChange={onChange} required /></div>
        {isRegister && (<><div className="form-group"><label>Email</label><input name="email" type="email" value={form.email} onChange={onChange} required /></div>
        <div className="form-group"><label>Display Name</label><input name="display_name" value={form.display_name} onChange={onChange} /></div></>)}
        <div className="form-group"><label>Password</label><input name="password" type="password" value={form.password} onChange={onChange} required /></div>
        <button type="submit" className="btn btn-gold" style={{ width: "100%" }}>{isRegister ? "Create Account" : "Sign In"}</button>
      </form>
      <div className="login-toggle">{isRegister ? "Already have an account? " : "Need an account? "}
        <span onClick={() => { setIsRegister(!isRegister); setError(""); }}>{isRegister ? "Sign In" : "Register"}</span>
      </div>
    </div></div>
  );
}
export default Login;
