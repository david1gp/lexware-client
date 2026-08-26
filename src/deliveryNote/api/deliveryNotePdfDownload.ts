import type { PromiseResult } from "#result"
import type { LexwareClient } from "../../shared/LexwareClient.js"
import type { LexwarePdfResponse } from "../../shared/LexwarePdfResponse.js"
import { lexwareRequestPdf } from "../../shared/lexwareRequest.js"

export async function deliveryNotePdfDownload(client: LexwareClient, id: string): PromiseResult<LexwarePdfResponse> {
  const op = "deliveryNotePdfDownload"
  return lexwareRequestPdf(client, {
    op,
    binary: true,
    path: `/v1/delivery-notes/${encodeURIComponent(id)}/file`,
  })
}
