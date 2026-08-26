import * as a from "valibot"
import { createResultError, type PromiseResult } from "#result"
import type { LexwareClient } from "../../shared/LexwareClient.js"
import { lexwareErrorData } from "../../shared/lexwareErrorData.js"
import { lexwareRequest } from "../../shared/lexwareRequest.js"
import { lexwareIdInputSchema } from "../../shared/lexwareSchemas.js"
import { type EventSubscriptionResponse, eventSubscriptionResponseSchema } from "../schema/eventSubscriptionSchemas.js"

export async function eventSubscriptionGet(
  client: LexwareClient,
  id: string,
): PromiseResult<EventSubscriptionResponse> {
  const op = "eventSubscriptionGet"
  const r = a.safeParse(lexwareIdInputSchema, { id })
  if (!r.success) return createResultError(op, a.summarize(r.issues), lexwareErrorData(id))
  return lexwareRequest(client, {
    op,
    path: `/v1/event-subscriptions/${encodeURIComponent(r.output.id)}`,
    schema: eventSubscriptionResponseSchema,
  })
}
