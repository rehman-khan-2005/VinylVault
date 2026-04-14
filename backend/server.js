const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5001;
app.use(cors());
app.use(express.json());

app.use("/api/auth",        require("./routes/auth"));
app.use("/api/discogs",     require("./routes/discogs"));
app.use("/api/collection",  require("./routes/collection"));
app.use("/api/marketplace", require("./routes/marketplace"));
app.use("/api/analytics",   require("./routes/analytics"));

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

const buildPath = path.join(__dirname, "../frontend/dist");
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));
  app.get("*", (_req, res) => res.sendFile(path.join(buildPath, "index.html")));
}

app.listen(PORT, () => console.log(`VinylVault API running on http://localhost:${PORT}`));
