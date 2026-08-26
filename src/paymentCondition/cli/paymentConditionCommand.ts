import { buildCommand, buildRouteMap } from "@stricli/core"
import * as a from "valibot"
import type { CliClientInput } from "../../cli/cliClientCreate.js"
import { cliClientOptions } from "../../cli/cliClientOptions.js"
import type { CliCommandContext } from "../../cli/cliCommandContext.js"
import { cliCommandExecute } from "../../cli/cliCommandExecute.js"
import { paymentConditionList } from "../api/paymentConditionList.js"

const paymentConditionListInputSchema = a.object({})
type PaymentConditionListFlags = CliClientInput

const paymentConditionListCommand = buildCommand({
  func(this: CliCommandContext, flags: PaymentConditionListFlags) {
    return cliCommandExecute(this, {
      clientInput: { accessToken: flags.accessToken, baseUrl: flags.baseUrl },
      input: {},
      inputSchema: paymentConditionListInputSchema,
      execute: (client) => paymentConditionList(client),
      op: "paymentConditionList",
    })
  },
  parameters: {
    flags: {
      ...cliClientOptions,
    },
  },
  docs: {
    brief: "List payment conditions",
  },
})

export const paymentConditionCommand = buildRouteMap({
  routes: {
    list: paymentConditionListCommand,
  },
  docs: {
    brief: "Payment condition commands",
  },
})
