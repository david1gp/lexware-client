import * as a from "valibot"
import { createResultError, type PromiseResult } from "#result"
import type { LexwareClient } from "../../shared/LexwareClient.js"
import { lexwareErrorData } from "../../shared/lexwareErrorData.js"
import { lexwareRequest } from "../../shared/lexwareRequest.js"
import { type LexwareUnknownResponse, lexwareUnknownResponseSchema } from "../../shared/lexwareSchemas.js"
import { type InvoiceCreateInput, invoiceCreateInputSchema } from "../schema/invoiceSchemas.js"

export async function invoiceCreate(
  client: LexwareClient,
  input: InvoiceCreateInput,
): PromiseResult<LexwareUnknownResponse> {
  const op = "invoiceCreate"
  const r = a.safeParse(invoiceCreateInputSchema, input)
  if (!r.success) return createResultError(op, a.summarize(r.issues), lexwareErrorData(input))
  return lexwareRequest(client, {
    op,
    method: "POST",
    path: "/v1/invoices",
    query: {
      precedingSalesVoucherId: r.output.precedingSalesVoucherId,
      finalize: r.output.finalize,
    },
    body: r.output.invoice,
    schema: lexwareUnknownResponseSchema,
  })
}
