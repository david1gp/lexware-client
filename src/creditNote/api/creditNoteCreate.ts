import * as a from "valibot"
import { createResultError, type PromiseResult } from "#result"
import type { LexwareClient } from "../../shared/LexwareClient.js"
import { lexwareErrorData } from "../../shared/lexwareErrorData.js"
import { lexwareRequest } from "../../shared/lexwareRequest.js"
import { type LexwareUnknownResponse, lexwareUnknownResponseSchema } from "../../shared/lexwareSchemas.js"
import { type CreditNoteCreateInput, creditNoteCreateInputSchema } from "../schema/creditNoteSchemas.js"

export async function creditNoteCreate(
  client: LexwareClient,
  input: CreditNoteCreateInput,
): PromiseResult<LexwareUnknownResponse> {
  const op = "creditNoteCreate"
  const r = a.safeParse(creditNoteCreateInputSchema, input)
  if (!r.success) return createResultError(op, a.summarize(r.issues), lexwareErrorData(input))
  return lexwareRequest(client, {
    op,
    method: "POST",
    path: "/v1/credit-notes",
    query: {
      precedingSalesVoucherId: r.output.precedingSalesVoucherId,
      finalize: r.output.finalize,
    },
    body: r.output.creditNote,
    schema: lexwareUnknownResponseSchema,
  })
}
