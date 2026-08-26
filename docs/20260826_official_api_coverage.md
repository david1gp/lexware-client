# Official API coverage

## Goal

Align the public library and CLI with every current, non-deprecated Lexware `/v1` endpoint, and remove undocumented, obsolete, or deprecated operations. Breaking changes are allowed.

## Decisions

- Treat the live Lexware developers.io documentation as the endpoint source of truth.
- Keep `/file` sales-voucher downloads and remove deprecated `/document` or generic-file document flows.
- Remove undocumented contact delete, invoice list/update, order-confirmation list/delete, quotation list/update/delete, voucher delete, and voucher-list-by-ID operations.
- Keep bookkeeping voucher update, correcting its path to `/v1/vouchers/{id}`.
- Add create/pursue query support through `precedingSalesVoucherId` and `finalize` only where officially documented.
- Expose every supported library operation through the CLI.
- Preserve the repository's Valibot, Result, Stricli, naming, and test conventions.

## Approach

- Correct and prune existing domains first.
- Add missing operations to partially covered sales-voucher domains.
- Add missing resource domains in small independently tested increments.
- Complete public exports and CLI registration after domain APIs are stable.
- Finish with repository-wide type, test, build, and browser-based CLI verification.

## Tasks

- [ ] 1. Remove undocumented operations and correct existing endpoint/query mismatches.
- [ ] 2. Complete credit-note library coverage.
- [ ] 3. Complete invoice, order-confirmation, dunning, and voucher library coverage.
- [ ] 4. Complete delivery-note and down-payment-invoice library coverage.
- [ ] 5. Add event-subscription library coverage.
- [ ] 6. Add payments, payment-conditions, posting-categories, and profile library coverage.
- [ ] 7. Add recurring-template library coverage.
- [ ] 8. Align article, contact, and voucherlist filters with official query parameters.
- [ ] 9. Align public exports and CLI commands with all supported library operations.
- [ ] 10. Remove obsolete CLI commands and tests, then run full verification.

## Paths

- `src/index.ts`
- `src/cli.ts`
- `src/cli.test.ts`
- `src/*/api/`
- `src/*/schema/`
- `src/*/cli/`
- `package.json`
