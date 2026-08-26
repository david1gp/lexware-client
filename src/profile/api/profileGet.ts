import type { PromiseResult } from "#result"
import type { LexwareClient } from "../../shared/LexwareClient.js"
import { lexwareRequest } from "../../shared/lexwareRequest.js"
import { type ProfileResponse, profileResponseSchema } from "../schema/profileSchemas.js"

export async function profileGet(client: LexwareClient): PromiseResult<ProfileResponse> {
  const op = "profileGet"
  return lexwareRequest(client, {
    op,
    path: "/v1/profile",
    schema: profileResponseSchema,
  })
}
