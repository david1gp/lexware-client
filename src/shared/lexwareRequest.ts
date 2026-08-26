import * as a from "valibot"
import { createResult, createResultError, type PromiseResult, resultTryParsingFetchErr } from "#result"
import type { LexwareBinaryResponse } from "./LexwareBinaryResponse.js"
import type { LexwareClient } from "./LexwareClient.js"
import type { LexwarePdfResponse } from "./LexwarePdfResponse.js"
import type { LexwareXmlResponse } from "./LexwareXmlResponse.js"
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

export type LexwarePdfRequestInput = LexwareBinaryRequestInput

export type LexwareXmlRequestInput = LexwareBinaryRequestInput

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

export async function lexwareRequestPdf(
  client: LexwareClient,
  input: LexwarePdfRequestInput,
): PromiseResult<LexwarePdfResponse> {
  return lexwareRequestTypedBinary(client, input, "application/pdf", "lexwareRequestPdf")
}

export async function lexwareRequestXml(
  client: LexwareClient,
  input: LexwareXmlRequestInput,
): PromiseResult<LexwareXmlResponse> {
  return lexwareRequestTypedBinary(client, input, "application/xml", "lexwareRequestXml")
}

async function lexwareRequestTypedBinary<TContentType extends "application/pdf" | "application/xml">(
  client: LexwareClient,
  input: LexwareBinaryRequestInput,
  expectedContentType: TContentType,
  defaultOp: string,
): PromiseResult<LexwareTypedResponse<TContentType>> {
  const op = input.op ?? defaultOp
  const headers = new Headers(input.headers)
  headers.set("Accept", expectedContentType)

  const result = await lexwareRequestBinary(client, { ...input, headers, op })
  if (!result.success) return result

  const contentType = result.data.contentType
  const normalizedContentType = contentType?.split(";", 1)[0]?.trim().toLowerCase()
  if (normalizedContentType !== expectedContentType) {
    return createResultError(
      op,
      `Invalid successful response Content-Type: expected ${expectedContentType}, received ${contentType ?? "missing"}`,
      contentType,
    )
  }

  return createResult({
    ...result.data,
    contentType: expectedContentType,
  })
}

type LexwareTypedResponse<TContentType extends "application/pdf" | "application/xml"> = Omit<
  LexwareBinaryResponse,
  "contentType"
> & {
  contentType: TContentType
}
