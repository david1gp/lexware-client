import * as a from "valibot"
import { createResultError, type PromiseResult } from "#result"
import type { LexwareClient } from "../../shared/LexwareClient.js"
import { lexwareErrorData } from "../../shared/lexwareErrorData.js"
import { lexwareRequest } from "../../shared/lexwareRequest.js"
import {
  type DeliveryNoteCreateInput,
  type DeliveryNoteCreateResponse,
  deliveryNoteCreateInputSchema,
  deliveryNoteCreateResponseSchema,
} from "../schema/deliveryNoteSchemas.js"

export async function deliveryNoteCreate(
  client: LexwareClient,
  input: DeliveryNoteCreateInput,
): PromiseResult<DeliveryNoteCreateResponse> {
  const op = "deliveryNoteCreate"
  const r = a.safeParse(deliveryNoteCreateInputSchema, input)
  if (!r.success) return createResultError(op, a.summarize(r.issues), lexwareErrorData(input))
  return lexwareRequest(client, {
    op,
    method: "POST",
    path: "/v1/delivery-notes",
    query: {
      precedingSalesVoucherId: r.output.precedingSalesVoucherId,
      finalize: r.output.precedingSalesVoucherId === undefined ? r.output.finalize : undefined,
    },
    body: r.output.deliveryNote,
    schema: deliveryNoteCreateResponseSchema,
  })
}
