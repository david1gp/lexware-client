import { readFile } from "node:fs/promises"
import { buildCommand, buildRouteMap } from "@stricli/core"
import * as a from "valibot"
import { createResultError } from "#result"
import type { CliClientInput } from "../../cli/cliClientCreate.js"
import { cliClientOptions } from "../../cli/cliClientOptions.js"
import type { CliCommandContext } from "../../cli/cliCommandContext.js"
import { cliCommandExecute } from "../../cli/cliCommandExecute.js"
import { cliOptionCreate } from "../../cli/cliOptionCreate.js"
import { cliOptionSchemas } from "../../cli/cliOptionSchemas.js"
import { fileContentTypeSchema, fileFilenameSchema } from "../../file/schema/fileSchemas.js"
import { lexwareIdInputSchema } from "../../shared/lexwareSchemas.js"
import { voucherCreate } from "../api/voucherCreate.js"
import { voucherFileUpload } from "../api/voucherFileUpload.js"
import { voucherGet } from "../api/voucherGet.js"
import { voucherList } from "../api/voucherList.js"
import { voucherUpdate } from "../api/voucherUpdate.js"
import { voucherCreateInputSchema, voucherListInputSchema, voucherUpdateInputSchema } from "../schema/voucherSchemas.js"
import type { VoucherCreateInputFlags } from "./voucherCreateInput.js"
import { voucherBodyInputFromFlags } from "./voucherCreateInput.js"
import { voucherCreateOptions, voucherUpdateOptions } from "./voucherCreateOptions.js"

type VoucherListFlags = CliClientInput & a.InferOutput<typeof voucherListInputSchema>

type VoucherIdFlags = CliClientInput & a.InferOutput<typeof lexwareIdInputSchema>
type VoucherCreateFlags = CliClientInput & VoucherCreateInputFlags
type VoucherUpdateFlags = CliClientInput &
  VoucherCreateInputFlags &
  VoucherIdFlags & {
    readonly fileId?: string[]
    readonly version: NonNullable<VoucherCreateInputFlags["version"]>
  }

const voucherFileUploadFlagsSchema = a.intersect([
  lexwareIdInputSchema,
  a.object({
    filename: fileFilenameSchema,
    contentType: a.optional(fileContentTypeSchema),
    path: cliOptionSchemas.nonEmptyString,
  }),
])

type VoucherFileUploadFlags = CliClientInput & a.InferOutput<typeof voucherFileUploadFlagsSchema>

const voucherCreateCommand = buildCommand({
  func(this: CliCommandContext, flags: VoucherCreateFlags) {
    const { accessToken, baseUrl, ...input } = flags

    return cliCommandExecute(this, {
      clientInput: { accessToken, baseUrl },
      input: voucherBodyInputFromFlags(input),
      inputSchema: voucherCreateInputSchema,
      execute: voucherCreate,
      op: "voucherCreate",
    })
  },
  parameters: {
    flags: {
      ...cliClientOptions,
      ...voucherCreateOptions,
    },
  },
  docs: {
    brief: "Create a voucher",
  },
})

const voucherUpdateCommand = buildCommand({
  func(this: CliCommandContext, flags: VoucherUpdateFlags) {
    return cliCommandExecute(this, {
      clientInput: { accessToken: flags.accessToken, baseUrl: flags.baseUrl },
      input: { id: flags.id, voucher: voucherBodyInputFromFlags(flags) },
      inputSchema: voucherUpdateInputSchema,
      execute: (client, input) => voucherUpdate(client, input.id, input.voucher),
      op: "voucherUpdate",
    })
  },
  parameters: {
    flags: {
      ...cliClientOptions,
      id: cliOptionCreate(lexwareIdInputSchema.entries.id, "Voucher ID"),
      ...voucherUpdateOptions,
    },
  },
  docs: {
    brief: "Update a voucher",
  },
})

const voucherListCommand = buildCommand({
  func(this: CliCommandContext, flags: VoucherListFlags) {
    return cliCommandExecute(this, {
      clientInput: { accessToken: flags.accessToken, baseUrl: flags.baseUrl },
      input: { page: flags.page, status: flags.status },
      inputSchema: voucherListInputSchema,
      execute: voucherList,
      op: "voucherList",
    })
  },
  parameters: {
    flags: {
      ...cliClientOptions,
      page: cliOptionCreate(
        a.pipe(cliOptionSchemas.integer, a.unwrap(voucherListInputSchema.entries.page)),
        "Page number",
        {
          optional: true,
        },
      ),
      status: cliOptionCreate(a.unwrap(voucherListInputSchema.entries.status), "Voucher status", { optional: true }),
    },
  },
  docs: {
    brief: "List vouchers",
  },
})

const voucherGetCommand = buildCommand({
  func(this: CliCommandContext, flags: VoucherIdFlags) {
    return cliCommandExecute(this, {
      clientInput: { accessToken: flags.accessToken, baseUrl: flags.baseUrl },
      input: { id: flags.id },
      inputSchema: lexwareIdInputSchema,
      execute: (client, input) => voucherGet(client, input.id),
      op: "voucherGet",
    })
  },
  parameters: {
    flags: {
      ...cliClientOptions,
      id: cliOptionCreate(lexwareIdInputSchema.entries.id, "Voucher ID"),
    },
  },
  docs: {
    brief: "Get a voucher",
  },
})

const voucherFileUploadCommand = buildCommand({
  func(this: CliCommandContext, flags: VoucherFileUploadFlags) {
    return cliCommandExecute(this, {
      clientInput: { accessToken: flags.accessToken, baseUrl: flags.baseUrl },
      input: {
        id: flags.id,
        filename: flags.filename,
        contentType: flags.contentType,
        path: flags.path,
      },
      inputSchema: voucherFileUploadFlagsSchema,
      execute: async (client, input) => {
        let data: Uint8Array
        try {
          data = await readFile(input.path)
        } catch (error) {
          return createResultError(
            "voucherFileUpload",
            `Reading upload file failed: ${error instanceof Error ? error.message : String(error)}`,
            input.path,
          )
        }

        return voucherFileUpload(client, input.id, {
          filename: input.filename,
          contentType: input.contentType,
          data,
        })
      },
      op: "voucherFileUpload",
    })
  },
  parameters: {
    flags: {
      ...cliClientOptions,
      id: cliOptionCreate(lexwareIdInputSchema.entries.id, "Voucher ID"),
      filename: cliOptionCreate(fileFilenameSchema, "Uploaded filename"),
      contentType: cliOptionCreate(fileContentTypeSchema, "File content type", { optional: true }),
      path: cliOptionCreate(cliOptionSchemas.nonEmptyString, "Path to the file to upload"),
    },
  },
  docs: {
    brief: "Upload a file to a voucher",
  },
})

export const voucherCommand = buildRouteMap({
  routes: {
    create: voucherCreateCommand,
    update: voucherUpdateCommand,
    list: voucherListCommand,
    get: voucherGetCommand,
    "file-upload": voucherFileUploadCommand,
  },
  docs: {
    brief: "Voucher commands",
  },
})
