import { buildCommand, buildRouteMap } from "@stricli/core"
import * as a from "valibot"
import type { CliClientInput } from "../../cli/cliClientCreate.js"
import { cliClientOptions } from "../../cli/cliClientOptions.js"
import type { CliCommandContext } from "../../cli/cliCommandContext.js"
import { cliCommandExecute } from "../../cli/cliCommandExecute.js"
import { cliOptionCreate } from "../../cli/cliOptionCreate.js"
import { lexwareIdInputSchema } from "../../shared/lexwareSchemas.js"
import { eventSubscriptionCreate } from "../api/eventSubscriptionCreate.js"
import { eventSubscriptionDelete } from "../api/eventSubscriptionDelete.js"
import { eventSubscriptionGet } from "../api/eventSubscriptionGet.js"
import { eventSubscriptionList } from "../api/eventSubscriptionList.js"
import { eventSubscriptionCreateInputSchema } from "../schema/eventSubscriptionSchemas.js"

type EventSubscriptionCreateFlags = CliClientInput & a.InferOutput<typeof eventSubscriptionCreateInputSchema>
type EventSubscriptionIdFlags = CliClientInput & a.InferOutput<typeof lexwareIdInputSchema>
type EventSubscriptionListFlags = CliClientInput

const eventSubscriptionCreateCommand = buildCommand({
  func(this: CliCommandContext, flags: EventSubscriptionCreateFlags) {
    return cliCommandExecute(this, {
      clientInput: { accessToken: flags.accessToken, baseUrl: flags.baseUrl },
      input: { eventType: flags.eventType, callbackUrl: flags.callbackUrl },
      inputSchema: eventSubscriptionCreateInputSchema,
      execute: eventSubscriptionCreate,
      op: "eventSubscriptionCreate",
    })
  },
  parameters: {
    flags: {
      ...cliClientOptions,
      eventType: cliOptionCreate(eventSubscriptionCreateInputSchema.entries.eventType, "Event type"),
      callbackUrl: cliOptionCreate(eventSubscriptionCreateInputSchema.entries.callbackUrl, "Callback URL"),
    },
  },
  docs: { brief: "Create an event subscription" },
})

const eventSubscriptionGetCommand = buildCommand({
  func(this: CliCommandContext, flags: EventSubscriptionIdFlags) {
    return cliCommandExecute(this, {
      clientInput: { accessToken: flags.accessToken, baseUrl: flags.baseUrl },
      input: { id: flags.id },
      inputSchema: lexwareIdInputSchema,
      execute: (client, input) => eventSubscriptionGet(client, input.id),
      op: "eventSubscriptionGet",
    })
  },
  parameters: {
    flags: { ...cliClientOptions, id: cliOptionCreate(lexwareIdInputSchema.entries.id, "Event subscription ID") },
  },
  docs: { brief: "Get an event subscription" },
})

const eventSubscriptionListInputSchema = a.object({})

const eventSubscriptionListCommand = buildCommand({
  func(this: CliCommandContext, flags: EventSubscriptionListFlags) {
    return cliCommandExecute(this, {
      clientInput: { accessToken: flags.accessToken, baseUrl: flags.baseUrl },
      input: {},
      inputSchema: eventSubscriptionListInputSchema,
      execute: (client) => eventSubscriptionList(client),
      op: "eventSubscriptionList",
    })
  },
  parameters: { flags: { ...cliClientOptions } },
  docs: { brief: "List event subscriptions" },
})

const eventSubscriptionDeleteCommand = buildCommand({
  func(this: CliCommandContext, flags: EventSubscriptionIdFlags) {
    return cliCommandExecute(this, {
      clientInput: { accessToken: flags.accessToken, baseUrl: flags.baseUrl },
      input: { id: flags.id },
      inputSchema: lexwareIdInputSchema,
      execute: (client, input) => eventSubscriptionDelete(client, input.id),
      op: "eventSubscriptionDelete",
    })
  },
  parameters: {
    flags: { ...cliClientOptions, id: cliOptionCreate(lexwareIdInputSchema.entries.id, "Event subscription ID") },
  },
  docs: { brief: "Delete an event subscription" },
})

export const eventSubscriptionCommand = buildRouteMap({
  routes: {
    create: eventSubscriptionCreateCommand,
    get: eventSubscriptionGetCommand,
    list: eventSubscriptionListCommand,
    delete: eventSubscriptionDeleteCommand,
  },
  docs: { brief: "Event-subscription commands" },
})
