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

// Log requests to the terminal
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.send({ message: "LeverageGroups API is Running 🚀" });
});

// Import other routes (we will create these later)
// const groupRoutes = require('./routes/groupRoutes');
// app.use('/api/groups', groupRoutes);

// 5. Start the Server
// This tells the computer to listen for incoming connections on the specific PORT
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
