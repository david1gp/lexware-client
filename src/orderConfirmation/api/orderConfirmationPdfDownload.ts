import type { PromiseResult } from "#result"
import type { LexwareClient } from "../../shared/LexwareClient.js"
import type { LexwarePdfResponse } from "../../shared/LexwarePdfResponse.js"
import { lexwareRequestPdf } from "../../shared/lexwareRequest.js"

export async function orderConfirmationPdfDownload(
  client: LexwareClient,
  id: string,
): PromiseResult<LexwarePdfResponse> {
  const op = "orderConfirmationPdfDownload"
  return lexwareRequestPdf(client, {
    op,
    binary: true,
    path: `/v1/order-confirmations/${encodeURIComponent(id)}/file`,
  })
}
