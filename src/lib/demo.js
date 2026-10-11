export function createDemo() {
  const now = new Date();
  const at = (days, hour) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    d.setHours(hour, 0, 0, 0);
    if (d > now) d.setDate(d.getDate() - 1);
    return d.toISOString();
  };
  return {
    readings: Array.from({ length: 30 }, (_, i) => [
      {
        _id: `g${i}`,
        type: "glucose",
        value: [112, 118, 109, 124, 116, 108, 114][i % 7],
        unit: "mg/dL",
        context: i % 3 ? "fasting" : "post-meal",
        measuredAt: at(-i, 8),
      },
      {
        _id: `b${i}`,
        type: "blood-pressure",
        systolic: [122, 126, 119, 124, 120][i % 5],
        diastolic: [79, 82, 77, 80, 78][i % 5],
        unit: "mmHg",
        context: "resting",
        measuredAt: at(-i, 9),
      },
    ]).flat(),
    medications: [
      {
        _id: "m1",
        name: "Metformin",
        instructions: "500 mg · with breakfast",
        provenance: "synthetic clinician plan",
        startAt: at(-30, 0),
        scheduleVersions: [
          {
            version: 1,
            effectiveAt: at(-30, 0),
            times: ["08:00"],
            asNeeded: false,
          },
        ],
      },
      {
        _id: "m2",
        name: "Amlodipine",
        instructions: "5 mg · once daily",
        provenance: "synthetic clinician plan",
        startAt: at(-30, 0),
        scheduleVersions: [
          {
            version: 1,
            effectiveAt: at(-30, 0),
            times: ["20:00"],
            asNeeded: false,
          },
        ],
      },
    ],
    doses: [],
    plans: [
      {
        _id: "p1",
        title: "Bring your reading log to your follow-up",
        dueAt: new Date(now.getTime() + 3 * 86400000).toISOString(),
        status: "open",
        version: 1,
      },
      {
        _id: "p2",
        title: "Review your medication schedule with your care team",
        dueAt: new Date(now.getTime() + 6 * 86400000).toISOString(),
        status: "open",
        version: 1,
      },
    ],
    links: [
      {
        _id: "l1",
        name: "Dr. Maya Chen",
        specialty: "Your demo care team",
        status: "active",
      },
    ],
  };
}
export function loadDemo() {
  try {
    const stored = JSON.parse(localStorage.getItem("chroniccare-demo-v1"));
    if (
      stored?.readings &&
      stored?.medications &&
      stored?.plans &&
      stored?.doses &&
      stored?.links
    )
      return stored;
  } catch {}
  return createDemo();
}
export function saveDemo(data) {
  localStorage.setItem("chroniccare-demo-v1", JSON.stringify(data));
}
export function occurrences(
  medications,
  days = 1,
  now = new Date(),
  timezone = Intl.DateTimeFormat().resolvedOptions().timeZone,
) {
  const out = [];
  const parts = (d) =>
    Object.fromEntries(
      new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
      })
        .formatToParts(d)
        .filter((p) => p.type !== "literal")
        .map((p) => [p.type, p.value]),
    );
  const today = parts(now);
  for (let i = 0; i < days; i++) {
    const day = new Date(
      Date.UTC(+today.year, +today.month - 1, +today.day - i),
    );
    for (const med of medications) {
      for (const v of med.scheduleVersions) {
        if (v.asNeeded) continue;
        for (const time of v.times) {
          const [hour, minute] = time.split(":").map(Number);
          const target = Date.UTC(
            day.getUTCFullYear(),
            day.getUTCMonth(),
            day.getUTCDate(),
            hour,
            minute,
          );
          let date = new Date(target);
          for (let j = 0; j < 3; j++) {
            const p = parts(date);
            const local = Date.UTC(
              +p.year,
              +p.month - 1,
              +p.day,
              +p.hour,
              +p.minute,
              +p.second,
            );
            date = new Date(+date + target - local);
          }
          const active = [...med.scheduleVersions]
            .reverse()
            .find((s) => new Date(s.effectiveAt) <= date);
          if (
            active?.version !== v.version ||
            date < new Date(med.startAt) ||
            (med.endAt && date > new Date(med.endAt))
          )
            continue;
          out.push({
            medication: med,
            scheduledFor: date.toISOString(),
            time,
            status: "unknown",
            due: date <= now,
          });
        }
      }
    }
  }
  return out.sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));
}
