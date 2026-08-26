const lexwareE2eRequestIntervalMilliseconds = 1_000
const lexwareE2eRateLimitRetries = 3

export function lexwareE2eFetchCreate(fetchFn: typeof globalThis.fetch = globalThis.fetch) {
  let requestQueue: Promise<void> = Promise.resolve()
  let nextRequestAt = 0

  return (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const request = requestQueue.then(async () => {
      let response: Response | undefined

      for (let attempt = 0; attempt <= lexwareE2eRateLimitRetries; attempt += 1) {
        const waitMilliseconds = nextRequestAt - Date.now()
        if (waitMilliseconds > 0) await Bun.sleep(waitMilliseconds)

        response = await fetchFn(input, init)
        nextRequestAt = Date.now() + lexwareE2eRequestIntervalMilliseconds
        if (response.status !== 429 || attempt === lexwareE2eRateLimitRetries) return response

        const retryAfter = Number(response.headers.get("Retry-After"))
        const retryAfterMilliseconds = Number.isFinite(retryAfter) ? retryAfter * 1_000 : 0
        await Bun.sleep(Math.max(lexwareE2eRequestIntervalMilliseconds, retryAfterMilliseconds))
      }

      throw new Error("Live E2E request retry loop ended unexpectedly")
    })

    requestQueue = request.then(
      () => undefined,
      () => undefined,
    )
    return request
  }
}
