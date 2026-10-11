import mongoose from "mongoose";
const { Schema } = mongoose;
const id = Schema.Types.ObjectId;
function model(name, fields, indexes = []) {
  const s = new Schema(fields, { timestamps: true });
  indexes.forEach(([k, o]) => s.index(k, o));
  return mongoose.models[name] || mongoose.model(name, s);
}
export const User = model("User", {
  emailNormalized: { type: String, unique: true },
  passwordHash: String,
  displayName: String,
  role: {
    type: String,
    enum: ["patient", "clinician", "admin"],
    default: "patient",
  },
  status: { type: String, default: "active" },
  timezone: { type: String, default: "Asia/Kolkata" },
});
export const Session = model(
  "Session",
  {
    tokenHash: { type: String, unique: true },
    userId: id,
    csrf: String,
    expiresAt: Date,
  },
  [[{ expiresAt: 1 }, { expireAfterSeconds: 0 }]],
);
export const CareLink = model(
  "CareLink",
  {
    patientId: id,
    clinicianId: id,
    status: String,
    consentedAt: Date,
    revokedAt: Date,
  },
  [[{ patientId: 1, clinicianId: 1 }, { unique: true }]],
);
export const Invitation = model(
  "Invitation",
  {
    tokenHash: { type: String, unique: true },
    clinicianId: id,
    expiresAt: Date,
    usedAt: Date,
  },
  [[{ expiresAt: 1 }, { expireAfterSeconds: 0 }]],
);
export const Reading = model(
  "Reading",
  {
    patientId: id,
    type: String,
    value: Number,
    systolic: Number,
    diastolic: Number,
    unit: String,
    measuredAt: Date,
    context: String,
    source: { type: String, default: "manual" },
    createdBy: id,
    clientRequestId: String,
  },
  [
    [{ patientId: 1, clientRequestId: 1 }, { unique: true }],
    [{ patientId: 1, type: 1, measuredAt: -1 }, {}],
  ],
);
export const Medication = model("Medication", {
  patientId: id,
  name: String,
  instructions: String,
  enteredBy: id,
  provenance: String,
  startAt: Date,
  endAt: Date,
  scheduleVersions: [
    { version: Number, effectiveAt: Date, times: [String], asNeeded: Boolean },
  ],
});
export const Dose = model(
  "Dose",
  {
    patientId: id,
    medicationId: id,
    scheduleVersion: Number,
    scheduledFor: Date,
    status: String,
    recordedAt: Date,
  },
  [[{ patientId: 1, medicationId: 1, scheduledFor: 1 }, { unique: true }]],
);
export const Plan = model("Plan", {
  patientId: id,
  clinicianId: id,
  title: String,
  dueAt: Date,
  status: { type: String, default: "open" },
  completedAt: Date,
  version: { type: Number, default: 1 },
});
export const Audit = model("Audit", {
  actorId: id,
  patientId: id,
  action: String,
  targetId: String,
});
export const Rate = model(
  "Rate",
  { key: { type: String, unique: true }, count: Number, expiresAt: Date },
  [[{ expiresAt: 1 }, { expireAfterSeconds: 0 }]],
);
