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
import { quotationCreate } from "../api/quotationCreate.js"
import { quotationGet } from "../api/quotationGet.js"
import { quotationPdfDownload } from "../api/quotationPdfDownload.js"
import { quotationCreateInputSchema as quotationCreateDomainInputSchema } from "../schema/quotationSchemas.js"
import type { QuotationCreateInputFlags } from "./quotationCreateInput.js"
import { quotationBodyInputFromFlags } from "./quotationCreateInput.js"
import { quotationCreateOptions } from "./quotationCreateOptions.js"

type QuotationIdFlags = CliClientInput & a.InferOutput<typeof lexwareIdInputSchema>
type QuotationCreateFlags = CliClientInput & QuotationCreateInputFlags
type QuotationDownloadFlags = QuotationIdFlags & { readonly output?: string }

const quotationCreateCommand = buildCommand({
  func(this: CliCommandContext, flags: QuotationCreateFlags) {
    const { accessToken, baseUrl, ...input } = flags

    return cliCommandExecute(this, {
      clientInput: { accessToken, baseUrl },
      input: quotationBodyInputFromFlags(input),
      inputSchema: quotationCreateDomainInputSchema,
      execute: quotationCreate,
      op: "quotationCreate",
    })
  },
  parameters: {
    flags: {
      ...cliClientOptions,
      ...quotationCreateOptions,
    },
  },
  docs: {
    brief: "Create a quotation",
  },
})

const quotationGetCommand = buildCommand({
  func(this: CliCommandContext, flags: QuotationIdFlags) {
    return cliCommandExecute(this, {
      clientInput: { accessToken: flags.accessToken, baseUrl: flags.baseUrl },
      input: { id: flags.id },
      inputSchema: lexwareIdInputSchema,
      execute: (client, input) => quotationGet(client, input.id),
      op: "quotationGet",
    })
  },
  parameters: {
    flags: {
      ...cliClientOptions,
      id: cliOptionCreate(lexwareIdInputSchema.entries.id, "Quotation ID"),
    },
  },
  docs: {
    brief: "Get a quotation",
  },
})

const quotationPdfDownloadCommand = buildCommand({
  func(this: CliCommandContext, flags: QuotationDownloadFlags) {
    return cliCommandExecute(this, {
      clientInput: { accessToken: flags.accessToken, baseUrl: flags.baseUrl },
      input: { id: flags.id, output: flags.output },
      inputSchema: a.intersect([lexwareIdInputSchema, a.object({ output: a.optional(a.string()) })]),
      execute: (client, input) => salesVoucherDownloadWrite(client, input.id, input.output, quotationPdfDownload),
      op: "quotationPdfDownload",
    })
  },
  parameters: { flags: { ...cliClientOptions, ...salesVoucherDownloadOptions } },
  docs: { brief: "Download a quotation PDF" },
})

export const quotationCommand = buildRouteMap({
  routes: {
    create: quotationCreateCommand,
    get: quotationGetCommand,
    "pdf-download": quotationPdfDownloadCommand,
  },
  docs: {
    brief: "Quotation commands",
  },
})
