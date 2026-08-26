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
import { creditNoteCreate } from "../api/creditNoteCreate.js"
import { creditNoteGet } from "../api/creditNoteGet.js"
import { creditNotePdfDownload } from "../api/creditNotePdfDownload.js"
import { creditNoteXmlDownload } from "../api/creditNoteXmlDownload.js"
import { creditNoteCreateInputSchema } from "../schema/creditNoteSchemas.js"
import type { CreditNoteCreateInputFlags } from "./creditNoteCreateInput.js"
import { creditNoteCreateInputFromFlags } from "./creditNoteCreateInput.js"
import { creditNoteCreateOptions } from "./creditNoteCreateOptions.js"

type CreditNoteCreateFlags = CliClientInput & CreditNoteCreateInputFlags
type CreditNoteIdFlags = CliClientInput & a.InferOutput<typeof lexwareIdInputSchema>
type CreditNoteDownloadFlags = CreditNoteIdFlags & { readonly output?: string }

const creditNoteCreateCommand = buildCommand({
  func(this: CliCommandContext, flags: CreditNoteCreateFlags) {
    const { accessToken, baseUrl, ...inputFlags } = flags
    return cliCommandExecute(this, {
      clientInput: { accessToken, baseUrl },
      input: creditNoteCreateInputFromFlags(inputFlags),
      inputSchema: creditNoteCreateInputSchema,
      execute: creditNoteCreate,
      op: "creditNoteCreate",
    })
  },
  parameters: { flags: { ...cliClientOptions, ...creditNoteCreateOptions } },
  docs: { brief: "Create a credit note" },
})

const creditNoteGetCommand = buildCommand({
  func(this: CliCommandContext, flags: CreditNoteIdFlags) {
    return cliCommandExecute(this, {
      clientInput: { accessToken: flags.accessToken, baseUrl: flags.baseUrl },
      input: { id: flags.id },
      inputSchema: lexwareIdInputSchema,
      execute: (client, input) => creditNoteGet(client, input.id),
      op: "creditNoteGet",
    })
  },
  parameters: {
    flags: { ...cliClientOptions, id: cliOptionCreate(lexwareIdInputSchema.entries.id, "Credit note ID") },
  },
  docs: { brief: "Get a credit note" },
})

function creditNoteDownloadCommand(
  download: typeof creditNotePdfDownload | typeof creditNoteXmlDownload,
  op: "creditNotePdfDownload" | "creditNoteXmlDownload",
  brief: string,
) {
  return buildCommand({
    func(this: CliCommandContext, flags: CreditNoteDownloadFlags) {
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

export const creditNoteCommand = buildRouteMap({
  routes: {
    create: creditNoteCreateCommand,
    get: creditNoteGetCommand,
    "pdf-download": creditNoteDownloadCommand(
      creditNotePdfDownload,
      "creditNotePdfDownload",
      "Download a credit note PDF",
    ),
    "xml-download": creditNoteDownloadCommand(
      creditNoteXmlDownload,
      "creditNoteXmlDownload",
      "Download a credit note XML",
    ),
  },
  docs: { brief: "Credit-note commands" },
})
