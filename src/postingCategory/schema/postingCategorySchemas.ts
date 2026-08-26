import * as a from "valibot"
import { lexwareIdSchema } from "../../shared/lexwareSchemas.js"

const postingCategorySchema = a.looseObject({
  id: lexwareIdSchema,
  name: a.string(),
  type: a.picklist(["income", "outgo"]),
  contactRequired: a.boolean(),
  splitAllowed: a.boolean(),
  groupName: a.string(),
})

export const postingCategoryListResponseSchema = a.array(postingCategorySchema)

export type PostingCategory = a.InferOutput<typeof postingCategorySchema>
export type PostingCategoryListResponse = a.InferOutput<typeof postingCategoryListResponseSchema>
