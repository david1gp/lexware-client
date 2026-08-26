import * as a from "valibot"
import { createResultError, type PromiseResult } from "#result"
import type { LexwareClient } from "../../shared/LexwareClient.js"
import { lexwareErrorData } from "../../shared/lexwareErrorData.js"
import { lexwareRequest } from "../../shared/lexwareRequest.js"
import {
  type RecurringTemplateListInput,
  type RecurringTemplateListResponse,
  recurringTemplateListInputSchema,
  recurringTemplateListResponseSchema,
} from "../schema/recurringTemplateSchemas.js"

export async function recurringTemplateList(
  client: LexwareClient,
  input: RecurringTemplateListInput = {},
): PromiseResult<RecurringTemplateListResponse> {
  const op = "recurringTemplateList"
  const r = a.safeParse(recurringTemplateListInputSchema, input)
  if (!r.success) return createResultError(op, a.summarize(r.issues), lexwareErrorData(input))
  return lexwareRequest(client, {
    op,
    path: "/v1/recurring-templates",
    query: r.output,
    schema: recurringTemplateListResponseSchema,
  })
}
