import { test, expect } from '@playwright/test';
import tags from "../test-data/tags.json"

test.beforeEach(async ({ page }) => {
  await page.goto("https://conduit.bondaracademy.com/")
  await page.getByText("Sign in").click()
  await page.getByRole("textbox", { name: "Email" }).fill("gokay@test.com")
  await page.getByRole("textbox", { name: "Password" }).fill("test1234")
  await page.getByRole("button", { name: "Sign in" }).click()
})

test('mock api - modify api response', async ({ page }) => {
  await page.route("**/api/tags", async route => {
    await route.fulfill({
      body: JSON.stringify(tags)
    })
  })

  await page.route("**/api/articles*", async route => {
    const response = await route.fetch()
    const responseBody = await response.json()
    responseBody.articles[0].title = "This is a MOCK test title"
    responseBody.articles[0].description = "This is a MOCK test description"

    await route.fulfill({
      body: JSON.stringify(responseBody)
    })
  })

  await expect(page.locator(".navbar-brand")).toHaveText("conduit")
  await expect(page.locator(".tag-list")).toContainText("automation")
  await expect(page.locator("app-article-list h1").first()).toHaveText("This is a MOCK test title")
  await expect(page.locator("app-article-list p").first()).toHaveText("This is a MOCK test description")
});

test("api request - delete article", async ({ page, request }) => {
  const response = await request.post("https://conduit-api.bondaracademy.com/api/users/login", {
    data: {
      user: { email: "gokay@test.com", password: "test1234" }
    }
  })

  const responseBody = await response.json()
  const accessToken = responseBody.user.token
  // Generate a random integer in the range [1000, 5000]
  const random = Math.floor(Math.random() * (5000 - 1000 + 1)) + 1000;

  const articleResponse = await request.post("https://conduit-api.bondaracademy.com/api/articles/", {
    data: {
      article: { title: `Test title ${random}`, description: `Test description ${random}`, body: `Test body ${random}`, tagList: [] }
    },
    headers: {
      Authorization: `Token ${accessToken}`
    }
  })

  expect(articleResponse.status()).toBe(201)

  await page.getByText("Global Feed").click()
  await page.getByText(`Test title ${random}`).click()
  await page.getByRole("button", { name: "Delete Article" }).first().click()
  await page.getByText("Global Feed").click()
  await expect(page.locator("app-article-list h1").first()).not.toContainText(`Test title ${random}`)


})

