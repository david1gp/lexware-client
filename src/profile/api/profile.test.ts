import { expect, test } from "bun:test"
import { lexwareJsonResponse, lexwareTestClient } from "../../shared/lexwareTestClient.test.js"
import { profileGet } from "./profileGet.js"

test("profileGet retrieves and parses official profile information", async () => {
  const response = {
    organizationId: "aa93e8a8-2aa3-470b-b914-caad8a255dd8",
    companyName: "Testfirma GmbH",
    created: {
      userId: "1aea5501-3f3e-403d-8492-2dad03016289",
      userName: "Frau Erika Musterfrau",
      userEmail: "erika.musterfrau@testfirma.de",
      date: "2017-01-03T13:15:45.000+01:00",
    },
    connectionId: "3dea098a-fae5-4458-a85c-f97965966c25",
    features: ["cashbox"],
    businessFeatures: ["INVOICING", "INVOICING_PRO", "BOOKKEEPING"],
    subscriptionStatus: "active",
    taxType: "net",
    smallBusiness: false,
  }
  const { client, calls } = lexwareTestClient([lexwareJsonResponse(response)])

  const result = await profileGet(client)

  expect(result.success).toBe(true)
  if (result.success) expect(result.data).toMatchObject(response)
  expect(String(calls[0]?.input)).toBe("https://api.lexware.io/v1/profile")
  expect(calls[0]?.init?.method).toBe("GET")
})

test("profileGet rejects an invalid profile response", async () => {
  const { client } = lexwareTestClient([lexwareJsonResponse({ taxType: "other" })])

  const result = await profileGet(client)

  expect(result.success).toBe(false)
})
