# @adaptive-ds/lexware-client

Result-based TypeScript API clients for Lexware Office.

```ts
import { articleList, lexwareClientCreate } from "@adaptive-ds/lexware-client"

const client = lexwareClientCreate({ accessToken: process.env.LEXWARE_TOKEN ?? "" })
if (!client.success) throw new Error(client.errorMessage)

const articles = await articleList(client.data, { type: "PRODUCT" })
if (!articles.success) {
  console.error(articles.errorMessage)
}
```

Fallible functions return `Result<T>` or `PromiseResult<T>` from `#result`. Runtime inputs and JSON responses are validated with Valibot.

## CLI

Install the package and run the `lexware` executable:

```bash
bun add --global @adaptive-ds/lexware-client
lexware --help
```

When invoking the CLI directly with Bun, use `bun --no-env-file` so the CLI controls environment loading (for example, `bun --no-env-file ./dist/cli.js --help`). Node execution does not require this flag.

The CLI prints one JSON result per invocation. Successes go to stdout. Help also returns a successful JSON result. Failures go to stderr and exit with status 1.

Commands accept named options only. Positional values and JSON input are rejected. The CLI automatically loads `.env` from the current directory when it exists. Use the global `--env-path <path>` option to select another environment file; inherited process environment values take precedence over values from the file. A missing default `.env` is ignored, but an explicitly selected file must be readable.

Authentication is resolved in this order: `--access-token`, `LEXWARE_TOKEN`, `LEXWARE_API_KEY`, then `LEXWARE_ACCESS_TOKEN`. `LEXWARE_API_KEY` and the legacy `LEXWARE_ACCESS_TOKEN` remain supported as environment aliases.

```bash
export LEXWARE_TOKEN=your-token
lexware article list --page 1 --type PRODUCT
lexware article get --id article-id
lexware article create --type PRODUCT --title "Desk" --leading-price NET --net-price 99

# Or select an environment file explicitly.
lexware --env-path ./production.env article list
```

Use `--base-url` to target another API endpoint. Nested fields use prefixed option names. Variadic fields can be repeated, which keeps each line item typed without accepting a JSON document:

```bash
lexware invoice create \
  --base-url https://api.example.test \
  --voucher-date 2026-08-16T00:00 \
  --address-name "Example customer" --address-country-code DE \
  --line-item-type custom \
  --line-item-name Consulting \
  --line-item-quantity 1 \
  --line-item-unit-name Hours \
  --line-item-unit-price-currency EUR \
  --line-item-unit-price-net-amount 100 \
  --line-item-unit-price-tax-rate-percentage 19 \
  --total-price-currency EUR \
  --tax-conditions-tax-type net \
  --shipping-conditions-shipping-type none
```

File commands return metadata as JSON. Upload reads the local path. Download keeps binary data out of the JSON result unless `--output` is supplied, in which case it writes the file there.

```bash
lexware file upload --type PDF --filename invoice.pdf --content-type application/pdf --path ./invoice.pdf
lexware file download --id file-id
lexware file download --id file-id --output ./downloaded.pdf
```
