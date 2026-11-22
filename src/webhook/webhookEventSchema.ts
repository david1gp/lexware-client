import * as a from "valibot"
import {
  eventSubscriptionDateTimeSchema,
  eventSubscriptionEventTypeSchema,
} from "../eventSubscription/schema/eventSubscriptionSchemas.js"
import { lexwareIdSchema } from "../shared/lexwareSchemas.js"

export const webhookEventSchema = a.object({
  organizationId: lexwareIdSchema,
  eventType: eventSubscriptionEventTypeSchema,
  resourceId: lexwareIdSchema,
  eventDate: eventSubscriptionDateTimeSchema,
})

export type WebhookEvent = a.InferOutput<typeof webhookEventSchema>
