import { buildCommand, buildRouteMap } from "@stricli/core"
import * as a from "valibot"
import type { CliClientInput } from "../../cli/cliClientCreate.js"
import { cliClientOptions } from "../../cli/cliClientOptions.js"
import type { CliCommandContext } from "../../cli/cliCommandContext.js"
import { cliCommandExecute } from "../../cli/cliCommandExecute.js"
import { cliOptionCreate } from "../../cli/cliOptionCreate.js"
import { cliOptionSchemas } from "../../cli/cliOptionSchemas.js"
import { lexwareIdInputSchema } from "../../shared/lexwareSchemas.js"
import { salesVoucherDownloadOptions } from "../../shared/salesVoucherDownloadOptions.js"
import { salesVoucherDownloadWrite } from "../../shared/salesVoucherDownloadWrite.js"
import { orderConfirmationCreate } from "../api/orderConfirmationCreate.js"
import { orderConfirmationGet } from "../api/orderConfirmationGet.js"
import { orderConfirmationPdfDownload } from "../api/orderConfirmationPdfDownload.js"
import { orderConfirmationCreateInputSchema } from "../schema/orderConfirmationSchemas.js"

type OrderConfirmationIdFlags = CliClientInput & { id: string }
type OrderConfirmationDownloadFlags = OrderConfirmationIdFlags & { readonly output?: string }

type OrderConfirmationCreateFlags = CliClientInput & {
  readonly precedingSalesVoucherId?: string
  readonly finalize?: boolean
}

const orderConfirmationCreateCommand = buildCommand({
  func(this: CliCommandContext, flags: OrderConfirmationCreateFlags) {
    const { accessToken, baseUrl, precedingSalesVoucherId, finalize } = flags

    return cliCommandExecute(this, {
      clientInput: { accessToken, baseUrl },
      input: { orderConfirmation: {}, precedingSalesVoucherId, finalize },
      inputSchema: orderConfirmationCreateInputSchema,
      execute: orderConfirmationCreate,
      op: "orderConfirmationCreate",
    })
  },
  parameters: {
    flags: {
      ...cliClientOptions,
      precedingSalesVoucherId: cliOptionCreate(lexwareIdInputSchema.entries.id, "Preceding sales voucher ID", {
        optional: true,
      }),
      finalize: cliOptionCreate(cliOptionSchemas.boolean, "Finalize order confirmation", { optional: true }),
    },
  },
  docs: {
    brief: "Create an order confirmation",
  },
})

const orderConfirmationPdfDownloadCommand = buildCommand({
  func(this: CliCommandContext, flags: OrderConfirmationDownloadFlags) {
    return cliCommandExecute(this, {
      clientInput: { accessToken: flags.accessToken, baseUrl: flags.baseUrl },
      input: { id: flags.id, output: flags.output },
      inputSchema: a.intersect([lexwareIdInputSchema, a.object({ output: a.optional(a.string()) })]),
      execute: (client, input) =>
        salesVoucherDownloadWrite(client, input.id, input.output, orderConfirmationPdfDownload),
      op: "orderConfirmationPdfDownload",
    })
  },
  parameters: { flags: { ...cliClientOptions, ...salesVoucherDownloadOptions } },
  docs: { brief: "Download an order confirmation PDF" },
})

const orderConfirmationGetCommand = buildCommand({
  func(this: CliCommandContext, flags: OrderConfirmationIdFlags) {
    return cliCommandExecute(this, {
      clientInput: { accessToken: flags.accessToken, baseUrl: flags.baseUrl },
      input: { id: flags.id },
      inputSchema: lexwareIdInputSchema,
      execute: (client, input) => orderConfirmationGet(client, input.id),
      op: "orderConfirmationGet",
    })
  },
  parameters: {
    flags: {
      ...cliClientOptions,
      id: cliOptionCreate(lexwareIdInputSchema.entries.id, "Order confirmation ID"),
    },
  },
  docs: {
    brief: "Get an order confirmation",
  },
})

export const orderConfirmationCommand = buildRouteMap({
  routes: {
    create: orderConfirmationCreateCommand,
    get: orderConfirmationGetCommand,
    "pdf-download": orderConfirmationPdfDownloadCommand,
  },
  docs: {
    brief: "Order confirmation commands",
  },
})
