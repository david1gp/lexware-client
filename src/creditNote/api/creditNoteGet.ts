import * as a from "valibot"
import { createResultError, type PromiseResult } from "#result"
import type { LexwareClient } from "../../shared/LexwareClient.js"
import { lexwareErrorData } from "../../shared/lexwareErrorData.js"
import { lexwareRequest } from "../../shared/lexwareRequest.js"
import { lexwareIdInputSchema } from "../../shared/lexwareSchemas.js"
import { type CreditNoteResponse, creditNoteResponseSchema } from "../schema/creditNoteSchemas.js"

export async function creditNoteGet(client: LexwareClient, id: string): PromiseResult<CreditNoteResponse> {
  const op = "creditNoteGet"
  const r = a.safeParse(lexwareIdInputSchema, { id })
  if (!r.success) return createResultError(op, a.summarize(r.issues), lexwareErrorData(id))
  return lexwareRequest(client, {
    op,
    path: `/v1/credit-notes/${encodeURIComponent(r.output.id)}`,
    schema: creditNoteResponseSchema,
  })
}
