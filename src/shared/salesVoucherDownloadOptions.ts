import { cliOptionCreate } from "../cli/cliOptionCreate.js"
import { cliOptionSchemas } from "../cli/cliOptionSchemas.js"
import { lexwareIdInputSchema } from "./lexwareSchemas.js"

export const salesVoucherDownloadOptions = {
  id: cliOptionCreate(lexwareIdInputSchema.entries.id, "Sales voucher ID"),
  output: cliOptionCreate(cliOptionSchemas.nonEmptyString, "Path to write the downloaded file", { optional: true }),
}
