import * as a from "valibot"
import { createResultError, type PromiseResult } from "#result"
import type { LexwareClient } from "../../shared/LexwareClient.js"
import { lexwareErrorData } from "../../shared/lexwareErrorData.js"
import { lexwareRequest } from "../../shared/lexwareRequest.js"
import { type LexwareUnknownResponse, lexwareUnknownResponseSchema } from "../../shared/lexwareSchemas.js"
import { type VoucherBody, voucherCreateBodySchema } from "../schema/voucherSchemas.js"

export async function voucherCreate(client: LexwareClient, input: VoucherBody): PromiseResult<LexwareUnknownResponse> {
  const op = "voucherCreate"
  const r = a.safeParse(voucherCreateBodySchema, input)
  if (!r.success) return createResultError(op, a.summarize(r.issues), lexwareErrorData(input))
  return lexwareRequest(client, {
    op,
    method: "POST",
    path: "/v1/vouchers",
    body: r.output,
    schema: lexwareUnknownResponseSchema,
  })
}
