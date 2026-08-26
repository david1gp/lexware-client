import type { PromiseResult } from "#result"
import type { LexwareBinaryResponse } from "../../shared/LexwareBinaryResponse.js"
import type { LexwareClient } from "../../shared/LexwareClient.js"
import { lexwareRequestBinary } from "../../shared/lexwareRequest.js"

export async function creditNoteFileDownload(client: LexwareClient, id: string): PromiseResult<LexwareBinaryResponse> {
  const op = "creditNoteFileDownload"
  return lexwareRequestBinary(client, {
    op,
    binary: true,
    path: `/v1/credit-notes/${encodeURIComponent(id)}/file`,
  })
}
