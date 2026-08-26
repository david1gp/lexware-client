import * as a from "valibot"
import { fileContentTypeSchema, fileDataSchema, fileFilenameSchema } from "../../file/schema/fileSchemas.js"

export const voucherFileUploadInputSchema = a.object({
  filename: fileFilenameSchema,
  contentType: a.optional(fileContentTypeSchema),
  data: fileDataSchema,
})

export type VoucherFileUploadInput = a.InferOutput<typeof voucherFileUploadInputSchema>
