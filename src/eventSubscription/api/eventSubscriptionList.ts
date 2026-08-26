import type { PromiseResult } from "#result"
import type { LexwareClient } from "../../shared/LexwareClient.js"
import { lexwareRequest } from "../../shared/lexwareRequest.js"
import {
  type EventSubscriptionListResponse,
  eventSubscriptionListResponseSchema,
} from "../schema/eventSubscriptionSchemas.js"

export async function eventSubscriptionList(client: LexwareClient): PromiseResult<EventSubscriptionListResponse> {
  const op = "eventSubscriptionList"
  return lexwareRequest(client, {
    op,
    path: "/v1/event-subscriptions",
    schema: eventSubscriptionListResponseSchema,
  })
}
