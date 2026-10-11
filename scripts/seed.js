import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "../server/db.js";
import {
  User,
  Reading,
  Medication,
  Plan,
  CareLink,
} from "../server/models/index.js";
if (!process.env.SEED_PASSWORD || process.env.SEED_PASSWORD.length < 12)
  throw new Error(
    "Set SEED_PASSWORD (12+ characters) in the local .env before seeding. It is never printed.",
  );
await connectDB();
const passwordHash = await bcrypt.hash(process.env.SEED_PASSWORD, 12);
const patient = await User.findOneAndUpdate(
  { emailNormalized: "alex@example.com" },
  {
    $setOnInsert: {
      displayName: "Alex Morgan",
      role: "patient",
      status: "active",
      timezone: "Asia/Kolkata",
      passwordHash,
    },
  },
  { upsert: true, new: true },
);
const clinician = await User.findOneAndUpdate(
  { emailNormalized: "maya@example.com" },
  {
    $setOnInsert: {
      displayName: "Dr. Maya Chen",
      role: "clinician",
      status: "active",
      timezone: "Asia/Kolkata",
      passwordHash,
    },
  },
  { upsert: true, new: true },
);
await CareLink.updateOne(
  { patientId: patient._id, clinicianId: clinician._id },
  { $setOnInsert: { status: "active", consentedAt: new Date() } },
  { upsert: true },
);
for (let i = 1; i <= 14; i++) {
  const measuredAt = new Date(Date.now() - i * 86400000);
  await Reading.updateOne(
    { patientId: patient._id, clientRequestId: `seed-day-${i}` },
    {
      $setOnInsert: {
        type: "glucose",
        value: 108 + ((i * 7) % 21),
        unit: "mg/dL",
        context: "fasting",
        measuredAt,
        createdBy: patient._id,
      },
    },
    { upsert: true },
  );
}
console.log(
  "Synthetic patient alex@example.com and approved clinician maya@example.com are ready. Password comes from your SEED_PASSWORD environment variable.",
);
await mongoose.disconnect();
