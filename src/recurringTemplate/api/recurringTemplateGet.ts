import * as a from "valibot"
import { createResultError, type PromiseResult } from "#result"
import type { LexwareClient } from "../../shared/LexwareClient.js"
import { lexwareErrorData } from "../../shared/lexwareErrorData.js"
import { lexwareRequest } from "../../shared/lexwareRequest.js"
import { lexwareIdInputSchema } from "../../shared/lexwareSchemas.js"
import { type RecurringTemplateResponse, recurringTemplateResponseSchema } from "../schema/recurringTemplateSchemas.js"

export async function recurringTemplateGet(
  client: LexwareClient,
  id: string,
): PromiseResult<RecurringTemplateResponse> {
  const op = "recurringTemplateGet"
  const r = a.safeParse(lexwareIdInputSchema, { id })
  if (!r.success) return createResultError(op, a.summarize(r.issues), lexwareErrorData(id))
  return lexwareRequest(client, {
    op,
    path: `/v1/recurring-templates/${encodeURIComponent(r.output.id)}`,
    schema: recurringTemplateResponseSchema,
  })
}
