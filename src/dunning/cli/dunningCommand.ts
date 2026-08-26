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
import { dunningCreate } from "../api/dunningCreate.js"
import { dunningGet } from "../api/dunningGet.js"
import { dunningPdfDownload } from "../api/dunningPdfDownload.js"
import { dunningCreateInputSchema } from "../schema/dunningSchemas.js"
import type { DunningCreateInputFlags } from "./dunningCreateInput.js"
import { dunningCreateInputFromFlags } from "./dunningCreateInput.js"
import { dunningCreateOptions } from "./dunningCreateOptions.js"

type DunningIdFlags = CliClientInput & a.InferOutput<typeof lexwareIdInputSchema>
type DunningCreateFlags = CliClientInput & DunningCreateInputFlags
type DunningDownloadFlags = DunningIdFlags & { readonly output?: string }

const dunningCreateCommand = buildCommand({
  func(this: CliCommandContext, flags: DunningCreateFlags) {
    const { accessToken, baseUrl, ...inputFlags } = flags

    return cliCommandExecute(this, {
      clientInput: { accessToken, baseUrl },
      input: dunningCreateInputFromFlags(inputFlags),
      inputSchema: dunningCreateInputSchema,
      execute: dunningCreate,
      op: "dunningCreate",
    })
  },
  parameters: {
    flags: {
      ...cliClientOptions,
      ...dunningCreateOptions,
    },
  },
  docs: {
    brief: "Create a dunning",
  },
})

const dunningGetCommand = buildCommand({
  func(this: CliCommandContext, flags: DunningIdFlags) {
    return cliCommandExecute(this, {
      clientInput: { accessToken: flags.accessToken, baseUrl: flags.baseUrl },
      input: { id: flags.id },
      inputSchema: lexwareIdInputSchema,
      execute: (client, input) => dunningGet(client, input.id),
      op: "dunningGet",
    })
  },
  parameters: {
    flags: {
      ...cliClientOptions,
      id: cliOptionCreate(lexwareIdInputSchema.entries.id, "Dunning ID"),
    },
  },
  docs: {
    brief: "Get a dunning",
  },
})

function dunningDownloadCommand(download: typeof dunningPdfDownload, op: "dunningPdfDownload", brief: string) {
  return buildCommand({
    func(this: CliCommandContext, flags: DunningDownloadFlags) {
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

export const dunningCommand = buildRouteMap({
  routes: {
    create: dunningCreateCommand,
    get: dunningGetCommand,
    "pdf-download": dunningDownloadCommand(dunningPdfDownload, "dunningPdfDownload", "Download a dunning PDF"),
  },
  docs: {
    brief: "Dunning commands",
  },
})
