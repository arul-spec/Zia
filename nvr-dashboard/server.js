const express = require("express");
const path = require("path");
const app = express();

const PORT = process.env.PORT || 3000;

// Serve static files from "public" directory
app.use(express.static(path.join(__dirname, "public")));

// Default route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});
