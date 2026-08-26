import * as a from "valibot"
import { createResultError, type PromiseResult } from "#result"
import type { LexwareClient } from "../../shared/LexwareClient.js"
import { lexwareErrorData } from "../../shared/lexwareErrorData.js"
import { lexwareRequest } from "../../shared/lexwareRequest.js"
import { type LexwareUnknownResponse, lexwareUnknownResponseSchema } from "../../shared/lexwareSchemas.js"
import {
  type OrderConfirmationCreateInput,
  orderConfirmationCreateInputSchema,
} from "../schema/orderConfirmationSchemas.js"

export async function orderConfirmationCreate(
  client: LexwareClient,
  input: OrderConfirmationCreateInput,
): PromiseResult<LexwareUnknownResponse> {
  const op = "orderConfirmationCreate"
  const r = a.safeParse(orderConfirmationCreateInputSchema, input)
  if (!r.success) return createResultError(op, a.summarize(r.issues), lexwareErrorData(input))
  return lexwareRequest(client, {
    op,
    method: "POST",
    path: "/v1/order-confirmations",
    query: {
      precedingSalesVoucherId: r.output.precedingSalesVoucherId,
      finalize: r.output.precedingSalesVoucherId === undefined ? r.output.finalize : undefined,
    },
    body: r.output.orderConfirmation,
    schema: lexwareUnknownResponseSchema,
  })
}
