#!/usr/bin/env node
import { buildApplication, buildCommand, buildRouteMap } from "@stricli/core"
import * as a from "valibot"
import { createResult } from "#result"
import { articleCommand } from "./article/cli/articleCommand.js"
import { cliApplicationText } from "./cli/cliApplicationText.js"
import { cliClientOptions } from "./cli/cliClientOptions.js"
import type { CliCommandContext } from "./cli/cliCommandContext.js"
import { cliInputValidate } from "./cli/cliInputValidate.js"
import { cliResultWrite } from "./cli/cliResultWrite.js"
import { cliRun } from "./cli/cliRun.js"
import { contactCommand } from "./contact/cli/contactCommand.js"
import { countryCommand } from "./country/cli/countryCommand.js"
import { creditNoteCommand } from "./creditNote/cli/creditNoteCommand.js"
import { deliveryNoteCommand } from "./deliveryNote/cli/deliveryNoteCommand.js"
import { downPaymentInvoiceCommand } from "./downPaymentInvoice/cli/downPaymentInvoiceCommand.js"
import { dunningCommand } from "./dunning/cli/dunningCommand.js"
import { eventSubscriptionCommand } from "./eventSubscription/cli/eventSubscriptionCommand.js"
import { fileCommand } from "./file/cli/fileCommand.js"
import { invoiceCommand } from "./invoice/cli/invoiceCommand.js"
import { orderConfirmationCommand } from "./orderConfirmation/cli/orderConfirmationCommand.js"
import { packageVersion } from "./packageVersion.js"
import { paymentCommand } from "./payment/cli/paymentCommand.js"
import { paymentConditionCommand } from "./paymentCondition/cli/paymentConditionCommand.js"
import { postingCategoryCommand } from "./postingCategory/cli/postingCategoryCommand.js"
import { printLayoutCommand } from "./printLayout/cli/printLayoutCommand.js"
import { profileCommand } from "./profile/cli/profileCommand.js"
import { quotationCommand } from "./quotation/cli/quotationCommand.js"
import { recurringTemplateCommand } from "./recurringTemplate/cli/recurringTemplateCommand.js"
import { voucherCommand } from "./voucher/cli/voucherCommand.js"
import { voucherListCommand } from "./voucherList/cli/voucherListCommand.js"

const lexwareRootInputSchema = a.object({
  baseUrl: a.optional(a.pipe(a.string(), a.url())),
  envPath: a.optional(a.pipe(a.string(), a.minLength(1))),
})

type LexwareRootInput = a.InferOutput<typeof lexwareRootInputSchema>

const lexwareRootCommand = buildCommand({
  func(this: CliCommandContext, input: LexwareRootInput) {
    const inputResult = cliInputValidate(lexwareRootInputSchema, input, "cliRootCommand")
    if (!inputResult.success) {
      cliResultWrite(this.process, inputResult)
      return
    }

    if (inputResult.data.baseUrl === undefined) {
      cliResultWrite(this.process, createResult({ command: "lexware", brief: "Run Lexware Office API commands" }))
      return
    }

    cliResultWrite(this.process, createResult(inputResult.data))
  },
  parameters: {
    flags: {
      baseUrl: {
        ...cliClientOptions.baseUrl,
      },
      envPath: {
        ...cliClientOptions.envPath,
      },
    },
  },
  docs: {
    brief: "Run Lexware Office API commands",
  },
})

const lexwareRouteMap = buildRouteMap({
  routes: {
    root: lexwareRootCommand,
    article: articleCommand,
    contact: contactCommand,
    country: countryCommand,
    creditNote: creditNoteCommand,
    deliveryNote: deliveryNoteCommand,
    downPaymentInvoice: downPaymentInvoiceCommand,
    dunning: dunningCommand,
    eventSubscription: eventSubscriptionCommand,
    file: fileCommand,
    invoice: invoiceCommand,
    orderConfirmation: orderConfirmationCommand,
    payments: paymentCommand,
    paymentConditions: paymentConditionCommand,
    postingCategories: postingCategoryCommand,
    profile: profileCommand,
    printLayout: printLayoutCommand,
    quotation: quotationCommand,
    recurringTemplate: recurringTemplateCommand,
    voucher: voucherCommand,
    voucherList: voucherListCommand,
  },
  defaultCommand: "root",
  docs: {
    brief: "Run Lexware Office API commands",
    fullDescription:
      "Run Lexware Office API commands\n\nGlobal flags\n  --env-path <path>  Path to the environment file",
    hideRoute: {
      root: true,
    },
  },
})

export const lexwareCommand = buildApplication(lexwareRouteMap, {
  name: "lexware",
  scanner: {
    caseStyle: "allow-kebab-for-camel",
  },
  documentation: {
    disableAnsiColor: true,
  },
  localization: {
    text: cliApplicationText,
  },
  versionInfo: {
    currentVersion: packageVersion,
  },
})

await cliRun(lexwareCommand, process.argv.slice(2), process)

if (process.exitCode !== undefined && process.exitCode !== null && process.exitCode !== 0) process.exitCode = 1
