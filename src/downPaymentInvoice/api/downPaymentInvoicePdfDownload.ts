import type { PromiseResult } from "#result"
import type { LexwareClient } from "../../shared/LexwareClient.js"
import type { LexwarePdfResponse } from "../../shared/LexwarePdfResponse.js"
import { lexwareRequestPdf } from "../../shared/lexwareRequest.js"

export async function downPaymentInvoicePdfDownload(
  client: LexwareClient,
  id: string,
): PromiseResult<LexwarePdfResponse> {
  const op = "downPaymentInvoicePdfDownload"
  return lexwareRequestPdf(client, {
    op,
    binary: true,
    path: `/v1/down-payment-invoices/${encodeURIComponent(id)}/file`,
  })
}
