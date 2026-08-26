import * as a from "valibot"
import { createResult, createResultError, type Result } from "#result"
import { cliOptionSchemas } from "./cliOptionSchemas.js"

export type CliEnvironment = Readonly<Record<string, string | undefined>>

export function cliAccessTokenResolve(accessToken?: string, environment: CliEnvironment = process.env): Result<string> {
  const op = "cliAccessTokenResolve"
  const token =
    accessToken ?? environment.LEXWARE_TOKEN ?? environment.LEXWARE_API_KEY ?? environment.LEXWARE_ACCESS_TOKEN
  const parsed = a.safeParse(cliOptionSchemas.nonEmptyString, token)
  if (!parsed.success) {
    return createResultError(
      op,
      "An access token is required via --access-token, LEXWARE_TOKEN, LEXWARE_API_KEY, or LEXWARE_ACCESS_TOKEN",
    )
  }

  return createResult(parsed.output)
}
