import * as a from "valibot"
import { createResultError, type PromiseResult } from "#result"
import type { LexwareClient } from "../../shared/LexwareClient.js"
import { lexwareErrorData } from "../../shared/lexwareErrorData.js"
import { lexwareRequest } from "../../shared/lexwareRequest.js"
import { type LexwareUnknownResponse, lexwareUnknownResponseSchema } from "../../shared/lexwareSchemas.js"
import { type VoucherListListInput, voucherListListInputSchema } from "../schema/voucherListSchemas.js"

export async function voucherListList(
  client: LexwareClient,
  input: VoucherListListInput,
): PromiseResult<LexwareUnknownResponse> {
  const op = "voucherListList"
  const r = a.safeParse(voucherListListInputSchema, input)
  if (!r.success) return createResultError(op, a.summarize(r.issues), lexwareErrorData(input))

  return lexwareRequest(client, {
    op,
    path: "/v1/voucherlist",
    query: r.output,
    schema: lexwareUnknownResponseSchema,
  })
}
