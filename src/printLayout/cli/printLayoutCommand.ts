import { buildCommand, buildRouteMap } from "@stricli/core"
import { type CliClientInput, cliClientCreate } from "../../cli/cliClientCreate.js"
import { cliClientOptions } from "../../cli/cliClientOptions.js"
import type { CliCommandContext } from "../../cli/cliCommandContext.js"
import { cliResultWrite } from "../../cli/cliResultWrite.js"
import { printLayoutList } from "../api/printLayoutList.js"

type PrintLayoutListFlags = CliClientInput

const printLayoutListCommand = buildCommand({
  async func(this: CliCommandContext, flags: PrintLayoutListFlags) {
    const clientResult = cliClientCreate(flags, this.process.env)
    if (!clientResult.success) {
      cliResultWrite(this.process, clientResult)
      return
    }

    const result = await printLayoutList(clientResult.data)
    cliResultWrite(this.process, result)
  },
  parameters: {
    flags: {
      ...cliClientOptions,
    },
  },
  docs: {
    brief: "List print layouts",
  },
})

export const printLayoutCommand = buildRouteMap({
  routes: {
    list: printLayoutListCommand,
  },
  docs: {
    brief: "Print layout commands",
  },
})
