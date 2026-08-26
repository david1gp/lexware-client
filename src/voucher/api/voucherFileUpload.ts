import * as a from "valibot"
import { createResult, createResultError, type PromiseResult, resultTryParsingFetchErr } from "#result"
import type { LexwareClient } from "../../shared/LexwareClient.js"
import { lexwareErrorData } from "../../shared/lexwareErrorData.js"
import { type VoucherFileUploadInput, voucherFileUploadInputSchema } from "../schema/voucherFileUploadInputSchema.js"
import {
  type VoucherFileUploadResponse,
  voucherFileUploadResponseSchema,
} from "../schema/voucherFileUploadResponseSchema.js"

export async function voucherFileUpload(
  client: LexwareClient,
  id: string,
  input: VoucherFileUploadInput,
): PromiseResult<VoucherFileUploadResponse> {
  const op = "voucherFileUpload"
  const r = a.safeParse(voucherFileUploadInputSchema, input)
  if (!r.success) return createResultError(op, a.summarize(r.issues), lexwareErrorData(input))

  const form = new FormData()
  const blob =
    r.output.data instanceof Blob
      ? r.output.contentType === undefined
        ? r.output.data
        : new Blob([r.output.data], { type: r.output.contentType })
      : new Blob([r.output.data as BlobPart], { type: r.output.contentType })
  form.set("file", blob, r.output.filename)

  const headers = new Headers({
    Accept: "application/json",
    Authorization: `Bearer ${client.accessToken}`,
  })
  let response: Response
  try {
    response = await client.fetch(new URL(`/v1/vouchers/${encodeURIComponent(id)}/files`, client.baseUrl), {
      method: "POST",
      headers,
      body: form,
    })
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

  const textSchema = a.pipe(a.string(), a.parseJson(), voucherFileUploadResponseSchema)
  const parsed = text.length === 0 ? a.safeParse(voucherFileUploadResponseSchema, null) : a.safeParse(textSchema, text)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues), text)
  return createResult(parsed.output)
}
