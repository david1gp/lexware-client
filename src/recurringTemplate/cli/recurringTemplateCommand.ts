import { buildCommand, buildRouteMap } from "@stricli/core"
import * as a from "valibot"
import type { CliClientInput } from "../../cli/cliClientCreate.js"
import { cliClientOptions } from "../../cli/cliClientOptions.js"
import type { CliCommandContext } from "../../cli/cliCommandContext.js"
import { cliCommandExecute } from "../../cli/cliCommandExecute.js"
import { cliOptionCreate } from "../../cli/cliOptionCreate.js"
import { cliOptionSchemas } from "../../cli/cliOptionSchemas.js"
import { lexwareIdInputSchema } from "../../shared/lexwareSchemas.js"
import { recurringTemplateGet } from "../api/recurringTemplateGet.js"
import { recurringTemplateList } from "../api/recurringTemplateList.js"
import { recurringTemplateListInputSchema } from "../schema/recurringTemplateSchemas.js"

type RecurringTemplateListFlags = CliClientInput & a.InferOutput<typeof recurringTemplateListInputSchema>
type RecurringTemplateIdFlags = CliClientInput & a.InferOutput<typeof lexwareIdInputSchema>

const recurringTemplateGetCommand = buildCommand({
  func(this: CliCommandContext, flags: RecurringTemplateIdFlags) {
    return cliCommandExecute(this, {
      clientInput: { accessToken: flags.accessToken, baseUrl: flags.baseUrl },
      input: { id: flags.id },
      inputSchema: lexwareIdInputSchema,
      execute: (client, input) => recurringTemplateGet(client, input.id),
      op: "recurringTemplateGet",
    })
  },
  parameters: {
    flags: {
      ...cliClientOptions,
      id: cliOptionCreate(lexwareIdInputSchema.entries.id, "Recurring template ID"),
    },
  },
  docs: { brief: "Get a recurring template" },
})

const recurringTemplateListCommand = buildCommand({
  func(this: CliCommandContext, flags: RecurringTemplateListFlags) {
    return cliCommandExecute(this, {
      clientInput: { accessToken: flags.accessToken, baseUrl: flags.baseUrl },
      input: { page: flags.page, size: flags.size, sort: flags.sort },
      inputSchema: recurringTemplateListInputSchema,
      execute: recurringTemplateList,
      op: "recurringTemplateList",
    })
  },
  parameters: {
    flags: {
      ...cliClientOptions,
      page: cliOptionCreate(
        a.pipe(cliOptionSchemas.integer, a.unwrap(recurringTemplateListInputSchema.entries.page)),
        "Page number",
        { optional: true },
      ),
      size: cliOptionCreate(
        a.pipe(cliOptionSchemas.integer, a.unwrap(recurringTemplateListInputSchema.entries.size)),
        "Page size",
        { optional: true },
      ),
      sort: cliOptionCreate(a.unwrap(recurringTemplateListInputSchema.entries.sort), "Sort order", { optional: true }),
    },
  },
  docs: { brief: "List recurring templates" },
})

export const recurringTemplateCommand = buildRouteMap({
  routes: {
    get: recurringTemplateGetCommand,
    list: recurringTemplateListCommand,
  },
  docs: { brief: "Recurring-template commands" },
})
