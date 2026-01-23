const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware");
const {
  listGroups,
  importGroup,
  deleteGroup,
  updateGroup,
} = require("../services/group/groupController");

// All routes here are scoped to /api/groups

// GET /api/groups - List all my groups
router.get("/", authenticateToken, listGroups);

// POST /api/groups/import - Import a group found via WhatsApp
router.post("/import", authenticateToken, importGroup);

// PUT /api/groups/:id - Update group details
router.put("/:id", authenticateToken, updateGroup);

// DELETE /api/groups/:id - Delete a group
router.delete("/:id", authenticateToken, deleteGroup);

module.exports = router;
