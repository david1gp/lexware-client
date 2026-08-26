import type { PromiseResult } from "#result"
import type { LexwareClient } from "../../shared/LexwareClient.js"
import type { LexwareXmlResponse } from "../../shared/LexwareXmlResponse.js"
import { lexwareRequestXml } from "../../shared/lexwareRequest.js"

export async function creditNoteXmlDownload(client: LexwareClient, id: string): PromiseResult<LexwareXmlResponse> {
  const op = "creditNoteXmlDownload"
  return lexwareRequestXml(client, {
    op,
    binary: true,
    path: `/v1/credit-notes/${encodeURIComponent(id)}/file`,
  })
}
