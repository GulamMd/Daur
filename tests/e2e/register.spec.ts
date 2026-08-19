import { test, expect } from "@playwright/test";

/**
 * The one path that matters, driven through a real browser:
 *
 *   sign up → add two people → register both → see both in history
 *
 * HTTP-level tests already cover the transaction and its constraints. What
 * only a browser can catch is hydration failing, the step machine not
 * advancing, or a form control that cannot actually be operated.
 *
 * The account it creates is cleaned up by `npm run test:e2e`, which chains
 * scripts/clean-e2e.ts afterwards.
 */

const EMAIL = `e2e-${Date.now()}@daur.test`;
const PASSWORD = "correct-horse-battery";
const SLUG = "daur-bengaluru-edition-04";

test("a runner signs up, adds their crew, and registers everyone", async ({ page }) => {
  // --- sign up ------------------------------------------------------------
  await page.goto("/signup");
  await page.getByLabel("Full name").fill("Gulam Khalid");
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();

  // Signup logs straight in — the point is getting back to registering.
  await expect(page).toHaveURL(/\/account\/registrations/);
  await expect(page.getByText("No races coming up")).toBeVisible();

  // --- add two people -----------------------------------------------------
  await page.goto("/account/participants");
  await page.getByRole("link", { name: "Add someone" }).click();
  await expect(page.getByRole("heading", { name: "Add yourself" })).toBeVisible();

  // Prefilled from the account, applied after hydration.
  await expect(page.getByLabel("Full name")).toHaveValue("Gulam Khalid");
  await page.getByLabel("Date of birth").fill("1994-03-02");
  await page.getByLabel("Gender").selectOption("MALE");
  await page.getByLabel("Mobile number").fill("9876543210");
  await page.getByRole("button", { name: "Add person" }).click();

  await expect(page).toHaveURL(/\/account\/participants$/);
  await expect(page.getByText("Gulam Khalid")).toBeVisible();
  await expect(page.getByText("You", { exact: true })).toBeVisible();

  await page.getByRole("link", { name: "Add someone" }).click();
  await page.getByLabel("Full name").fill("Aisha Khalid");
  await page.getByLabel("Date of birth").fill("2010-09-14");
  await page.getByLabel("Gender").selectOption("FEMALE");
  await page.getByLabel("Mobile number").fill("9876500000");
  await page.getByRole("button", { name: "Add person" }).click();
  await expect(page.getByText("Aisha Khalid")).toBeVisible();

  // --- register -----------------------------------------------------------
  await page.goto(`/events/${SLUG}`);
  await page.getByRole("link", { name: "Register", exact: true }).first().click();
  await expect(page).toHaveURL(new RegExp(`/events/${SLUG}/register`));

  // Step 1: distance. Aisha turns 16 the day AFTER the race, so she is 15 on
  // race day and the 10K (16+) must exclude her.
  await expect(page.getByRole("heading", { name: "Pick your distance" })).toBeVisible();
  await page.getByRole("button", { name: /^10K/ }).click();

  // Step 2: people.
  await expect(page.getByRole("heading", { name: /running the 10K/ })).toBeVisible();
  const aisha = page.getByRole("checkbox").nth(1);
  await expect(aisha).toBeDisabled();
  await expect(page.getByText(/needs a minimum age of 16/)).toBeVisible();

  // Back to a distance she can enter.
  await page.getByRole("button", { name: "Back" }).click();
  await page.getByRole("button", { name: /^5K/ }).click();

  const boxes = page.getByRole("checkbox");
  await boxes.nth(0).check();
  await boxes.nth(1).check();
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 3: review.
  await expect(page.getByRole("heading", { name: "Check and confirm" })).toBeVisible();
  await expect(page.getByText("Gulam Khalid")).toBeVisible();
  await expect(page.getByText("Aisha Khalid")).toBeVisible();

  const confirm = page.getByRole("button", { name: /Register 2 people/ });
  await expect(confirm).toBeDisabled(); // terms not accepted yet
  await page.getByRole("checkbox").last().check();
  await expect(confirm).toBeEnabled();
  await confirm.click();

  // --- confirmation -------------------------------------------------------
  await expect(page).toHaveURL(/\/register\/success\?group=/);
  await expect(page.getByRole("heading", { name: "2 entries confirmed." })).toBeVisible();
  const refs = page.locator("text=/DBE26-\\d{4}/");
  await expect(refs).toHaveCount(2);

  // --- history ------------------------------------------------------------
  await page.getByRole("link", { name: "My registrations" }).click();
  await expect(page).toHaveURL(/\/account\/registrations/);
  await expect(page.getByRole("heading", { name: "Your registrations" })).toBeVisible();
  await expect(page.getByText("Daur Bengaluru Edition 04").first()).toBeVisible();
  await expect(page.getByText("Confirmed").first()).toBeVisible();

  // Both entries are listed.
  await expect(page.locator("text=/DBE26-\\d{4}/")).toHaveCount(2);
});
