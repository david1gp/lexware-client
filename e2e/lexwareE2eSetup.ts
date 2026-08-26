import { lexwareClientCreate } from "../dist/index.js"
import { lexwareE2eFetchCreate } from "./lexwareE2eFetchCreate.js"

export function lexwareE2eSetup() {
  const accessToken = Bun.env.LEXWARE_API_KEY?.trim()
  if (!accessToken) {
    throw new Error("LEXWARE_API_KEY is required for live E2E; add it to .env before running bun run test:e2e")
  }

  const queuedFetch = lexwareE2eFetchCreate()
  const tracedFetch: typeof queuedFetch = async (input, init) => {
    const response = await queuedFetch(input, init)
    const url = new URL(String(input))
    const endpoint = url.pathname.replace(/\/[0-9a-f-]{36}(?=\/|$)/gi, "/:id")
    console.info(`Live E2E endpoint outcome: ${init?.method ?? "GET"} ${endpoint} -> HTTP ${response.status}`)
    return response
  }

  const result = lexwareClientCreate({ accessToken, fetch: tracedFetch })
  if (!result.success) throw new Error("Unable to initialize the live Lexware E2E client")
  return result.data
}
