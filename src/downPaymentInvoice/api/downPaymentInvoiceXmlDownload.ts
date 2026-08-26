import type { PromiseResult } from "#result"
import type { LexwareClient } from "../../shared/LexwareClient.js"
import type { LexwareXmlResponse } from "../../shared/LexwareXmlResponse.js"
import { lexwareRequestXml } from "../../shared/lexwareRequest.js"

export async function downPaymentInvoiceXmlDownload(
  client: LexwareClient,
  id: string,
): PromiseResult<LexwareXmlResponse> {
  const op = "downPaymentInvoiceXmlDownload"
  return lexwareRequestXml(client, {
    op,
    binary: true,
    path: `/v1/down-payment-invoices/${encodeURIComponent(id)}/file`,
  })
}
