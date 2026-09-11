import { buildCommand } from "@stricli/core"
import { createResult } from "#result"
import { packageVersion } from "../packageVersion.js"
import type { CliCommandContext } from "./cliCommandContext.js"
import { cliResultWrite } from "./cliResultWrite.js"
import { cliVersionMetadataRender } from "./cliVersionMetadataRender.js"

type CliVersionFlags = {
  readonly verbose?: boolean
}

export const cliVersionCommand = buildCommand({
  func(this: CliCommandContext, flags: CliVersionFlags) {
    const lines = [packageVersion]
    if (flags.verbose === true) lines.push(cliVersionMetadataRender())
    cliResultWrite(this.process, createResult(lines.join("\n")))
  },
  parameters: {
    flags: {
      verbose: {
        brief: "Print package and environment metadata",
        kind: "boolean",
        optional: true,
      },
    },
  },
  docs: {
    brief: "Print version information",
  },
})
