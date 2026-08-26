import { buildCommand, buildRouteMap } from "@stricli/core"
import * as a from "valibot"
import type { CliClientInput } from "../../cli/cliClientCreate.js"
import { cliClientOptions } from "../../cli/cliClientOptions.js"
import type { CliCommandContext } from "../../cli/cliCommandContext.js"
import { cliCommandExecute } from "../../cli/cliCommandExecute.js"
import { profileGet } from "../api/profileGet.js"

const profileGetInputSchema = a.object({})
type ProfileGetFlags = CliClientInput

const profileGetCommand = buildCommand({
  func(this: CliCommandContext, flags: ProfileGetFlags) {
    return cliCommandExecute(this, {
      clientInput: { accessToken: flags.accessToken, baseUrl: flags.baseUrl },
      input: {},
      inputSchema: profileGetInputSchema,
      execute: (client) => profileGet(client),
      op: "profileGet",
    })
  },
  parameters: {
    flags: {
      ...cliClientOptions,
    },
  },
  docs: {
    brief: "Get the profile",
  },
})

export const profileCommand = buildRouteMap({
  routes: {
    get: profileGetCommand,
  },
  docs: {
    brief: "Profile commands",
  },
})
