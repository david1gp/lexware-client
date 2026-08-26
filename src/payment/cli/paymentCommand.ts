import { buildCommand, buildRouteMap } from "@stricli/core"
import type { CliClientInput } from "../../cli/cliClientCreate.js"
import { cliClientOptions } from "../../cli/cliClientOptions.js"
import type { CliCommandContext } from "../../cli/cliCommandContext.js"
import { cliCommandExecute } from "../../cli/cliCommandExecute.js"
import { cliOptionCreate } from "../../cli/cliOptionCreate.js"
import { lexwareIdInputSchema } from "../../shared/lexwareSchemas.js"
import { paymentGet } from "../api/paymentGet.js"

type PaymentGetByVoucherFlags = CliClientInput & { readonly voucherId: string }

const paymentGetByVoucherCommand = buildCommand({
  func(this: CliCommandContext, flags: PaymentGetByVoucherFlags) {
    return cliCommandExecute(this, {
      clientInput: { accessToken: flags.accessToken, baseUrl: flags.baseUrl },
      input: { id: flags.voucherId },
      inputSchema: lexwareIdInputSchema,
      execute: (client, input) => paymentGet(client, input.id),
      op: "paymentGet",
    })
  },
  parameters: {
    flags: {
      ...cliClientOptions,
      voucherId: cliOptionCreate(lexwareIdInputSchema.entries.id, "Voucher ID"),
    },
  },
  docs: {
    brief: "Get payment information by voucher",
  },
})

export const paymentCommand = buildRouteMap({
  routes: {
    getByVoucher: paymentGetByVoucherCommand,
  },
  docs: {
    brief: "Payment commands",
  },
})
