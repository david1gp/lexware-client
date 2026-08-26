import type { PromiseResult } from "#result"
import type { LexwareBinaryResponse } from "../../shared/LexwareBinaryResponse.js"
import type { LexwareClient } from "../../shared/LexwareClient.js"
import { lexwareRequestBinary } from "../../shared/lexwareRequest.js"

export async function orderConfirmationFileDownload(
  client: LexwareClient,
  id: string,
): PromiseResult<LexwareBinaryResponse> {
  const op = "orderConfirmationFileDownload"
  return lexwareRequestBinary(client, {
    op,
    binary: true,
    path: `/v1/order-confirmations/${encodeURIComponent(id)}/file`,
  })
}
