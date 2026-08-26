import * as a from "valibot"
import { lexwareIdSchema, lexwareNonNegativeIntegerSchema } from "../../shared/lexwareSchemas.js"

export const eventSubscriptionEventTypeSchema = a.picklist([
  "article.created",
  "article.changed",
  "article.deleted",
  "contact.created",
  "contact.changed",
  "contact.deleted",
  "credit-note.created",
  "credit-note.changed",
  "credit-note.deleted",
  "credit-note.status.changed",
  "delivery-note.created",
  "delivery-note.changed",
  "delivery-note.deleted",
  "delivery-note.status.changed",
  "down-payment-invoice.created",
  "down-payment-invoice.changed",
  "down-payment-invoice.deleted",
  "down-payment-invoice.status.changed",
  "dunning.created",
  "dunning.changed",
  "dunning.deleted",
  "invoice.created",
  "invoice.changed",
  "invoice.deleted",
  "invoice.status.changed",
  "order-confirmation.created",
  "order-confirmation.changed",
  "order-confirmation.deleted",
  "order-confirmation.status.changed",
  "payment.changed",
  "quotation.created",
  "quotation.changed",
  "quotation.deleted",
  "quotation.status.changed",
  "recurring-template.created",
  "recurring-template.changed",
  "recurring-template.deleted",
  "token.revoked",
  "voucher.created",
  "voucher.changed",
  "voucher.deleted",
  "voucher.status.changed",
])

export const eventSubscriptionCallbackUrlSchema = a.pipe(
  a.string(),
  a.url(),
  a.check((url) => new URL(url).protocol === "https:", "callbackUrl must use HTTPS"),
)

export const eventSubscriptionDateTimeSchema = a.pipe(a.string(), a.isoTimestamp())

export const eventSubscriptionCreateBodySchema = a.object({
  eventType: eventSubscriptionEventTypeSchema,
  callbackUrl: eventSubscriptionCallbackUrlSchema,
})

export const eventSubscriptionCreateInputSchema = eventSubscriptionCreateBodySchema

export const eventSubscriptionResponseSchema = a.object({
  subscriptionId: lexwareIdSchema,
  organizationId: lexwareIdSchema,
  createdDate: eventSubscriptionDateTimeSchema,
  eventType: eventSubscriptionEventTypeSchema,
  callbackUrl: eventSubscriptionCallbackUrlSchema,
})

export const eventSubscriptionListResponseSchema = a.object({
  content: a.array(eventSubscriptionResponseSchema),
})

export const eventSubscriptionCreateResponseSchema = a.object({
  id: lexwareIdSchema,
  resourceUri: a.pipe(a.string(), a.url()),
  createdDate: eventSubscriptionDateTimeSchema,
  updatedDate: eventSubscriptionDateTimeSchema,
  version: lexwareNonNegativeIntegerSchema,
})

export const eventSubscriptionDeleteResponseSchema = a.null()

export type EventSubscriptionCallbackUrl = a.InferOutput<typeof eventSubscriptionCallbackUrlSchema>
export type EventSubscriptionCreateBody = a.InferOutput<typeof eventSubscriptionCreateBodySchema>
export type EventSubscriptionCreateInput = a.InferOutput<typeof eventSubscriptionCreateInputSchema>
export type EventSubscriptionCreateResponse = a.InferOutput<typeof eventSubscriptionCreateResponseSchema>
export type EventSubscriptionDateTime = a.InferOutput<typeof eventSubscriptionDateTimeSchema>
export type EventSubscriptionEventType = a.InferOutput<typeof eventSubscriptionEventTypeSchema>
export type EventSubscriptionListResponse = a.InferOutput<typeof eventSubscriptionListResponseSchema>
export type EventSubscriptionResponse = a.InferOutput<typeof eventSubscriptionResponseSchema>
export type EventSubscriptionDeleteResponse = a.InferOutput<typeof eventSubscriptionDeleteResponseSchema>
