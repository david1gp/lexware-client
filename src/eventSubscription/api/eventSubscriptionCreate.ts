import * as a from "valibot"
import { createResultError, type PromiseResult } from "#result"
import type { LexwareClient } from "../../shared/LexwareClient.js"
import { lexwareErrorData } from "../../shared/lexwareErrorData.js"
import { lexwareRequest } from "../../shared/lexwareRequest.js"
import {
  type EventSubscriptionCreateInput,
  type EventSubscriptionCreateResponse,
  eventSubscriptionCreateInputSchema,
  eventSubscriptionCreateResponseSchema,
} from "../schema/eventSubscriptionSchemas.js"

export async function eventSubscriptionCreate(
  client: LexwareClient,
  input: EventSubscriptionCreateInput,
): PromiseResult<EventSubscriptionCreateResponse> {
  const op = "eventSubscriptionCreate"
  const r = a.safeParse(eventSubscriptionCreateInputSchema, input)
  if (!r.success) return createResultError(op, a.summarize(r.issues), lexwareErrorData(input))
  return lexwareRequest(client, {
    op,
    method: "POST",
    path: "/v1/event-subscriptions",
    body: r.output,
    schema: eventSubscriptionCreateResponseSchema,
  })
}
