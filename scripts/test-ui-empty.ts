import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true });
const page = await (await browser.newContext()).newPage();
page.on("console", (m) => console.log("[browser]", m.text()));
await page.goto("http://localhost:3737/", { waitUntil: "networkidle" });
await page.waitForSelector("textarea");
// Click button without filling niche
const btn = page.locator("button:has-text('Generate 3 concepts')");
console.log("disabled (empty)?", await btn.evaluate((el: HTMLButtonElement) => el.disabled));
// Try force click anyway, then short niche
const ta = page.locator("textarea");
await ta.type("abc"); // 3 chars, below 6
console.log("disabled (3 chars)?", await btn.evaluate((el: HTMLButtonElement) => el.disabled));
await ta.fill("abc def ghi jkl"); // 15 chars
console.log("disabled (15 chars)?", await btn.evaluate((el: HTMLButtonElement) => el.disabled));
await browser.close();
