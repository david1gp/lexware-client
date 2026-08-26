import { buildCommand, buildRouteMap } from "@stricli/core"
import * as a from "valibot"
import type { CliClientInput } from "../../cli/cliClientCreate.js"
import { cliClientOptions } from "../../cli/cliClientOptions.js"
import type { CliCommandContext } from "../../cli/cliCommandContext.js"
import { cliCommandExecute } from "../../cli/cliCommandExecute.js"
import { cliOptionCreate } from "../../cli/cliOptionCreate.js"
import { lexwareIdInputSchema } from "../../shared/lexwareSchemas.js"
import { salesVoucherDownloadOptions } from "../../shared/salesVoucherDownloadOptions.js"
import { salesVoucherDownloadWrite } from "../../shared/salesVoucherDownloadWrite.js"
import { downPaymentInvoiceGet } from "../api/downPaymentInvoiceGet.js"
import { downPaymentInvoicePdfDownload } from "../api/downPaymentInvoicePdfDownload.js"
import { downPaymentInvoiceXmlDownload } from "../api/downPaymentInvoiceXmlDownload.js"

type DownPaymentInvoiceIdFlags = CliClientInput & a.InferOutput<typeof lexwareIdInputSchema>
type DownPaymentInvoiceDownloadFlags = DownPaymentInvoiceIdFlags & { readonly output?: string }

const downPaymentInvoiceGetCommand = buildCommand({
  func(this: CliCommandContext, flags: DownPaymentInvoiceIdFlags) {
    return cliCommandExecute(this, {
      clientInput: { accessToken: flags.accessToken, baseUrl: flags.baseUrl },
      input: { id: flags.id },
      inputSchema: lexwareIdInputSchema,
      execute: (client, input) => downPaymentInvoiceGet(client, input.id),
      op: "downPaymentInvoiceGet",
    })
  },
  parameters: {
    flags: { ...cliClientOptions, id: cliOptionCreate(lexwareIdInputSchema.entries.id, "Down-payment invoice ID") },
  },
  docs: { brief: "Get a down-payment invoice" },
})

function downPaymentInvoiceDownloadCommand(
  download: typeof downPaymentInvoicePdfDownload | typeof downPaymentInvoiceXmlDownload,
  op: "downPaymentInvoicePdfDownload" | "downPaymentInvoiceXmlDownload",
  brief: string,
) {
  return buildCommand({
    func(this: CliCommandContext, flags: DownPaymentInvoiceDownloadFlags) {
      return cliCommandExecute(this, {
        clientInput: { accessToken: flags.accessToken, baseUrl: flags.baseUrl },
        input: { id: flags.id, output: flags.output },
        inputSchema: a.intersect([lexwareIdInputSchema, a.object({ output: a.optional(a.string()) })]),
        execute: (client, input) => salesVoucherDownloadWrite(client, input.id, input.output, download),
        op,
      })
    },
    parameters: { flags: { ...cliClientOptions, ...salesVoucherDownloadOptions } },
    docs: { brief },
  })
}

export const downPaymentInvoiceCommand = buildRouteMap({
  routes: {
    get: downPaymentInvoiceGetCommand,
    "pdf-download": downPaymentInvoiceDownloadCommand(
      downPaymentInvoicePdfDownload,
      "downPaymentInvoicePdfDownload",
      "Download a down-payment invoice PDF",
    ),
    "xml-download": downPaymentInvoiceDownloadCommand(
      downPaymentInvoiceXmlDownload,
      "downPaymentInvoiceXmlDownload",
      "Download a down-payment invoice XML",
    ),
  },
  docs: { brief: "Down-payment-invoice commands" },
})
