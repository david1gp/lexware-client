import * as a from "valibot"
import { lexwareIdSchema } from "../../shared/lexwareSchemas.js"

const paymentConditionDiscountConditionsSchema = a.looseObject({
  discountRange: a.pipe(a.number(), a.integer()),
  discountPercentage: a.number(),
})

const paymentConditionSchema = a.looseObject({
  id: lexwareIdSchema,
  paymentTermLabelTemplate: a.string(),
  paymentTermDuration: a.pipe(a.number(), a.integer()),
  paymentDiscountConditions: a.optional(paymentConditionDiscountConditionsSchema),
  organizationDefault: a.boolean(),
})

export const paymentConditionListResponseSchema = a.array(paymentConditionSchema)

export type PaymentCondition = a.InferOutput<typeof paymentConditionSchema>
export type PaymentConditionListResponse = a.InferOutput<typeof paymentConditionListResponseSchema>
