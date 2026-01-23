/* SERVER ENTRY POINT*/

require("dotenv").config();

const express = require("express");

const cors = require("cors");

// 'helmet' adds security headers to our responses to protect from common attacks
const helmet = require("helmet");

// 'morgan' logs every request to the console so we can see what's happening
const morgan = require("morgan");

const app = express();
const PORT = process.env.PORT || 3000; // Use the port from .env or default to 3000

app.use(express.json());

app.use(cors());

// Add security headers
app.use(helmet());

// Disable HTTP caching for API responses to avoid 304s on polled endpoints (e.g., WhatsApp QR)
app.set("etag", false);
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

// Log requests to the terminal
app.use(morgan("dev"));

// 4. Define Routes (The "Men" of our restaurant)
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send({ message: "LeverageGroups API is Running 🚀" });
});

// Import other routes
// Import other routes
const groupRoutes = require("./routes/groupRoutes");
const whatsappRoutes = require("./routes/whatsappRoutes");

app.use("/api/groups", groupRoutes);
app.use("/api/whatsapp", whatsappRoutes);

// 5. Start the Server
// This tells the computer to listen for incoming connections on the specific PORT
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
