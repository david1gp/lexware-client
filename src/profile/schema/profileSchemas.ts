import * as a from "valibot"
import { lexwareIdSchema } from "../../shared/lexwareSchemas.js"

const profileDateTimeSchema = a.pipe(a.string(), a.isoTimestamp())

const profileCreatedSchema = a.looseObject({
  userId: lexwareIdSchema,
  userName: a.string(),
  userEmail: a.string(),
  date: profileDateTimeSchema,
})

export const profileResponseSchema = a.looseObject({
  organizationId: lexwareIdSchema,
  companyName: a.string(),
  created: profileCreatedSchema,
  connectionId: lexwareIdSchema,
  features: a.optional(a.array(a.string())),
  businessFeatures: a.array(a.string()),
  subscriptionStatus: a.optional(a.string()),
  taxType: a.picklist(["net", "gross", "vatfree"]),
  distanceSalesPrinciple: a.optional(a.picklist(["ORIGIN", "DESTINATION"])),
  smallBusiness: a.boolean(),
})

export type ProfileResponse = a.InferOutput<typeof profileResponseSchema>
