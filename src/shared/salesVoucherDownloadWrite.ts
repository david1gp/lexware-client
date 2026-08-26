import { writeFile } from "node:fs/promises"
import { createResult, createResultError, type PromiseResult } from "#result"
import type { LexwareBinaryResponse } from "./LexwareBinaryResponse.js"
import type { LexwareClient } from "./LexwareClient.js"

type SalesVoucherDownload = (client: LexwareClient, id: string) => PromiseResult<LexwareBinaryResponse>

export async function salesVoucherDownloadWrite(
  client: LexwareClient,
  id: string,
  output: string | undefined,
  download: SalesVoucherDownload,
): PromiseResult<{
  readonly filename: string | null
  readonly contentType: string | null
  readonly byteLength: number
  readonly output: string | null
}> {
  const downloadResult = await download(client, id)
  if (!downloadResult.success) return downloadResult

  if (output !== undefined) {
    try {
      await writeFile(output, new Uint8Array(downloadResult.data.data))
    } catch (error) {
      return createResultError(
        "salesVoucherDownloadWrite",
        `Writing downloaded file failed: ${error instanceof Error ? error.message : String(error)}`,
        output,
      )
    }
  }

  return createResult({
    filename: downloadResult.data.filename,
    contentType: downloadResult.data.contentType,
    byteLength: downloadResult.data.data.byteLength,
    output: output ?? null,
  })
}
