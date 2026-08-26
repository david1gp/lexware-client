import type { PromiseResult } from "#result"
import type { LexwareClient } from "../../shared/LexwareClient.js"
import type { LexwareXmlResponse } from "../../shared/LexwareXmlResponse.js"
import { lexwareRequestXml } from "../../shared/lexwareRequest.js"

export async function invoiceXmlDownload(client: LexwareClient, id: string): PromiseResult<LexwareXmlResponse> {
  const op = "invoiceXmlDownload"
  return lexwareRequestXml(client, {
    op,
    binary: true,
    path: `/v1/invoices/${encodeURIComponent(id)}/file`,
  })
}
