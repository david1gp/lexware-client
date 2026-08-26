import * as a from "valibot"
import { lexwareNonNegativeIntegerSchema } from "../../shared/lexwareSchemas.js"

export const articleTypeSchema = a.picklist(["PRODUCT", "SERVICE"])

export const articlePriceSchema = a.looseObject({
  netPrice: a.optional(a.number()),
  grossPrice: a.optional(a.number()),
  leadingPrice: a.picklist(["NET", "GROSS"]),
  taxRate: a.optional(a.number()),
})

export const articleBodySchema = a.looseObject({
  title: a.optional(a.string()),
  description: a.optional(a.string()),
  type: articleTypeSchema,
  articleNumber: a.optional(a.string()),
  gtin: a.optional(a.string()),
  note: a.optional(a.string()),
  unitName: a.optional(a.string()),
  version: a.optional(a.number()),
  price: a.optional(articlePriceSchema),
})

export const articleListInputSchema = a.object({
  page: a.optional(lexwareNonNegativeIntegerSchema),
  articleNumber: a.optional(a.string()),
  gtin: a.optional(a.string()),
  type: a.optional(articleTypeSchema),
})

export type ArticleBody = a.InferOutput<typeof articleBodySchema>
export type ArticleListInput = a.InferOutput<typeof articleListInputSchema>
