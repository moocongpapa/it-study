import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const pages = ["/roadmap", "/dashboard", "/practice", "/login"];

function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });
  return errors;
}

for (const path of pages) {
  test.describe(path, () => {
    test("오류 없이 열리고 가로 스크롤이 없다", async ({ page }) => {
      const errors = collectErrors(page);
      const response = await page.goto(path, { waitUntil: "networkidle" });
      expect(response?.status(), "HTTP 상태").toBeLessThan(400);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, "가로 넘침(px)").toBeLessThanOrEqual(1);
      expect(errors, errors.join("\n")).toEqual([]);
    });

    test("접근성 심각 위반이 없다 (axe)", async ({ page }) => {
      await page.goto(path, { waitUntil: "networkidle" });
      const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
      const serious = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(serious.map((v) => `${v.id}: ${v.help} (${v.nodes.length}곳)`), "axe").toEqual([]);
    });
  });
}

test("주제를 열면 학습 패널이 나타나고 키보드로 단계 전환·접근성 검사를 통과한다", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("/roadmap", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /학습하기/ }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("h2").first()).not.toBeEmpty();

  const levelTabs = dialog.getByRole("tab");
  await expect(levelTabs).toHaveCount(4);
  await levelTabs.first().focus();
  await page.keyboard.press("ArrowRight");
  await expect(levelTabs.nth(1)).toHaveAttribute("aria-selected", "true");

  const { violations } = await new AxeBuilder({ page }).include("[role='dialog']").withTags(["wcag2a", "wcag2aa"]).analyze();
  const serious = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(serious.map((v) => `${v.id}: ${v.help} (${v.nodes.length}곳)`), "reader dialog axe").toEqual([]);
  expect(errors, errors.join("\n")).toEqual([]);
});

