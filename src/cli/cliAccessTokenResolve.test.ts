import { expect, test } from "bun:test"
import { cliAccessTokenResolve } from "./cliAccessTokenResolve.js"

test("access-token resolution validates environment values as non-empty CLI strings", () => {
  expect(cliAccessTokenResolve(undefined, { LEXWARE_TOKEN: "token" })).toEqual({ success: true, data: "token" })
  expect(
    cliAccessTokenResolve(undefined, {
      LEXWARE_TOKEN: "token",
      LEXWARE_API_KEY: "api-key",
      LEXWARE_ACCESS_TOKEN: "legacy-token",
    }),
  ).toEqual({ success: true, data: "token" })
  expect(
    cliAccessTokenResolve(undefined, { LEXWARE_API_KEY: "api-key", LEXWARE_ACCESS_TOKEN: "legacy-token" }),
  ).toEqual({ success: true, data: "api-key" })
  expect(cliAccessTokenResolve(undefined, { LEXWARE_ACCESS_TOKEN: "legacy-token" })).toEqual({
    success: true,
    data: "legacy-token",
  })
  expect(
    cliAccessTokenResolve("option-token", {
      LEXWARE_TOKEN: "token",
      LEXWARE_API_KEY: "api-key",
      LEXWARE_ACCESS_TOKEN: "legacy-token",
    }),
  ).toEqual({ success: true, data: "option-token" })
  expect(cliAccessTokenResolve(undefined, { LEXWARE_TOKEN: "" })).toEqual({
    success: false,
    op: "cliAccessTokenResolve",
    errorMessage:
      "An access token is required via --access-token, LEXWARE_TOKEN, LEXWARE_API_KEY, or LEXWARE_ACCESS_TOKEN",
  })
})
