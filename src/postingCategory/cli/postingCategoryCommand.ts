import { buildCommand, buildRouteMap } from "@stricli/core"
import * as a from "valibot"
import type { CliClientInput } from "../../cli/cliClientCreate.js"
import { cliClientOptions } from "../../cli/cliClientOptions.js"
import type { CliCommandContext } from "../../cli/cliCommandContext.js"
import { cliCommandExecute } from "../../cli/cliCommandExecute.js"
import { postingCategoryList } from "../api/postingCategoryList.js"

const postingCategoryListInputSchema = a.object({})
type PostingCategoryListFlags = CliClientInput

const postingCategoryListCommand = buildCommand({
  func(this: CliCommandContext, flags: PostingCategoryListFlags) {
    return cliCommandExecute(this, {
      clientInput: { accessToken: flags.accessToken, baseUrl: flags.baseUrl },
      input: {},
      inputSchema: postingCategoryListInputSchema,
      execute: (client) => postingCategoryList(client),
      op: "postingCategoryList",
    })
  },
  parameters: {
    flags: {
      ...cliClientOptions,
    },
  },
  docs: {
    brief: "List posting categories",
  },
})

export const postingCategoryCommand = buildRouteMap({
  routes: {
    list: postingCategoryListCommand,
  },
  docs: {
    brief: "Posting category commands",
  },
})
