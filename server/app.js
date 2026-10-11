import express from "express";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import { randomBytes, createHash, randomUUID } from "node:crypto";
import mongoose from "mongoose";
import { z } from "zod";
import { connectDB } from "./db.js";
import {
  User,
  Session,
  CareLink,
  Invitation,
  Reading,
  Medication,
  Dose,
  Plan,
  Audit,
  Rate,
} from "./models/index.js";
import { readingSchema, summarize, mayAccess } from "./services/rules.js";
export const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "32kb" }));
app.use(cookieParser());
const r = express.Router(),
  hash = (v) => createHash("sha256").update(v).digest("hex"),
  fail = (status, code, message) =>
    Object.assign(new Error(message), { status, code });
const safe = (u) => ({
  id: String(u._id),
  displayName: u.displayName,
  email: u.emailNormalized,
  role: u.role,
  timezone: u.timezone,
});
const objectId = (v) => {
  if (!mongoose.isValidObjectId(v))
    throw fail(400, "INVALID_ID", "Invalid record identifier");
  return v;
};
r.use((req, res, next) => {
  req.requestId = randomUUID();
  res.set("Cache-Control", "no-store");
  next();
});
r.get("/health", (req, res) =>
  res.json({
    data: { ok: true, databaseConfigured: Boolean(process.env.MONGODB_URI) },
  }),
);
r.get("/auth/csrf", (req, res) => {
  const token = randomBytes(32).toString("hex");
  res.cookie("cc_preauth", token, {
    httpOnly: true,
    secure: process.env.APP_ORIGIN?.startsWith("https://"),
    sameSite: "strict",
    path: "/",
    maxAge: 600000,
  });
  res.json({ data: { csrf: token } });
});
r.use(async (req, res, next) => {
  await connectDB();
  next();
});
r.use((req, res, next) => {
  if (
    !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
    (!process.env.APP_ORIGIN || req.get("origin") !== process.env.APP_ORIGIN)
  )
    throw fail(403, "ORIGIN", "Request origin is not allowed");
  next();
});
r.use((req, res, next) => {
  if (
    req.method === "POST" &&
    ["/auth/login", "/auth/register"].includes(req.path) &&
    (!req.cookies.cc_preauth ||
      req.cookies.cc_preauth !== req.get("x-csrf-token"))
  )
    throw fail(403, "CSRF", "Refresh the sign-in page and try again");
  next();
});
const credentials = z
  .object({
    email: z
      .email()
      .max(254)
      .transform((s) => s.toLowerCase().trim()),
    password: z.string().min(10).max(72),
  })
  .strict();
