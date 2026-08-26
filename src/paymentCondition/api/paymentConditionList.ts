import type { PromiseResult } from "#result"
import type { LexwareClient } from "../../shared/LexwareClient.js"
import { lexwareRequest } from "../../shared/lexwareRequest.js"
import {
  type PaymentConditionListResponse,
  paymentConditionListResponseSchema,
} from "../schema/paymentConditionSchemas.js"

export async function paymentConditionList(client: LexwareClient): PromiseResult<PaymentConditionListResponse> {
  const op = "paymentConditionList"
  return lexwareRequest(client, {
    op,
    path: "/v1/payment-conditions",
    schema: paymentConditionListResponseSchema,
  })
}
