import { test as setup } from '@playwright/test';
import fs from 'fs'

const authFile = ".auth/user.json"

setup("authentication", async ({ request }) => {
  // await page.goto("https://conduit.bondaracademy.com/")
  // await page.getByText("Sign in").click()
  // await page.getByRole("textbox", { name: "Email" }).fill("gokay@test.com")
  // await page.getByRole("textbox", { name: "Password" }).fill("test1234")
  // await page.getByRole("button", { name: "Sign in" }).click()
  // await page.waitForResponse("https://conduit-api.bondaracademy.com/api/tags")
  // await page.context().storageState({path: authFile})

  const response = await request.post("https://conduit-api.bondaracademy.com/api/users/login", {
    data: {
      user: { email: "gokay@test.com", password: "test1234" }
    }
  })
  const responseBody = await response.json()
  const accessToken = responseBody.user.token

  // Create auth directory if it doesn't exist
  if (!fs.existsSync('.auth')) {
    fs.mkdirSync('.auth', { recursive: true })
  }

  // Initialize user object structure
  const user = {
    origins: [
      {
        origin: "https://conduit.bondaracademy.com",
        localStorage: [
          {
            name: "jwtToken",
            value: accessToken
          }
        ]
      }
    ]
  }

  fs.writeFileSync(authFile, JSON.stringify(user))
  process.env['ACCESS_TOKEN'] = accessToken

})
