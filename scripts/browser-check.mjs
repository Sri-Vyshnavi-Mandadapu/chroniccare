import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const baseURL=process.env.CHECK_BASE_URL || "http://localhost:5173";
  await page.goto(baseURL);
  await page
    .getByRole("heading", { name: "Your health story. All in one place." })
    .waitFor();
  await page.screenshot({
    path: "artifacts/landing-desktop.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "Explore the demo" }).click();
  await page.getByRole("heading", { name: "A little care, Alex." }).waitFor();
  await page.getByRole("button", { name: "Add reading", exact: true }).click();
  await page.getByLabel("Glucose value").fill("117");
  await page.getByRole("button", { name: "Save reading" }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page.getByRole("status").waitFor();
  await page.reload();
  await page.getByRole("heading", { name: "A little care, Alex." }).waitFor();
  assert.ok(
    await page
      .locator(".stat-value")
      .first()
      .innerText()
      .then((t) => t.includes("117")),
  );
  await page.screenshot({
    path: "artifacts/dashboard-desktop.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "My readings", exact: true }).click();
  await page.getByRole("button", { name: "Table view" }).click();
  await page.getByRole("columnheader", { name: "Measured" }).first().waitFor();
  await page
    .getByRole("link", { name: "Follow-ups", exact: false })
    .first()
    .click();
  await page.getByRole("button", { name: "Mark complete" }).first().click();
  await page.getByRole("button", { name: "Reopen" }).waitFor();
  await page.getByRole("link", { name: "Care team", exact: true }).click();
  await page.getByRole("button", { name: "Revoke access" }).click();
  await page
    .getByText("No active care connections. Your records are private.")
    .waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseURL}/patient/dashboard`);
  await page.getByRole("heading", { name: "A little care, Alex." }).waitFor();
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
    "No mobile horizontal overflow",
  );
  await page.screenshot({
    path: "artifacts/dashboard-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Toggle navigation" }).click();
  await page.getByRole("link", { name: "Medications", exact: true }).click();
  await page
    .getByRole("heading", { name: "A little consistency, every day." })
    .waitFor();
  assert.equal(errors.length, 0, errors.join("\n"));
  console.log(
    "PASS: landing, demo entry, reading save + reload, chart table, follow-up, sharing revocation, mobile layout and navigation.",
  );
} finally {
  await browser.close();
}
