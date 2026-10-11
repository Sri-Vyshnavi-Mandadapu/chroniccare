import { z } from "zod";
export const readingSchema = z
  .discriminatedUnion("type", [
    z
      .object({
        type: z.literal("glucose"),
        value: z.number().positive().max(1500),
        unit: z.enum(["mg/dL", "mmol/L"]),
        measuredAt: z.iso.datetime(),
        context: z.enum(["fasting", "post-meal", "random"]),
        clientRequestId: z.uuid(),
      })
      .strict(),
    z
      .object({
        type: z.literal("blood-pressure"),
        systolic: z.number().int().min(30).max(350),
        diastolic: z.number().int().min(20).max(250),
        unit: z.literal("mmHg"),
        measuredAt: z.iso.datetime(),
        context: z.enum(["resting", "after-activity"]),
        clientRequestId: z.uuid(),
      })
      .strict(),
  ])
  .superRefine((v, c) => {
    if (new Date(v.measuredAt) > new Date())
      c.addIssue({
        code: "custom",
        message: "Measurement cannot be in the future",
      });
    if (v.type === "blood-pressure" && v.diastolic >= v.systolic)
      c.addIssue({
        code: "custom",
        message: "Systolic must be greater than diastolic",
      });
    if (v.type === "glucose" && v.unit === "mmol/L" && v.value > 83)
      c.addIssue({
        code: "custom",
        message: "Check the glucose value and unit",
      });
  });
export function summarize(readings) {
  const values = readings
    .filter((r) => r.type === "glucose")
    .map((r) => (r.unit === "mmol/L" ? r.value * 18.0182 : r.value));
  return {
    count: readings.length,
    glucose: {
      count: values.length,
      mean: values.length
        ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
        : null,
      min: values.length ? Math.min(...values) : null,
      max: values.length ? Math.max(...values) : null,
    },
    readings: readings.map((r) =>
      r.type === "glucose"
        ? {
            ...r,
            normalizedValue: r.unit === "mmol/L" ? r.value * 18.0182 : r.value,
          }
        : r,
    ),
  };
}
export function mayAccess(user, patientId, link) {
  return (
    (user.role === "patient" && String(user._id) === String(patientId)) ||
    (user.role === "clinician" &&
      user.status === "active" &&
      link?.status === "active" &&
      String(link.patientId) === String(patientId) &&
      String(link.clinicianId) === String(user._id))
  );
}
