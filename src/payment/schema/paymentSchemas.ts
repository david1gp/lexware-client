import * as a from "valibot"
import { lexwareCurrencySchema } from "../../shared/lexwareSchemas.js"

const paymentDateTimeSchema = a.pipe(a.string(), a.isoTimestamp())

const paymentItemSchema = a.looseObject({
  paymentItemType: a.picklist([
    "partPaymentFinancialTransaction",
    "partPaymentCreditNote",
    "partPaymentCashBox",
    "manualPayment",
    "cashDiscount",
    "dunningCosts",
    "currencyConversion",
    "irrecoverableReceivable",
  ]),
  postingDate: paymentDateTimeSchema,
  amount: a.number(),
  currency: lexwareCurrencySchema,
})

export const paymentResponseSchema = a.looseObject({
  openAmount: a.number(),
  currency: lexwareCurrencySchema,
  paymentStatus: a.picklist(["balanced", "openRevenue", "openExpense"]),
  voucherType: a.picklist([
    "salesinvoice",
    "salescreditnote",
    "purchaseinvoice",
    "purchasecreditnote",
    "invoice",
    "downpaymentinvoice",
    "creditnote",
  ]),
  voucherStatus: a.picklist(["open", "paid", "paidoff", "voided", "transferred", "sepadebit"]),
  paidDate: a.optional(paymentDateTimeSchema),
  paymentItems: a.array(paymentItemSchema),
})

export type PaymentResponse = a.InferOutput<typeof paymentResponseSchema>
