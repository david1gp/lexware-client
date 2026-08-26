import { readFile, writeFile } from "node:fs/promises"
import { buildCommand, buildRouteMap } from "@stricli/core"
import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { CliClientInput } from "../../cli/cliClientCreate.js"
import { cliClientOptions } from "../../cli/cliClientOptions.js"
import type { CliCommandContext } from "../../cli/cliCommandContext.js"
import { cliCommandExecute } from "../../cli/cliCommandExecute.js"
import { cliOptionCreate } from "../../cli/cliOptionCreate.js"
import { cliOptionSchemas } from "../../cli/cliOptionSchemas.js"
import { fileDownload } from "../api/fileDownload.js"
import { fileUpload } from "../api/fileUpload.js"
import {
  fileContentTypeSchema,
  fileDownloadInputSchema,
  fileFilenameSchema,
  fileTypeSchema,
} from "../schema/fileSchemas.js"

const filePathSchema = cliOptionSchemas.nonEmptyString
const fileOutputSchema = cliOptionSchemas.nonEmptyString

const fileUploadFlagsSchema = a.object({
  type: fileTypeSchema,
  filename: fileFilenameSchema,
  contentType: a.optional(fileContentTypeSchema),
  path: filePathSchema,
})

type FileUploadFlags = CliClientInput & a.InferOutput<typeof fileUploadFlagsSchema>

const fileDownloadFlagsSchema = a.intersect([
  fileDownloadInputSchema,
  a.object({
    output: a.optional(fileOutputSchema),
  }),
])

type FileDownloadFlags = CliClientInput & a.InferOutput<typeof fileDownloadFlagsSchema>

const fileUploadOptions = {
  type: cliOptionCreate(fileTypeSchema, "File type"),
  filename: cliOptionCreate(fileFilenameSchema, "Uploaded filename"),
  contentType: cliOptionCreate(fileContentTypeSchema, "File content type", { optional: true }),
  path: cliOptionCreate(filePathSchema, "Path to the file to upload"),
}

const fileDownloadOptions = {
  id: cliOptionCreate(cliOptionSchemas.string, "File ID"),
  output: cliOptionCreate(fileOutputSchema, "Path to write the downloaded file", { optional: true }),
}

const fileUploadCommand = buildCommand({
  func(this: CliCommandContext, flags: FileUploadFlags) {
    return cliCommandExecute(this, {
      clientInput: { accessToken: flags.accessToken, baseUrl: flags.baseUrl },
      input: {
        type: flags.type,
        filename: flags.filename,
        contentType: flags.contentType,
        path: flags.path,
      },
      inputSchema: fileUploadFlagsSchema,
      execute: async (client, input) => {
        let data: Uint8Array
        try {
          data = await readFile(input.path)
        } catch (error) {
          return createResultError(
            "fileUpload",
            `Reading upload file failed: ${fileCommandErrorMessage(error)}`,
            input.path,
          )
        }

        return fileUpload(client, {
          type: input.type,
          filename: input.filename,
          contentType: input.contentType,
          data,
        })
      },
      op: "fileUpload",
    })
  },
  parameters: {
    flags: {
      ...cliClientOptions,
      ...fileUploadOptions,
    },
  },
  docs: {
    brief: "Upload a file",
  },
})

const fileDownloadCommand = buildCommand({
  func(this: CliCommandContext, flags: FileDownloadFlags) {
    return cliCommandExecute(this, {
      clientInput: { accessToken: flags.accessToken, baseUrl: flags.baseUrl },
      input: { id: flags.id, output: flags.output },
      inputSchema: fileDownloadFlagsSchema,
      execute: async (client, input) => {
        const downloadResult = await fileDownload(client, input.id)
        if (!downloadResult.success) return downloadResult

        if (input.output !== undefined) {
          try {
            await writeFile(input.output, new Uint8Array(downloadResult.data.data))
          } catch (error) {
            return createResultError(
              "fileDownload",
              `Writing downloaded file failed: ${fileCommandErrorMessage(error)}`,
              input.output,
            )
          }
        }

        return createResult({
          filename: downloadResult.data.filename,
          contentType: downloadResult.data.contentType,
          byteLength: downloadResult.data.data.byteLength,
          output: input.output ?? null,
        })
      },
      op: "fileDownload",
    })
  },
  parameters: {
    flags: {
      ...cliClientOptions,
      ...fileDownloadOptions,
    },
  },
  docs: {
    brief: "Download a file",
  },
})

function fileCommandErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export const fileCommand = buildRouteMap({
  routes: {
    upload: fileUploadCommand,
    download: fileDownloadCommand,
  },
  docs: {
    brief: "File commands",
  },
})
