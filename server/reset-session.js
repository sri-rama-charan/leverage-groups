const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const SESSION_DIR = path.join(__dirname, ".wwebjs_auth");

console.log("🧹 Cleaning up WhatsApp Session...");

try {
  // 1. Kill Zombie Chrome Processes
  console.log("💀 Killing Chrome processes...");
  try {
    execSync("taskkill /F /IM chrome.exe /T", { stdio: "ignore" });
  } catch (e) {
    // Ignore error if no chrome is running
  }

  // 2. Delete Session Directory
  if (fs.existsSync(SESSION_DIR)) {
    console.log("🗑️ Deleting .wwebjs_auth...");
    fs.rmSync(SESSION_DIR, { recursive: true, force: true });
    console.log("✅ Session cleared.");
  } else {
    console.log("ℹ️ No session found to clear.");
  }
} catch (err) {
  console.error("❌ Failed to clean session:", err.message);
}
