import { buildCommand, buildRouteMap } from "@stricli/core"
import * as a from "valibot"
import type { CliClientInput } from "../../cli/cliClientCreate.js"
import { cliClientOptions } from "../../cli/cliClientOptions.js"
import type { CliCommandContext } from "../../cli/cliCommandContext.js"
import { cliCommandExecute } from "../../cli/cliCommandExecute.js"
import { cliOptionCreate } from "../../cli/cliOptionCreate.js"
import { cliOptionSchemas } from "../../cli/cliOptionSchemas.js"
import { lexwareIdInputSchema } from "../../shared/lexwareSchemas.js"
import { articleCreate } from "../api/articleCreate.js"
import { articleDelete } from "../api/articleDelete.js"
import { articleGet } from "../api/articleGet.js"
import { articleList } from "../api/articleList.js"
import { articleUpdate } from "../api/articleUpdate.js"
import { articleBodySchema, articleListInputSchema, articlePriceSchema } from "../schema/articleSchemas.js"

type ArticleListFlags = CliClientInput & a.InferOutput<typeof articleListInputSchema>

type ArticleIdFlags = CliClientInput & a.InferOutput<typeof lexwareIdInputSchema>
type ArticleBodyFlags = CliClientInput & {
  readonly title?: a.InferOutput<typeof articleBodySchema.entries.title>
  readonly description?: a.InferOutput<typeof articleBodySchema.entries.description>
  readonly type: a.InferOutput<typeof articleBodySchema.entries.type>
  readonly articleNumber?: a.InferOutput<typeof articleBodySchema.entries.articleNumber>
  readonly gtin?: a.InferOutput<typeof articleBodySchema.entries.gtin>
  readonly note?: a.InferOutput<typeof articleBodySchema.entries.note>
  readonly unitName?: a.InferOutput<typeof articleBodySchema.entries.unitName>
  readonly version?: a.InferOutput<typeof articleBodySchema.entries.version>
  readonly leadingPrice?: a.InferOutput<typeof articlePriceSchema.entries.leadingPrice>
  readonly netPrice?: a.InferOutput<typeof articlePriceSchema.entries.netPrice>
  readonly grossPrice?: a.InferOutput<typeof articlePriceSchema.entries.grossPrice>
  readonly taxRate?: a.InferOutput<typeof articlePriceSchema.entries.taxRate>
}
type ArticleUpdateFlags = ArticleBodyFlags & a.InferOutput<typeof lexwareIdInputSchema>

const articleBodyOptions = {
  title: cliOptionCreate(a.unwrap(articleBodySchema.entries.title), "Article title", { optional: true }),
  description: cliOptionCreate(a.unwrap(articleBodySchema.entries.description), "Article description", {
    optional: true,
  }),
  type: cliOptionCreate(articleBodySchema.entries.type, "Article type"),
  articleNumber: cliOptionCreate(a.unwrap(articleBodySchema.entries.articleNumber), "Article number", {
    optional: true,
  }),
  gtin: cliOptionCreate(a.unwrap(articleBodySchema.entries.gtin), "Global Trade Item Number", { optional: true }),
  note: cliOptionCreate(a.unwrap(articleBodySchema.entries.note), "Article note", { optional: true }),
  unitName: cliOptionCreate(a.unwrap(articleBodySchema.entries.unitName), "Article unit name", { optional: true }),
  version: cliOptionCreate(
    a.pipe(cliOptionSchemas.number, a.unwrap(articleBodySchema.entries.version)),
    "Article version",
    { optional: true },
  ),
  leadingPrice: cliOptionCreate(articlePriceSchema.entries.leadingPrice, "Leading price", { optional: true }),
  netPrice: cliOptionCreate(
    a.pipe(cliOptionSchemas.number, a.unwrap(articlePriceSchema.entries.netPrice)),
    "Net price",
    { optional: true },
  ),
  grossPrice: cliOptionCreate(
    a.pipe(cliOptionSchemas.number, a.unwrap(articlePriceSchema.entries.grossPrice)),
    "Gross price",
    { optional: true },
  ),
  taxRate: cliOptionCreate(a.pipe(cliOptionSchemas.number, a.unwrap(articlePriceSchema.entries.taxRate)), "Tax rate", {
    optional: true,
  }),
}