async function throttle(req) {
  const key = hash(
    `${req.get("x-nf-client-connection-ip") || req.ip}:${Math.floor(Date.now() / 900000)}`,
  );
  const v = await Rate.findOneAndUpdate(
    { key },
    {
      $inc: { count: 1 },
      $setOnInsert: { expiresAt: new Date(Date.now() + 1800000) },
    },
    { upsert: true, new: true },
  );
  if (v.count > 20)
    throw fail(
      429,
      "RATE_LIMIT",
      "Too many attempts. Try again in 15 minutes.",
    );
}
async function session(req, res, user) {
  const token = randomBytes(32).toString("hex"),
    csrf = randomBytes(32).toString("hex");
  await Session.create({
    tokenHash: hash(token),
    csrf,
    userId: user._id,
    expiresAt: new Date(Date.now() + 86400000),
  });
  res.cookie("cc_session", token, {
    httpOnly: true,
    secure: process.env.APP_ORIGIN?.startsWith("https://"),
    sameSite: "lax",
    path: "/",
    maxAge: 86400000,
  });
  res.json({ data: { user: safe(user), csrf } });
}
r.post("/auth/register", async (req, res) => {
  await throttle(req);
  const { displayName, ...body } = req.body;
  const c = credentials.parse(body);
  const name = z.string().trim().min(2).max(80).parse(displayName);
  const user = await User.create({
    emailNormalized: c.email,
    passwordHash: await bcrypt.hash(c.password, 12),
    displayName: name,
    role: "patient",
    status: "active",
  });
  await session(req, res, user);
});
r.post("/auth/login", async (req, res) => {
  await throttle(req);
  const c = credentials.parse(req.body);
  const user = await User.findOne({ emailNormalized: c.email });
  if (
    !user ||
    !(await bcrypt.compare(c.password, user.passwordHash)) ||
    user.status !== "active"
  )
    throw fail(401, "CREDENTIALS", "Email or password is incorrect");
  await session(req, res, user);
});
r.use(async (req, res, next) => {
  const token = req.cookies.cc_session;
  if (!token) throw fail(401, "UNAUTHENTICATED", "Please sign in");
  const s = await Session.findOne({
      tokenHash: hash(token),
      expiresAt: { $gt: new Date() },
    }),
    u = s && (await User.findById(s.userId));
  if (!u || u.status !== "active")
    throw fail(401, "SESSION_EXPIRED", "Your session has expired");
  req.user = u;
  req.session = s;
  if (
    !["GET", "HEAD"].includes(req.method) &&
    req.get("x-csrf-token") !== s.csrf
  )
    throw fail(403, "CSRF", "Please refresh and try again");
  next();
});
r.get("/auth/me", (req, res) =>
  res.json({ data: { user: safe(req.user), csrf: req.session.csrf } }),
);
r.post("/auth/logout", async (req, res) => {
  await Session.deleteOne({ _id: req.session._id });
  res.clearCookie("cc_session", { path: "/" });
  res.json({ data: { ok: true } });
});
r.get("/ready", async (req, res) => {
  await mongoose.connection.db.admin().ping();
  res.json({ data: { ok: true } });
});
r.get("/patients/me", (req, res) => res.json({ data: safe(req.user) }));
async function access(req, patientId) {
  objectId(patientId);
  const link =
    req.user.role === "clinician"
      ? await CareLink.findOne({
          patientId,
          clinicianId: req.user._id,
          status: "active",
        })
      : null;
  if (!mayAccess(req.user, patientId, link))
    throw fail(403, "FORBIDDEN", "This record is not shared with you");
}
async function audit(req, patientId, action, targetId) {
  await Audit.create({
    actorId: req.user._id,
    patientId,
    action,
    targetId: String(targetId),
  });
}
function range(q) {
  const end = q.to ? new Date(q.to) : new Date(),
    start = q.from ? new Date(q.from) : new Date(end.getTime() - 30 * 86400000);
  if (
    !Number.isFinite(+start) ||
    !Number.isFinite(+end) ||
    start > end ||
    end - start > 366 * 86400000
  )
    throw fail(400, "DATE_RANGE", "Choose a valid date range up to one year");
  return { $gte: start, $lte: end };
}
r.get("/patients/:id/readings", async (req, res) => {
  await access(req, req.params.id);
  const limit = z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(50)
      .parse(req.query.limit),
    page = z.coerce
      .number()
      .int()
      .min(1)
      .max(10000)
      .default(1)
      .parse(req.query.page),
    filter = { patientId: req.params.id, measuredAt: range(req.query) };
  const [items, total] = await Promise.all([
    Reading.find(filter)
      .sort({ measuredAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Reading.countDocuments(filter),
  ]);
  res.json({ data: { items, total, page, limit } });
});
r.post("/patients/:id/readings", async (req, res) => {
  await access(req, req.params.id);
  const body = readingSchema.parse(req.body);
  const item = await Reading.findOneAndUpdate(
    { patientId: req.params.id, clientRequestId: body.clientRequestId },
    {
      $setOnInsert: {
        ...body,
        patientId: req.params.id,
        createdBy: req.user._id,
      },
    },
    { upsert: true, new: true },
  );
  await audit(req, req.params.id, "reading.record", item._id);
  res.status(201).json({ data: item });
});
r.patch("/readings/:id", async (req, res) => {
  const item = await Reading.findById(objectId(req.params.id));
  if (!item) throw fail(404, "NOT_FOUND", "Reading not found");
  await access(req, item.patientId);
  if (String(item.createdBy) !== String(req.user._id))
    throw fail(403, "FORBIDDEN", "Only the recorder can correct this reading");
  const body = readingSchema.parse(req.body);
  Object.assign(item, body, { clientRequestId: item.clientRequestId });
  await item.save();
  await audit(req, item.patientId, "reading.correct", item._id);
  res.json({ data: item });
});
r.get("/patients/:id/summary", async (req, res) => {
  await access(req, req.params.id);
  res.json({
    data: summarize(
      await Reading.find({
        patientId: req.params.id,
        measuredAt: range(req.query),
      })
        .sort({ measuredAt: 1 })
        .limit(10000)
        .lean(),
    ),
  });
});
r.post("/care-links/invitations", async (req, res) => {
  if (req.user.role !== "clinician")
    throw fail(403, "FORBIDDEN", "An approved clinician account is required");
  const token = randomBytes(24).toString("hex");
  await Invitation.create({
    tokenHash: hash(token),
    clinicianId: req.user._id,
    expiresAt: new Date(Date.now() + 86400000),
  });
  res.json({ data: { token, expiresIn: "24 hours" } });
});
r.get("/care-links/invitations/:token", async (req, res) => {
  const invite = await Invitation.findOne({
    tokenHash: hash(req.params.token),
    usedAt: null,
    expiresAt: { $gt: new Date() },
  });
  if (!invite) throw fail(404, "INVITATION", "Invitation expired or used");
  const clinician = await User.findById(invite.clinicianId);
  res.json({
    data: {
      clinician: clinician.displayName,
      permissions:
        "Read your records and create medication and follow-up plans",
    },
  });
});
r.post("/care-links/accept", async (req, res) => {
  if (req.user.role !== "patient")
    throw fail(403, "FORBIDDEN", "Patient account required");
  const { token } = z
    .object({ token: z.string().min(20).max(100) })
    .strict()
    .parse(req.body);
  const invite = await Invitation.findOneAndUpdate(
    { tokenHash: hash(token), usedAt: null, expiresAt: { $gt: new Date() } },
    { $set: { usedAt: new Date() } },
    { new: true },
  );
  if (!invite)
    throw fail(409, "INVITATION", "Invitation expired or already used");
  const link = await CareLink.findOneAndUpdate(
    { patientId: req.user._id, clinicianId: invite.clinicianId },
    { $set: { status: "active", consentedAt: new Date(), revokedAt: null } },
    { upsert: true, new: true },
  );
  await audit(req, req.user._id, "sharing.accept", link._id);
  res.json({ data: link });
});
r.get("/care-links", async (req, res) => {
  const filter =
    req.user.role === "patient"
      ? { patientId: req.user._id }
      : { clinicianId: req.user._id };
  res.json({
    data: await CareLink.find({ ...filter, status: "active" }).lean(),
  });
});
r.delete("/care-links/:id", async (req, res) => {
  const link = await CareLink.findById(objectId(req.params.id));
  if (
    !link ||
    ![String(link.patientId), String(link.clinicianId)].includes(
      String(req.user._id),
    )
  )
    throw fail(403, "FORBIDDEN", "Access denied");
  link.status = "revoked";
  link.revokedAt = new Date();
  await link.save();
  await audit(req, link.patientId, "sharing.revoke", link._id);
  res.json({ data: { ok: true } });
});
r.get("/clinician/patients", async (req, res) => {
  if (req.user.role !== "clinician")
    throw fail(403, "FORBIDDEN", "Clinician account required");
  const links = await CareLink.find({
    clinicianId: req.user._id,
    status: "active",
  });
  res.json({
    data: (
      await User.find({ _id: { $in: links.map((l) => l.patientId) } })
    ).map(safe),
  });
});
r.get("/patients/:id/medications", async (req, res) => {
  await access(req, req.params.id);
  res.json({
    data: await Medication.find({ patientId: req.params.id }).lean(),
  });
});
r.post("/patients/:id/medications", async (req, res) => {
  await access(req, req.params.id);
  const b = z
    .object({
      name: z.string().min(2).max(100),
      instructions: z.string().max(300),
      times: z
        .array(z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/))
        .min(1)
        .max(8),
      asNeeded: z.boolean().default(false),
    })
    .strict()
    .parse(req.body);
  res
    .status(201)
    .json({
      data: await Medication.create({
        patientId: req.params.id,
        name: b.name,
        instructions: b.instructions,
        enteredBy: req.user._id,
        provenance:
          req.user.role === "clinician"
            ? "clinician-authored"
            : "self-reported",
        startAt: new Date(),
        scheduleVersions: [
          {
            version: 1,
            effectiveAt: new Date(),
            times: [...new Set(b.times)],
            asNeeded: b.asNeeded,
          },
        ],
      }),
    });
});
r.get("/patients/:id/doses", async (req, res) => {
  await access(req, req.params.id);
  res.json({
    data: await Dose.find({
      patientId: req.params.id,
      scheduledFor: range(req.query),
    }).lean(),
  });
});
r.put("/medications/:id/doses/:occurrence", async (req, res) => {
  const med = await Medication.findById(objectId(req.params.id));
  if (
    !med ||
    req.user.role !== "patient" ||
    String(med.patientId) !== String(req.user._id)
  )
    throw fail(403, "FORBIDDEN", "Only the owning patient can log a dose");
  const { status } = z
      .object({ status: z.enum(["taken", "skipped", "unknown"]) })
      .strict()
      .parse(req.body),
    scheduledFor = new Date(req.params.occurrence);
  if (
    !Number.isFinite(+scheduledFor) ||
    scheduledFor > new Date() ||
    scheduledFor < med.startAt
  )
    throw fail(400, "OCCURRENCE", "Invalid or future occurrence");
  const version = [...med.scheduleVersions]
    .reverse()
    .find((v) => v.effectiveAt <= scheduledFor);
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: req.user.timezone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(scheduledFor);
  if (
    !version ||
    version.asNeeded ||
    !version.times.includes(time) ||
    scheduledFor.getUTCSeconds() !== 0 ||
    scheduledFor.getUTCMilliseconds() !== 0
  )
    throw fail(400, "OCCURRENCE", "This is not a scheduled dose");
  res.json({
    data: await Dose.findOneAndUpdate(
      { patientId: req.user._id, medicationId: med._id, scheduledFor },
      {
        $set: {
          status,
          recordedAt: new Date(),
          scheduleVersion: version.version,
        },
      },
      { upsert: true, new: true },
    ),
  });
});
r.get("/patients/:id/care-plans", async (req, res) => {
  await access(req, req.params.id);
  res.json({
    data: await Plan.find({ patientId: req.params.id })
      .sort({ dueAt: 1 })
      .lean(),
  });
});
r.post("/patients/:id/care-plans", async (req, res) => {
  await access(req, req.params.id);
  if (req.user.role !== "clinician")
    throw fail(403, "FORBIDDEN", "Only an assigned clinician can create plans");
  const b = z
    .object({ title: z.string().min(3).max(300), dueAt: z.iso.datetime() })
    .strict()
    .parse(req.body);
  res
    .status(201)
    .json({
      data: await Plan.create({
        ...b,
        patientId: req.params.id,
        clinicianId: req.user._id,
      }),
    });
});
r.patch("/care-plans/:id", async (req, res) => {
  const b = z
      .object({
        version: z.number().int(),
        status: z.enum(["open", "completed"]),
      })
      .strict()
      .parse(req.body),
    plan = await Plan.findById(objectId(req.params.id));
  if (!plan) throw fail(404, "NOT_FOUND", "Plan not found");
  await access(req, plan.patientId);
  const updated = await Plan.findOneAndUpdate(
    { _id: plan._id, version: b.version },
    {
      $set: {
        status: b.status,
        completedAt: b.status === "completed" ? new Date() : null,
      },
      $inc: { version: 1 },
    },
    { new: true },
  );
  if (!updated)
    throw fail(409, "CONFLICT", "This plan changed. Refresh and try again");
  res.json({ data: updated });
});
r.use((req, res) =>
  res
    .status(404)
    .json({
      error: { code: "NOT_FOUND", message: "Unknown API route" },
      requestId: req.requestId,
    }),
);
app.use("/api", r);
app.use((err, req, res, next) => {
  const validation = err instanceof z.ZodError,
    status = validation ? 400 : err.code === 11000 ? 409 : err.status || 503;
  res
    .status(status)
    .json({
      error: {
        code: validation
          ? "VALIDATION"
          : err.code === 11000
            ? "CONFLICT"
            : typeof err.code === "string"
              ? err.code
              : "SERVICE_UNAVAILABLE",
        message: validation
          ? err.issues.map((i) => i.message).join(". ")
          : err.code === 11000
            ? "This record already exists"
            : err.status
              ? err.message
              : "Service temporarily unavailable. Please retry.",
      },
      requestId: req.requestId,
    });
});
