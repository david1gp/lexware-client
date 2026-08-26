import type { PromiseResult } from "#result"
import type { LexwareClient } from "../../shared/LexwareClient.js"
import type { LexwarePdfResponse } from "../../shared/LexwarePdfResponse.js"
import { lexwareRequestPdf } from "../../shared/lexwareRequest.js"

export async function creditNotePdfDownload(client: LexwareClient, id: string): PromiseResult<LexwarePdfResponse> {
  const op = "creditNotePdfDownload"
  return lexwareRequestPdf(client, {
    op,
    binary: true,
    path: `/v1/credit-notes/${encodeURIComponent(id)}/file`,
  })
}
