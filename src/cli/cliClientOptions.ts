import { cliOptionCreate } from "./cliOptionCreate.js"
import { cliOptionSchemas } from "./cliOptionSchemas.js"

export const cliClientOptions = {
  accessToken: cliOptionCreate(cliOptionSchemas.id, "Lexware API access token", { optional: true }),
  baseUrl: cliOptionCreate(cliOptionSchemas.url, "Override the Lexware API base URL", { optional: true }),
  envPath: cliOptionCreate(cliOptionSchemas.nonEmptyString, "Path to the environment file", { optional: true }),
} as const
