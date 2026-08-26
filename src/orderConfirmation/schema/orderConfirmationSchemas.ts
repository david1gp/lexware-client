import * as a from "valibot"
import { lexwareIdSchema } from "../../shared/lexwareSchemas.js"

export const orderConfirmationBodySchema = a.looseObject({})
export const orderConfirmationCreateInputSchema = a.object({
  orderConfirmation: orderConfirmationBodySchema,
  precedingSalesVoucherId: a.optional(lexwareIdSchema),
  finalize: a.optional(a.boolean()),
})
export type OrderConfirmationBody = a.InferOutput<typeof orderConfirmationBodySchema>
export type OrderConfirmationCreateInput = a.InferOutput<typeof orderConfirmationCreateInputSchema>
