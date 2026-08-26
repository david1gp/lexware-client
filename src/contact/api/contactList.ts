import * as a from "valibot"
import { createResultError, type PromiseResult } from "#result"
import type { LexwareClient } from "../../shared/LexwareClient.js"
import { lexwareErrorData } from "../../shared/lexwareErrorData.js"
import { lexwareRequest } from "../../shared/lexwareRequest.js"
import { type LexwareUnknownResponse, lexwareUnknownResponseSchema } from "../../shared/lexwareSchemas.js"
import { type ContactListInput, contactListInputSchema } from "../schema/contactSchemas.js"

export async function contactList(
  client: LexwareClient,
  input: ContactListInput = {},
): PromiseResult<LexwareUnknownResponse> {
  const op = "contactList"
  const r = a.safeParse(contactListInputSchema, input)
  if (!r.success) return createResultError(op, a.summarize(r.issues), lexwareErrorData(input))

  return lexwareRequest(client, {
    op,
    path: "/v1/contacts",
    query: r.output,
    schema: lexwareUnknownResponseSchema,
  })
}
