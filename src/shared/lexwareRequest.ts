import * as a from "valibot"
import { createResult, createResultError, type PromiseResult, resultTryParsingFetchErr } from "#result"
import type { LexwareBinaryResponse } from "./LexwareBinaryResponse.js"
import type { LexwareClient } from "./LexwareClient.js"
import { lexwareErrorData } from "./lexwareErrorData.js"
import { lexwareFilenameFromContentDisposition } from "./lexwareFilenameFromContentDisposition.js"
import type { LexwareQuery } from "./lexwareQueryAppend.js"
import { lexwareQueryAppend } from "./lexwareQueryAppend.js"

export type LexwareRequestInput<TSchema extends a.GenericSchema = a.GenericSchema> = {
  op?: string
  method?: string
  path: string
  query?: LexwareQuery
  body?: unknown
  headers?: HeadersInit
  schema: TSchema
}

export type LexwareBinaryRequestInput = Omit<LexwareRequestInput, "schema"> & {
  binary: true
}

export async function lexwareRequest<TSchema extends a.GenericSchema>(
  client: LexwareClient,
  input: LexwareRequestInput<TSchema>,
): PromiseResult<a.InferOutput<TSchema>> {
  const op = input.op ?? "lexwareRequest"
  const url = new URL(input.path, client.baseUrl)
  lexwareQueryAppend(url, input.query)

  const headers = new Headers(input.headers)
  headers.set("Accept", headers.get("Accept") ?? "application/json")
  headers.set("Authorization", `Bearer ${client.accessToken}`)

  const init: RequestInit = {
    method: input.method ?? "GET",
    headers,
  }

  if (input.body !== undefined) {
    headers.set("Content-Type", headers.get("Content-Type") ?? "application/json")
    init.body = JSON.stringify(input.body)
  }

  let response: Response
  try {
    response = await client.fetch(url, init)
  } catch (error) {
    return createResultError(op, "Fetch failed", error instanceof Error ? error.message : String(error))
  }

  let text: string
  try {
    text = await response.text()
  } catch (error) {
    return createResultError(op, "Reading response failed", error instanceof Error ? error.message : String(error))
  }

  if (!response.ok) return resultTryParsingFetchErr(op, text, response.status, response.statusText)

  const textSchema = a.pipe(a.string(), a.parseJson(), input.schema)
  const parsed = text.length === 0 ? a.safeParse(input.schema, null) : a.safeParse(textSchema, text)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues), text)

  return createResult(parsed.output)
}

export async function lexwareRequestBinary(
  client: LexwareClient,
  input: LexwareBinaryRequestInput,
): PromiseResult<LexwareBinaryResponse> {
  const op = input.op ?? "lexwareRequestBinary"
  const url = new URL(input.path, client.baseUrl)
  lexwareQueryAppend(url, input.query)

  const headers = new Headers(input.headers)
  headers.set("Accept", headers.get("Accept") ?? "*/*")
  headers.set("Authorization", `Bearer ${client.accessToken}`)

  let response: Response
  try {
    response = await client.fetch(url, {
      method: input.method ?? "GET",
      headers,
    })
  } catch (error) {
    return createResultError(op, "Fetch failed", error instanceof Error ? error.message : String(error))
  }

  if (!response.ok) {
    let text: string
    try {
      text = await response.text()
    } catch (error) {
      return createResultError(op, "Reading response failed", error instanceof Error ? error.message : String(error))
    }
    return resultTryParsingFetchErr(op, text, response.status, response.statusText)
  }

  let data: ArrayBuffer
  try {
    data = await response.arrayBuffer()
  } catch (error) {
    return createResultError(
      op,
      "Reading binary response failed",
      error instanceof Error ? error.message : String(error),
    )
  }

  return createResult({
    data,
    contentType: response.headers.get("Content-Type"),
    filename: lexwareFilenameFromContentDisposition(response.headers.get("Content-Disposition")),
    headers: response.headers,
  })
}
