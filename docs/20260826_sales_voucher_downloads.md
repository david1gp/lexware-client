# Sales Voucher Downloads

## Goal

Add direct PDF download APIs for invoices, quotations, credit notes, and order confirmations, and use a Lexware-compatible default `Accept` header for binary requests.

## Decisions

- Add one public download function per sales-voucher resource.
- Use `/v1/{resource}/{encodedId}/file` through `lexwareRequestBinary`.
- Default binary requests to `Accept: */*`; preserve explicit caller overrides.
- Return the existing `LexwareBinaryResponse` without introducing new response types.

## Approach

- Status: complete.
- All four dedicated download functions are public, binary requests use a compatible default, and repository checks pass.

## Tasks

- [x] 1. Change and test the binary request default and explicit override behavior.
- [x] 2. Add and test `invoiceFileDownload` and `quotationFileDownload`.
- [x] 3. Add and test `creditNoteFileDownload` and `orderConfirmationFileDownload`.
- [x] 4. Export the new APIs and run repository checks.

## Paths

- `src/shared/lexwareRequest.ts`
- `src/file/api/file.test.ts`
- `src/invoice/api/`
- `src/quotation/api/`
- `src/creditNote/api/`
- `src/orderConfirmation/api/`
- `src/index.ts`
