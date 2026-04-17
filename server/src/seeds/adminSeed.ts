import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import mongoose from "mongoose";
import User from "../models/User";

const admins = [
  {
    name:            "Super Admin",
    username:        "superadmin",
    email:           "superadmin@seezoo.com",
    password:        "Admin@123",
    role:            "superadmin" as const,
    isEmailVerified: true,
    authProvider:    "local" as const,
  },
  {
    name:            "Admin",
    username:        "admin",
    email:           "admin@seezoo.com",
    password:        "Admin@123",
    role:            "admin" as const,
    isEmailVerified: true,
    authProvider:    "local" as const,
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log("✅ Connected to MongoDB");

    for (const admin of admins) {
      const existing = await User.findOne({ email: admin.email });

      if (existing) {
        // Force update password and role using save() so pre-save hook hashes correctly
        existing.password        = admin.password;
        existing.role            = admin.role;
        existing.isEmailVerified = true;
        existing.isBlocked       = false;
        await existing.save();
        console.log(`🔄 Updated: ${admin.email} → role: ${admin.role}, password reset`);
        continue;
      }

      // Create new — pre-save hook will hash the password
      const user = new User({
        name:            admin.name,
        username:        admin.username,
        email:           admin.email,
        password:        admin.password,
        role:            admin.role,
        isEmailVerified: admin.isEmailVerified,
        authProvider:    admin.authProvider,
        isBlocked:       false,
      });

      await user.save();
      console.log(`✅ Created ${admin.role}: ${admin.email}`);
    }

    console.log("\n🎉 Seeding complete!");
    console.log("─────────────────────────────────────────────");
    console.log("  superadmin@seezoo.com  →  Admin@123");
    console.log("  admin@seezoo.com       →  Admin@123");
    console.log("─────────────────────────────────────────────");
  } catch (err) {
    console.error("❌ Seed failed:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seed();