function articleBodyInputFromFlags(flags: ArticleBodyFlags): unknown {
  const hasPrice =
    flags.leadingPrice !== undefined ||
    flags.netPrice !== undefined ||
    flags.grossPrice !== undefined ||
    flags.taxRate !== undefined

  return {
    title: flags.title,
    description: flags.description,
    type: flags.type,
    articleNumber: flags.articleNumber,
    gtin: flags.gtin,
    note: flags.note,
    unitName: flags.unitName,
    version: flags.version,
    price: hasPrice
      ? {
          leadingPrice: flags.leadingPrice,
          netPrice: flags.netPrice,
          grossPrice: flags.grossPrice,
          taxRate: flags.taxRate,
        }
      : undefined,
  }
}

const articleCreateCommand = buildCommand({
  func(this: CliCommandContext, flags: ArticleBodyFlags) {
    return cliCommandExecute(this, {
      clientInput: { accessToken: flags.accessToken, baseUrl: flags.baseUrl },
      input: articleBodyInputFromFlags(flags),
      inputSchema: articleBodySchema,
      execute: articleCreate,
      op: "articleCreate",
    })
  },
  parameters: {
    flags: {
      ...cliClientOptions,
      ...articleBodyOptions,
    },
  },
  docs: {
    brief: "Create an article",
  },
})

const articleUpdateCommand = buildCommand({
  func(this: CliCommandContext, flags: ArticleUpdateFlags) {
    return cliCommandExecute(this, {
      clientInput: { accessToken: flags.accessToken, baseUrl: flags.baseUrl },
      input: articleBodyInputFromFlags(flags),
      inputSchema: articleBodySchema,
      execute: (client, input) => articleUpdate(client, flags.id, input),
      op: "articleUpdate",
    })
  },
  parameters: {
    flags: {
      ...cliClientOptions,
      id: cliOptionCreate(lexwareIdInputSchema.entries.id, "Article ID"),
      ...articleBodyOptions,
    },
  },
  docs: {
    brief: "Update an article",
  },
})

const articleListCommand = buildCommand({
  func(this: CliCommandContext, flags: ArticleListFlags) {
    return cliCommandExecute(this, {
      clientInput: { accessToken: flags.accessToken, baseUrl: flags.baseUrl },
      input: {
        page: flags.page,
        articleNumber: flags.articleNumber,
        gtin: flags.gtin,
        type: flags.type,
      },
      inputSchema: articleListInputSchema,
      execute: articleList,
      op: "articleList",
    })
  },
  parameters: {
    flags: {
      ...cliClientOptions,
      page: cliOptionCreate(
        a.pipe(cliOptionSchemas.integer, a.unwrap(articleListInputSchema.entries.page)),
        "Page number",
        { optional: true },
      ),
      articleNumber: cliOptionCreate(a.unwrap(articleListInputSchema.entries.articleNumber), "Article number", {
        optional: true,
      }),
      gtin: cliOptionCreate(a.unwrap(articleListInputSchema.entries.gtin), "Global Trade Item Number", {
        optional: true,
      }),
      type: cliOptionCreate(a.unwrap(articleListInputSchema.entries.type), "Article type", { optional: true }),
    },
  },
  docs: {
    brief: "List articles",
  },
})

const articleGetCommand = buildCommand({
  func(this: CliCommandContext, flags: ArticleIdFlags) {
    return cliCommandExecute(this, {
      clientInput: { accessToken: flags.accessToken, baseUrl: flags.baseUrl },
      input: { id: flags.id },
      inputSchema: lexwareIdInputSchema,
      execute: (client, input) => articleGet(client, input.id),
      op: "articleGet",
    })
  },
  parameters: {
    flags: {
      ...cliClientOptions,
      id: cliOptionCreate(lexwareIdInputSchema.entries.id, "Article ID"),
    },
  },
  docs: {
    brief: "Get an article",
  },
})

const articleDeleteCommand = buildCommand({
  func(this: CliCommandContext, flags: ArticleIdFlags) {
    return cliCommandExecute(this, {
      clientInput: { accessToken: flags.accessToken, baseUrl: flags.baseUrl },
      input: { id: flags.id },
      inputSchema: lexwareIdInputSchema,
      execute: (client, input) => articleDelete(client, input.id),
      op: "articleDelete",
    })
  },
  parameters: {
    flags: {
      ...cliClientOptions,
      id: cliOptionCreate(lexwareIdInputSchema.entries.id, "Article ID"),
    },
  },
  docs: {
    brief: "Delete an article",
  },
})

export const articleCommand = buildRouteMap({
  routes: {
    create: articleCreateCommand,
    update: articleUpdateCommand,
    list: articleListCommand,
    get: articleGetCommand,
    delete: articleDeleteCommand,
  },
  docs: {
    brief: "Article commands",
  },
})
