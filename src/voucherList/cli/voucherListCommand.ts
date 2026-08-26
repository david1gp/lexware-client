import { buildCommand, buildRouteMap } from "@stricli/core"
import * as a from "valibot"
import type { CliClientInput } from "../../cli/cliClientCreate.js"
import { cliClientOptions } from "../../cli/cliClientOptions.js"
import type { CliCommandContext } from "../../cli/cliCommandContext.js"
import { cliCommandExecute } from "../../cli/cliCommandExecute.js"
import { cliOptionCreate } from "../../cli/cliOptionCreate.js"
import { cliOptionSchemas } from "../../cli/cliOptionSchemas.js"
import { voucherListList } from "../api/voucherListList.js"
import { voucherListListInputEntries, voucherListListInputSchema } from "../schema/voucherListSchemas.js"

type VoucherListListFlags = CliClientInput & a.InferOutput<typeof voucherListListInputSchema>

const voucherListListCommand = buildCommand({
  func(this: CliCommandContext, flags: VoucherListListFlags) {
    return cliCommandExecute(this, {
      clientInput: { accessToken: flags.accessToken, baseUrl: flags.baseUrl },
      input: {
        page: flags.page,
        size: flags.size,
        voucherType: flags.voucherType,
        voucherStatus: flags.voucherStatus,
        archived: flags.archived,
        contactId: flags.contactId,
        voucherDateFrom: flags.voucherDateFrom,
        voucherDateTo: flags.voucherDateTo,
        createdDateFrom: flags.createdDateFrom,
        createdDateTo: flags.createdDateTo,
        updatedDateFrom: flags.updatedDateFrom,
        updatedDateTo: flags.updatedDateTo,
        voucherNumber: flags.voucherNumber,
        sort: flags.sort,
      },
      inputSchema: voucherListListInputSchema,
      execute: voucherListList,
      op: "voucherListList",
    })
  },
  parameters: {
    flags: {
      ...cliClientOptions,
      page: cliOptionCreate(a.pipe(cliOptionSchemas.integer, voucherListListInputEntries.page), "Page number", {
        optional: true,
      }),
      size: cliOptionCreate(a.pipe(cliOptionSchemas.integer, voucherListListInputEntries.size), "Page size", {
        optional: true,
      }),
      voucherType: cliOptionCreate(voucherListListInputEntries.voucherType, "Voucher types"),
      voucherStatus: cliOptionCreate(voucherListListInputEntries.voucherStatus, "Voucher statuses"),
      archived: cliOptionCreate(
        a.pipe(cliOptionSchemas.boolean, voucherListListInputEntries.archived),
        "Archived voucher flag",
        { optional: true },
      ),
      contactId: cliOptionCreate(voucherListListInputEntries.contactId, "Contact ID", { optional: true }),
      voucherDateFrom: cliOptionCreate(
        a.pipe(cliOptionSchemas.date, voucherListListInputEntries.voucherDateFrom),
        "Voucher date from",
        { optional: true },
      ),
      voucherDateTo: cliOptionCreate(
        a.pipe(cliOptionSchemas.date, voucherListListInputEntries.voucherDateTo),
        "Voucher date to",
        { optional: true },
      ),
      createdDateFrom: cliOptionCreate(
        a.pipe(cliOptionSchemas.date, voucherListListInputEntries.createdDateFrom),
        "Created date from",
        { optional: true },
      ),
      createdDateTo: cliOptionCreate(
        a.pipe(cliOptionSchemas.date, voucherListListInputEntries.createdDateTo),
        "Created date to",
        { optional: true },
      ),
      updatedDateFrom: cliOptionCreate(
        a.pipe(cliOptionSchemas.date, voucherListListInputEntries.updatedDateFrom),
        "Updated date from",
        { optional: true },
      ),
      updatedDateTo: cliOptionCreate(
        a.pipe(cliOptionSchemas.date, voucherListListInputEntries.updatedDateTo),
        "Updated date to",
        { optional: true },
      ),
      voucherNumber: cliOptionCreate(voucherListListInputEntries.voucherNumber, "Voucher number", { optional: true }),
      sort: cliOptionCreate(voucherListListInputEntries.sort, "Sort order", { optional: true }),
    },
  },
  docs: {
    brief: "List voucher list entries",
  },
})

export const voucherListCommand = buildRouteMap({
  routes: {
    list: voucherListListCommand,
  },
  docs: {
    brief: "Voucher list commands",
  },
})
