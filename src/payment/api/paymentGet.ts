import * as a from "valibot"
import { createResultError, type PromiseResult } from "#result"
import type { LexwareClient } from "../../shared/LexwareClient.js"
import { lexwareErrorData } from "../../shared/lexwareErrorData.js"
import { lexwareRequest } from "../../shared/lexwareRequest.js"
import { lexwareIdInputSchema } from "../../shared/lexwareSchemas.js"
import { type PaymentResponse, paymentResponseSchema } from "../schema/paymentSchemas.js"

export async function paymentGet(client: LexwareClient, voucherId: string): PromiseResult<PaymentResponse> {
  const op = "paymentGet"
  const r = a.safeParse(lexwareIdInputSchema, { id: voucherId })
  if (!r.success) return createResultError(op, a.summarize(r.issues), lexwareErrorData(voucherId))
  return lexwareRequest(client, {
    op,
    path: `/v1/payments/${encodeURIComponent(r.output.id)}`,
    schema: paymentResponseSchema,
  })
}
