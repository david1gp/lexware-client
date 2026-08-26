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
import { deliveryNoteCreate } from "../api/deliveryNoteCreate.js"
import { deliveryNoteGet } from "../api/deliveryNoteGet.js"
import { deliveryNotePdfDownload } from "../api/deliveryNotePdfDownload.js"
import { deliveryNoteCreateInputSchema } from "../schema/deliveryNoteSchemas.js"
import type { DeliveryNoteCreateInputFlags } from "./deliveryNoteCreateInput.js"
import { deliveryNoteCreateInputFromFlags } from "./deliveryNoteCreateInput.js"
import { deliveryNoteCreateOptions } from "./deliveryNoteCreateOptions.js"

type DeliveryNoteCreateFlags = CliClientInput & DeliveryNoteCreateInputFlags
type DeliveryNoteIdFlags = CliClientInput & a.InferOutput<typeof lexwareIdInputSchema>
type DeliveryNoteDownloadFlags = DeliveryNoteIdFlags & { readonly output?: string }

const deliveryNoteCreateCommand = buildCommand({
  func(this: CliCommandContext, flags: DeliveryNoteCreateFlags) {
    const { accessToken, baseUrl, ...inputFlags } = flags
    return cliCommandExecute(this, {
      clientInput: { accessToken, baseUrl },
      input: deliveryNoteCreateInputFromFlags(inputFlags),
      inputSchema: deliveryNoteCreateInputSchema,
      execute: deliveryNoteCreate,
      op: "deliveryNoteCreate",
    })
  },
  parameters: { flags: { ...cliClientOptions, ...deliveryNoteCreateOptions } },
  docs: { brief: "Create a delivery note" },
})

const deliveryNoteGetCommand = buildCommand({
  func(this: CliCommandContext, flags: DeliveryNoteIdFlags) {
    return cliCommandExecute(this, {
      clientInput: { accessToken: flags.accessToken, baseUrl: flags.baseUrl },
      input: { id: flags.id },
      inputSchema: lexwareIdInputSchema,
      execute: (client, input) => deliveryNoteGet(client, input.id),
      op: "deliveryNoteGet",
    })
  },
  parameters: {
    flags: { ...cliClientOptions, id: cliOptionCreate(lexwareIdInputSchema.entries.id, "Delivery note ID") },
  },
  docs: { brief: "Get a delivery note" },
})

const deliveryNotePdfDownloadCommand = buildCommand({
  func(this: CliCommandContext, flags: DeliveryNoteDownloadFlags) {
    return cliCommandExecute(this, {
      clientInput: { accessToken: flags.accessToken, baseUrl: flags.baseUrl },
      input: { id: flags.id, output: flags.output },
      inputSchema: a.intersect([lexwareIdInputSchema, a.object({ output: a.optional(a.string()) })]),
      execute: (client, input) => salesVoucherDownloadWrite(client, input.id, input.output, deliveryNotePdfDownload),
      op: "deliveryNotePdfDownload",
    })
  },
  parameters: { flags: { ...cliClientOptions, ...salesVoucherDownloadOptions } },
  docs: { brief: "Download a delivery note PDF" },
})

export const deliveryNoteCommand = buildRouteMap({
  routes: {
    create: deliveryNoteCreateCommand,
    get: deliveryNoteGetCommand,
    "pdf-download": deliveryNotePdfDownloadCommand,
  },
  docs: { brief: "Delivery-note commands" },
})
