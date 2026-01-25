/**
 * FIX NULL ROLES SCRIPT
 * ======================
 * This script finds all users with null/undefined roles
 * and sets them to a default role (GA - Group Admin).
 *
 * Usage: node scripts/fix-null-roles.js
 *
 * Optional: Pass a role as argument
 *   node scripts/fix-null-roles.js BR  (to set Brand role instead)
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function fixNullRoles() {
  // Get role from command line argument, default to "GA"
  const defaultRole = process.argv[2] || "GA";

  // Validate role
  if (!["GA", "BR"].includes(defaultRole)) {
    console.error("❌ Invalid role. Use 'GA' (Group Admin) or 'BR' (Brand).");
    process.exit(1);
  }

  console.log(`\n🔍 Finding users with null/undefined roles...\n`);

  try {
    // Find all users with null role
    const usersWithNullRole = await prisma.user.findMany({
      where: {
        role: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
    });

    if (usersWithNullRole.length === 0) {
      console.log("✅ No users with null roles found. All good!");
      return;
    }

    console.log(`Found ${usersWithNullRole.length} user(s) with null roles:\n`);
    usersWithNullRole.forEach((user, index) => {
      console.log(
        `  ${index + 1}. ${user.name || "No Name"} (${user.email || user.phone})`,
      );
    });

    console.log(`\n🔧 Updating all to role: ${defaultRole}...\n`);

    // Update all users with null role
    const result = await prisma.user.updateMany({
      where: {
        role: null,
      },
      data: {
        role: defaultRole,
      },
    });

    console.log(
      `✅ Successfully updated ${result.count} user(s) to role '${defaultRole}'!`,
    );
    console.log("\n📋 Users can now access their dashboards.");
  } catch (error) {
    console.error("❌ Error fixing roles:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixNullRoles();
