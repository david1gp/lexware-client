import * as a from "valibot"
import { createResultError, type PromiseResult } from "#result"
import type { LexwareClient } from "../../shared/LexwareClient.js"
import { lexwareErrorData } from "../../shared/lexwareErrorData.js"
import { lexwareRequest } from "../../shared/lexwareRequest.js"
import { lexwareIdInputSchema } from "../../shared/lexwareSchemas.js"
import {
  type EventSubscriptionDeleteResponse,
  eventSubscriptionDeleteResponseSchema,
} from "../schema/eventSubscriptionSchemas.js"

export async function eventSubscriptionDelete(
  client: LexwareClient,
  id: string,
): PromiseResult<EventSubscriptionDeleteResponse> {
  const op = "eventSubscriptionDelete"
  const r = a.safeParse(lexwareIdInputSchema, { id })
  if (!r.success) return createResultError(op, a.summarize(r.issues), lexwareErrorData(id))
  return lexwareRequest(client, {
    op,
    method: "DELETE",
    path: `/v1/event-subscriptions/${encodeURIComponent(r.output.id)}`,
    schema: eventSubscriptionDeleteResponseSchema,
  })
}
