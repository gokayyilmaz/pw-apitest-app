import { test, expect } from '@playwright/test';
import tags from "../test-data/tags.json"

let random: number;

test.beforeEach(async ({ page, request }) => {
  // Generate a random integer in the range [1000, 5000]
  random = Math.floor(Math.random() * (5000 - 1000 + 1)) + 1000;
  await page.goto("https://conduit.bondaracademy.com/")
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

  const articleResponse = await request.post("https://conduit-api.bondaracademy.com/api/articles/", {
    data: {
      article: { title: `Test title ${random}`, description: `Test description ${random}`, body: `Test body ${random}`, tagList: [] }
    }
  })
  expect(articleResponse.status()).toBe(201)

  await page.getByText("Global Feed").click()
  await page.getByText(`Test title ${random}`).click()
  await page.getByRole("button", { name: "Delete Article" }).first().click()
  await page.getByText("Global Feed").click()
  await expect(page.locator("app-article-list h1").first()).not.toContainText(`Test title ${random}`)

})

test("create article - delete article - waitForResponse", async ({ page }) => {
  await page.getByText("New Article").click()
  await page.getByRole("textbox", { name: "Article Title" }).fill(`Test title ${random}`)
  await page.getByRole("textbox", { name: "What's this article about?" }).fill(`Test description ${random}`)
  await page.getByRole("textbox", { name: "Write your article (in markdown)" }).fill(`Test body ${random}`)
  await page.getByRole("button", { name: "Publish Article" }).click()
  const articleResponse = await page.waitForResponse("https://conduit-api.bondaracademy.com/api/articles/")
  const articleResponseBody = await articleResponse.json()
  const slugId = articleResponseBody.article.slug
  await expect(page.locator(".article-page h1")).toHaveText(`Test title ${random}`)

  await page.getByText("Home").click()
  await page.getByText("Global Feed").click()
  await expect(page.locator("app-article-list h1").first()).toHaveText(`Test title ${random}`)

  const deleteArticleResponse = await page.request.delete(`https://conduit-api.bondaracademy.com/api/articles/${slugId}`)
  expect(deleteArticleResponse.status()).toBe(204)

  await page.getByText("Global Feed").click()
  await expect(page.locator("app-article-list h1").first()).not.toHaveText(`Test title ${random}`)

})

