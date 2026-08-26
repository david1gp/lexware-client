# Format-Specific Sales Voucher Downloads

## Goal

Replace ambiguous sales-voucher file downloads with format-specific PDF and XML functions whose return types and runtime validation guarantee one documented media type.

## Decisions

- Remove the four existing ambiguous sales-voucher download functions as a breaking change.
- Keep generic `fileDownload` for bookkeeping files only.
- Add `LexwarePdfResponse` and `LexwareXmlResponse` with literal content types.
- Send explicit `Accept: application/pdf` or `Accept: application/xml` from each format-specific function.
- Validate successful response `Content-Type` and return a `Result` error for missing or unexpected types.
- Support every official sales-voucher file subresource: invoices, credit notes, down-payment invoices, quotations, order confirmations, delivery notes, and dunnings.
- PDF functions: all seven resources. XML functions: invoices, credit notes, and down-payment invoices.
- Release as version `0.3.0` and document the breaking API.

## Approach

- Status: complete.
- All official format-specific download functions and tests are implemented, publicly exported, and documented for the 0.3.0 release.

## Tasks

- [x] 1. Add concrete PDF/XML response types and typed request helpers with media-type validation tests.
- [x] 2. Replace invoice and quotation file downloads with format-specific functions and tests.
- [x] 3. Replace credit-note and order-confirmation file downloads with format-specific functions and tests.
- [x] 4. Add format-specific down-payment-invoice, delivery-note, and dunning downloads with tests.
- [x] 5. Replace public exports, update README/version/changelog, remove obsolete references, and run full verification.

## Paths

- `src/shared/LexwarePdfResponse.ts`
- `src/shared/LexwareXmlResponse.ts`
- `src/shared/lexwareRequest.ts`
- `src/invoice/api/`
- `src/quotation/api/`
- `src/creditNote/api/`
- `src/orderConfirmation/api/`
- `src/downPaymentInvoice/api/`
- `src/deliveryNote/api/`
- `src/dunning/api/`
- `src/index.ts`
- `README.md`
- `package.json`
- `changelogs/2026-08-26_v0.3.0.md`
