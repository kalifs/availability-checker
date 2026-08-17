import { expect, test } from "@playwright/test";

interface RestaurantStatus {
  id: string;
  branch: string;
  platformUrl: string;
  mismatch: boolean;
}

async function getApiRestaurants(request: import("@playwright/test").APIRequestContext, baseURL: string) {
  const res = await request.get(`${baseURL}/restaurants`);
  expect(res.ok()).toBeTruthy();
  const body = (await res.json()) as { restaurants: RestaurantStatus[] };
  return body.restaurants;
}

const BACKEND_URL = "http://localhost:3101";

function branchRowLocator(page: import("@playwright/test").Page, branch: string) {
  // Escape regex metacharacters so branch names like "Croydon - Swan Close (delivery kitchen)" match literally.
  const escaped = branch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return page.getByRole("row", { name: new RegExp(escaped) });
}

test("dashboard lists every tracked restaurant with a working listing link", async ({ page, request }) => {
  const apiRestaurants = await getApiRestaurants(request, BACKEND_URL);
  expect(apiRestaurants.length).toBeGreaterThan(0);

  await page.goto("/");
  await expect(page.getByRole("row")).toHaveCount(apiRestaurants.length + 1); // +1 header row

  for (const restaurant of apiRestaurants) {
    const row = branchRowLocator(page, restaurant.branch);
    await expect(row).toBeVisible();
    await expect(row.getByRole("link", { name: "view" })).toHaveAttribute("href", restaurant.platformUrl);
  }
});

test("highlights exactly the rows the API marks as a mismatch, and no others", async ({ page, request }) => {
  const apiRestaurants = await getApiRestaurants(request, BACKEND_URL);

  await page.goto("/");
  await expect(page.getByRole("table")).toBeVisible();

  for (const restaurant of apiRestaurants) {
    const row = branchRowLocator(page, restaurant.branch);
    const hasMismatchClass = await row.evaluate((el) => el.classList.contains("mismatch"));
    expect(hasMismatchClass, `row for "${restaurant.branch}"`).toBe(restaurant.mismatch);
  }
});

test("shows an error message when the backend is unreachable", async ({ page }) => {
  await page.route("**/restaurants", (route) => route.abort());

  await page.goto("/");

  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByRole("alert")).toContainText("Could not reach the backend");
});

test("refresh button re-fetches restaurant data", async ({ page }) => {
  let requestCount = 0;
  await page.route("**/restaurants", (route) => {
    requestCount++;
    return route.continue();
  });

  await page.goto("/");
  await expect(page.getByRole("table")).toBeVisible();
  expect(requestCount).toBe(1);

  await page.getByRole("button", { name: "Refresh" }).click();
  await expect.poll(() => requestCount).toBe(2);
});
