const jwt = require("jsonwebtoken");
require("dotenv").config();
function authMiddleware(req, res, next) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith("Bearer ")) return res.status(401).json({ error: "Access denied." });
  try { req.user = jwt.verify(h.split(" ")[1], process.env.JWT_SECRET); next(); }
  catch (e) { return res.status(401).json({ error: "Invalid token." }); }
}
function optionalAuth(req, res, next) {
  const h = req.headers.authorization;
  if (h && h.startsWith("Bearer ")) { try { req.user = jwt.verify(h.split(" ")[1], process.env.JWT_SECRET); } catch (_) {} }
  next();
}
module.exports = { authMiddleware, optionalAuth };
