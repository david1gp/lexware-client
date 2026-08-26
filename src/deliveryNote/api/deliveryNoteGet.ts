import * as a from "valibot"
import { createResultError, type PromiseResult } from "#result"
import type { LexwareClient } from "../../shared/LexwareClient.js"
import { lexwareErrorData } from "../../shared/lexwareErrorData.js"
import { lexwareRequest } from "../../shared/lexwareRequest.js"
import { lexwareIdInputSchema } from "../../shared/lexwareSchemas.js"
import { type DeliveryNoteResponse, deliveryNoteResponseSchema } from "../schema/deliveryNoteSchemas.js"

export async function deliveryNoteGet(client: LexwareClient, id: string): PromiseResult<DeliveryNoteResponse> {
  const op = "deliveryNoteGet"
  const r = a.safeParse(lexwareIdInputSchema, { id })
  if (!r.success) return createResultError(op, a.summarize(r.issues), lexwareErrorData(id))
  return lexwareRequest(client, {
    op,
    path: `/v1/delivery-notes/${encodeURIComponent(r.output.id)}`,
    schema: deliveryNoteResponseSchema,
  })
}
