import * as a from "valibot"
import { lexwareIdSchema } from "../../shared/lexwareSchemas.js"

export const voucherFileUploadResponseSchema = a.object({
  id: lexwareIdSchema,
  voucherId: lexwareIdSchema,
})

export type VoucherFileUploadResponse = a.InferOutput<typeof voucherFileUploadResponseSchema>
