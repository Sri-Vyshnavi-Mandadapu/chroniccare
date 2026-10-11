import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { randomUUID } from "node:crypto";
import {
  readingSchema,
  summarize,
  mayAccess,
} from "../server/services/rules.js";
import { occurrences } from "../src/lib/demo.js";
import { app } from "../server/app.js";
const valid = {
  type: "glucose",
  value: 112,
  unit: "mg/dL",
  context: "fasting",
  measuredAt: "2026-01-01T03:00:00.000Z",
  clientRequestId: randomUUID(),
};
test("valid glucose and paired blood pressure are accepted", () => {
  assert.equal(readingSchema.parse(valid).value, 112);
  assert.equal(
    readingSchema.parse({
      type: "blood-pressure",
      systolic: 122,
      diastolic: 80,
      unit: "mmHg",
      context: "resting",
      measuredAt: valid.measuredAt,
      clientRequestId: randomUUID(),
    }).diastolic,
    80,
  );
});
test("unknown fields, operator payloads, wrong units and future dates are rejected", () => {
  for (const b of [
    { ...valid, patientId: "someone-else" },
    { ...valid, value: { $gt: 0 } },
    { ...valid, unit: "mmHg" },
    { ...valid, measuredAt: "2999-01-01T00:00:00.000Z" },
    { ...valid, unit: "mmol/L", value: 112 },
  ])
    assert.equal(readingSchema.safeParse(b).success, false);
});
test("patients are isolated and admin has no implicit clinical access", () => {
  assert.equal(mayAccess({ _id: "a", role: "patient" }, "a"), true);
  assert.equal(mayAccess({ _id: "a", role: "patient" }, "b"), false);
  assert.equal(mayAccess({ _id: "a", role: "admin" }, "b"), false);
});
test("clinician access requires a matching active link and is denied after revocation", () => {
  const c = { _id: "c", role: "clinician", status: "active" },
    l = { clinicianId: "c", patientId: "p", status: "active" };
  assert.equal(mayAccess(c, "p", l), true);
  assert.equal(mayAccess(c, "p", { ...l, status: "revoked" }), false);
  assert.equal(mayAccess(c, "other", l), false);
  assert.equal(mayAccess(c, "p", { ...l, clinicianId: "other" }), false);
});
test("analytics normalize units and preserve empty measurements", () => {
  const s = summarize([valid, { ...valid, value: 6, unit: "mmol/L" }]);
  assert.equal(s.glucose.count, 2);
  assert.equal(s.glucose.mean, 110);
  assert.equal(summarize([]).glucose.mean, null);
});
test("scheduled occurrences honor timezone, schedule versions and future doses", () => {
  const medication = {
    _id: "m",
    startAt: "2026-01-01T00:00:00Z",
    scheduleVersions: [
      {
        version: 1,
        effectiveAt: "2026-01-01T00:00:00Z",
        times: ["08:00", "20:00"],
        asNeeded: false,
      },
      {
        version: 2,
        effectiveAt: "2026-01-02T00:00:00Z",
        times: ["08:00"],
        asNeeded: false,
      },
    ],
  };
  const result = occurrences(
    [medication],
    2,
    new Date("2026-01-02T01:00:00Z"),
    "Asia/Kolkata",
  );
  assert.equal(result.length, 3);
  assert.equal(result.filter((o) => o.due).length, 2);
  assert.equal(result.at(-1).scheduledFor, "2026-01-02T02:30:00.000Z");
  assert.equal(
    occurrences(
      [
        {
          ...medication,
          scheduleVersions: [
            { ...medication.scheduleVersions[0], asNeeded: true },
          ],
        },
      ],
      1,
      new Date(),
      "Asia/Kolkata",
    ).length,
    0,
  );
});
test("health endpoint responds without claiming database readiness", async () => {
  const res = await request(app).get("/api/health");
  assert.equal(res.status, 200);
  assert.equal(res.body.data.ok, true);
  assert.equal(res.headers["cache-control"], "no-store");
});
test("preauthentication CSRF is random, cookie-bound and HttpOnly", async () => {
  const a = await request(app).get("/api/auth/csrf"),
    b = await request(app).get("/api/auth/csrf");
  assert.equal(a.status, 200);
  assert.notEqual(a.body.data.csrf, b.body.data.csrf);
  assert.match(a.headers["set-cookie"][0], /HttpOnly/);
  assert.match(a.headers["set-cookie"][0], /SameSite=Strict/);
});
test("missing database returns safe actionable error", async () => {
  const old = process.env.MONGODB_URI;
  delete process.env.MONGODB_URI;
  try {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com", password: "example-pass" });
    assert.equal(res.status, 503);
    assert.equal(res.body.error.code, "DATABASE_NOT_CONFIGURED");
    assert.equal(JSON.stringify(res.body).includes("stack"), false);
  } finally {
    if (old) process.env.MONGODB_URI = old;
  }
});
