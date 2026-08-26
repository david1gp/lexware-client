import * as a from "valibot"
import { createResultError, type PromiseResult } from "#result"
import type { LexwareClient } from "../../shared/LexwareClient.js"
import { lexwareErrorData } from "../../shared/lexwareErrorData.js"
import { lexwareRequest } from "../../shared/lexwareRequest.js"
import { lexwareIdInputSchema } from "../../shared/lexwareSchemas.js"
import {
  type DownPaymentInvoiceResponse,
  downPaymentInvoiceResponseSchema,
} from "../schema/downPaymentInvoiceSchemas.js"

export async function downPaymentInvoiceGet(
  client: LexwareClient,
  id: string,
): PromiseResult<DownPaymentInvoiceResponse> {
  const op = "downPaymentInvoiceGet"
  const r = a.safeParse(lexwareIdInputSchema, { id })
  if (!r.success) return createResultError(op, a.summarize(r.issues), lexwareErrorData(id))
  return lexwareRequest(client, {
    op,
    path: `/v1/down-payment-invoices/${encodeURIComponent(r.output.id)}`,
    schema: downPaymentInvoiceResponseSchema,
  })
}
