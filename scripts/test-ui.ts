// Drives the home page like a real user does. Captures the seed POST response so we can see why it 400s.
import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext();
const page = await ctx.newPage();

page.on("console", (m) => console.log("[browser console]", m.type(), m.text()));
page.on("pageerror", (e) => console.log("[browser pageerror]", e.message));

const seedRespPromise = page.waitForResponse(
  (r) => r.url().endsWith("/api/seed") && r.request().method() === "POST",
  { timeout: 90_000 }
);

await page.goto("http://localhost:3737/", { waitUntil: "networkidle" });
await page.waitForSelector("textarea", { timeout: 8000 });

const ta = page.locator("textarea");
await ta.click();
await ta.type("AI hackathon judge in Singapore who would secretly love to start a podcast.", { delay: 5 });

// Probe state
const taValue = await ta.inputValue();
console.log("textarea value len:", taValue.length);
const btn = page.locator("button:has-text('Generate 3 concepts')");
const btnDisabled = await btn.evaluate((el: HTMLButtonElement) => el.disabled);
console.log("button disabled?", btnDisabled);

await btn.click({ force: btnDisabled, trial: false });

const resp = await seedRespPromise;
const reqBody = resp.request().postData();
console.log("REQUEST BODY:", reqBody);
console.log("RESPONSE STATUS:", resp.status());
console.log("RESPONSE BODY:", (await resp.text()).slice(0, 2000));

await page.waitForTimeout(1500);
const url = page.url();
const errCount = await page.locator(".text-flame").count();
const errText = errCount > 0 ? await page.locator(".text-flame").first().textContent() : "(no error)";
console.log("AFTER URL:", url);
console.log("UI ERROR:", errText);

await page.screenshot({ path: "/tmp/auteur-smoke/ui-after.png", fullPage: true });
console.log("screenshot: /tmp/auteur-smoke/ui-after.png");

await browser.close();
