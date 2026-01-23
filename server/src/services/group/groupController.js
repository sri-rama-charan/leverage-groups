const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// LIST GROUPS
const listGroups = async (req, res) => {
  try {
    const userId = req.user.id;

    const groups = await prisma.group.findMany({
      where: { adminId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { members: true } },
      },
    });

    const formattedGroups = groups.map((g) => ({
      id: g.id,
      groupName: g.groupName,
      whatsappGroupId: g.whatsappGroupId,
      inviteLink: g.inviteLink,
      tags: g.tags,
      pricePerMessage: g.pricePerMessage,
      scrapedMemberCount: g.scrapedMemberCount,
      verificationStatus: g.verificationStatus,
      monetizationEnabled: g.monetizationEnabled,
      lastSyncedAt: g.lastSyncedAt,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
      memberCount: g._count.members,
      dailyMessageCap: g.dailyCap,
    }));

    res.status(200).json({ groups: formattedGroups });
  } catch (error) {
    console.error("[GROUP LIST] Error:", error);
    res.status(500).json({ error: "Failed to fetch groups." });
  }
};

// TASK 2: Add a new group from WhatsApp
// Called when: Admin imports a WhatsApp group
const importGroup = async (req, res) => {
  // Get all the info from the app
  const {
    whatsappGroupId,        // WhatsApp's unique ID
    groupName,              // Name of the group
    inviteLink,             // Link to join
    participants,           // List of people
    tags,                   // Interest labels
    monetizationEnabled,    // Can we send paid messages?
    pricePerMessage,        // How much per message?
    dailyMessageCap,        // Per-member daily message cap
    consentConfirmed,       // Did admin confirm members agreed?
  } = req.body;

  // Get who is trying to add the group (the admin)
  const adminId = req.user.id;

  // SECURITY CHECK: Did admin confirm members agreed?
  if (!consentConfirmed) {
    return res.status(400).json({ error: "You must confirm member consent." });
  }

  try {
    // Convert string inputs to proper types (in case they come as strings from frontend)
    const price = Number(pricePerMessage) || 1;
    const dailyCap = Number(dailyMessageCap) || 1;
    // STEP 1: Save the group to database
    // If group already exists, update it. If not, create it.
    const group = await prisma.group.upsert({
      where: { whatsappGroupId: whatsappGroupId }, // Find by WhatsApp ID
      // UPDATE if group already exists
      update: {
        groupName,
        inviteLink: inviteLink || "",
        tags,
        monetizationEnabled,
        pricePerMessage: price,
        dailyCap: dailyCap,
        lastSyncedAt: new Date(),                 // Update "when we last checked"
        scrapedMemberCount: participants.length,  // Update member count
      },
      // CREATE if group is new
      create: {
        adminId,                         // Who owns this group
        whatsappGroupId,                 // WhatsApp's ID
        groupName,                       // Group name
        inviteLink: inviteLink || "",    // Link to join
        tags,                            // Interest labels
        monetizationEnabled,             // Can we send paid messages?
        pricePerMessage: price,          // Price per message
        dailyCap: dailyCap,
        scrapedMemberCount: participants.length,  // How many members
        lastSyncedAt: new Date(),                 // When we added it
        verificationStatus: "VERIFIED",  // We checked the admin is real
      },
    });

    // STEP 2: Save all the members (people in the group)
    // For each person, save their phone number and if they're an admin
    const memberPromises = participants.map((p) => {
      // Get the phone number (WhatsApp stores it as "919876543210@c.us", we need "919876543210")
      const phoneRaw =
        typeof p.id === "string"
          ? p.id
          : p.id && typeof p.id === "object"
            ? p.id._serialized || p.id.user
            : null;

      // Skip if no phone number
      if (!phoneRaw) {
        return Promise.resolve();
      }

      // Clean up the phone: remove "@c.us" and special characters
      const phone = phoneRaw.replace(/@.+$/, "");

      // Save or update this person in database
      return prisma.groupMember.upsert({
        where: {
          groupId_phone: {
            groupId: group.id,
            phone: phone,
          },
        },
        // UPDATE if person already exists
        update: {
          isAdmin: p.isAdmin || p.isSuperAdmin || false,
          isSuperAdmin: p.isSuperAdmin || false,
        },
        // CREATE if person is new
        create: {
          groupId: group.id,
          phone: phone,
          isAdmin: p.isAdmin || p.isSuperAdmin || false,
          isSuperAdmin: p.isSuperAdmin || false,
          consentSource: "admin_declared", // They agreed through admin
        },
      });
    });

    // Wait for all members to finish saving
    await Promise.all(memberPromises);

    // Success! Send back a message
    res
      .status(201)
      .json({
        message: "Group and Members Imported successfully!",
        groupId: group.id,
      });
  } catch (error) {
    // If something goes wrong, tell the user
    console.error("[GROUP IMPORT] Error:", error);
    res.status(500).json({ error: "Failed to import group." });
  }
};

// UPDATE GROUP DETAILS
const updateGroup = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { groupName, pricePerMessage, tags, dailyMessageCap, monetizationEnabled } = req.body;

  try {
    const group = await prisma.group.findUnique({ where: { id } });
    if (!group) return res.status(404).json({ error: "Group not found." });
    if (group.adminId !== userId)
      return res.status(403).json({ error: "You are not authorized to update this group." });

    const updated = await prisma.group.update({
      where: { id },
      data: {
        groupName: groupName ?? group.groupName,
        pricePerMessage: pricePerMessage ?? group.pricePerMessage,
        tags: Array.isArray(tags) ? tags : group.tags,
        dailyCap: Number.isFinite(Number(dailyMessageCap)) ? Number(dailyMessageCap) : group.dailyCap,
        monetizationEnabled:
          typeof monetizationEnabled === "boolean"
            ? monetizationEnabled
            : group.monetizationEnabled,
      },
    });

    res.status(200).json({ group: updated });
  } catch (error) {
    console.error("[GROUP UPDATE] Error:", error);
    res.status(500).json({ error: "Failed to update group." });
  }
};

// TASK 3: Delete a group (erase it from database)
// Called when: Admin clicks "Delete this group"
const deleteGroup = async (req, res) => {
  const { id } = req.params;           // Which group to delete
  const userId = req.user.id;          // Who is trying to delete it

  try {
    // SECURITY STEP 1: Check if the group exists
    const group = await prisma.group.findUnique({
      where: { id },
    });

    // If group doesn't exist, send error
    if (!group) {
      return res.status(404).json({ error: "Group not found." });
    }

    // SECURITY STEP 2: Check if this admin owns the group (prevent hacking)
    if (group.adminId !== userId) {
      return res.status(403).json({ error: "You are not authorized to delete this group." });
    }

    // Delete the group (and all members in it automatically)
    await prisma.group.delete({
      where: { id },
    });

    // Success! Tell the admin
    res.status(200).json({ message: "Group deleted successfully." });
  } catch (error) {
    // If something goes wrong, tell the user
    console.error("[GROUP DELETE] Error:", error);
    res.status(500).json({ error: "Failed to delete group." });
  }
};

// Export all functions so other files can use them
module.exports = { listGroups, importGroup, updateGroup, deleteGroup };
