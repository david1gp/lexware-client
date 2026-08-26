import type { PromiseResult } from "#result"
import type { LexwareClient } from "../../shared/LexwareClient.js"
import { lexwareRequest } from "../../shared/lexwareRequest.js"
import {
  type PostingCategoryListResponse,
  postingCategoryListResponseSchema,
} from "../schema/postingCategorySchemas.js"

export async function postingCategoryList(client: LexwareClient): PromiseResult<PostingCategoryListResponse> {
  const op = "postingCategoryList"
  return lexwareRequest(client, {
    op,
    path: "/v1/posting-categories",
    schema: postingCategoryListResponseSchema,
  })
}
