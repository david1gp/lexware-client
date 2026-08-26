import { expect, test } from "bun:test"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

type CliExecution = {
  readonly exitCode: number
  readonly stderr: string
  readonly stdout: string
}

type CliResult = {
  readonly errorMessage?: unknown
  readonly op?: unknown
  readonly success: unknown
  readonly data?: unknown
  readonly statusCode?: unknown
}

type CliRunOptions = {
  readonly cwd?: string
  readonly environment?: Readonly<Record<string, string>>
  readonly executable?: string
  readonly runtime?: CliRuntime
  readonly unsetEnvironment?: readonly string[]
}

type CliRuntime = "bun" | "node"

type MockApiRequest = {
  readonly authorization: string | null
  body?: unknown
  readonly method: string
  readonly path: string
  readonly query: Record<string, string>
}

type MockApiHandler = (request: Request, url: URL, captured: MockApiRequest) => Response | Promise<Response>

type MockApi = {
  readonly baseUrl: string
  readonly requests: MockApiRequest[]
  readonly stop: () => void
}

const sourceCliPath = new URL("./cli.ts", import.meta.url).pathname
const builtCliPath = new URL("../dist/cli.js", import.meta.url).pathname

test("CLI success and help output are JSON", async () => {
  const root = await cliExecutableRun([])
  expect(root.exitCode).toBe(0)
  expect(root.stderr).toBe("")
  expect(cliResultParse(root.stdout)).toEqual({
    success: true,
    data: { command: "lexware", brief: "Run Lexware Office API commands" },
  })

  const help = await cliExecutableRun(["--help"])
  expect(help.exitCode).toBe(0)
  expect(help.stderr).toBe("")
  const helpResult = cliResultParse(help.stdout)
  expect(helpResult.success).toBe(true)
  expect(helpResult.data).toBeString()
  expect(helpResult.data).toContain("lexware article")
  expect(helpResult.data).toContain("--env-path")

  const nestedHelp = await cliExecutableRun(["invoice", "create", "--help"])
  expect(nestedHelp.exitCode).toBe(0)
  expect(nestedHelp.stderr).toBe("")
  const nestedHelpResult = cliResultParse(nestedHelp.stdout)
  expect(nestedHelpResult.success).toBe(true)
  expect(nestedHelpResult.data).toContain("--line-item-type]...")
  expect(nestedHelpResult.data).toContain("--env-path")

  const missingEnvPath = await cliExecutableRun(["--env-path", "--help"])
  expect(missingEnvPath.exitCode).not.toBe(0)
  expect(missingEnvPath.stdout).toBe("")
  expect(cliResultParse(missingEnvPath.stderr)).toEqual({
    success: false,
    op: "cliRunInputsPrepare",
    errorMessage: "--env-path requires a path",
  })
})

test("CLI delegates representative read and write routes to the API", async () => {
  const api = mockApiStart(async (request, url, captured) => {
    if (request.method === "GET" && url.pathname === "/v1/articles") {
      return jsonResponse({ items: [{ id: "article-1" }] })
    }

    if (request.method === "POST" && url.pathname === "/v1/articles") {
      captured.body = JSON.parse(await request.text()) as unknown
      return jsonResponse({ id: "article-2" })
    }

    if (request.method === "PUT" && url.pathname === "/v1/articles/article-3") {
      captured.body = JSON.parse(await request.text()) as unknown
      return jsonResponse({ id: "article-3" })
    }

    return jsonResponse({ success: false, op: "mockApi", errorMessage: "Unexpected request" }, { status: 500 })
  })

  try {
    const list = await cliExecutableRun(
      ["article", "list", "--base-url", api.baseUrl, "--page", "2", "--type", "PRODUCT"],
      { environment: { LEXWARE_TOKEN: "environment-token", LEXWARE_ACCESS_TOKEN: "legacy-token" } },
    )
    expect(list.exitCode).toBe(0)
    expect(list.stderr).toBe("")
    expect(cliResultParse(list.stdout)).toEqual({ success: true, data: { items: [{ id: "article-1" }] } })

    const create = await cliExecutableRun(
      [
        "article",
        "create",
        "--base-url",
        api.baseUrl,
        "--access-token",
        "option-token",
        "--type",
        "PRODUCT",
        "--title",
        "Desk",
        "--leading-price",
        "NET",
        "--net-price",
        "10",
        "--tax-rate",
        "19",
      ],
      { environment: { LEXWARE_TOKEN: "environment-token" } },
    )
    expect(create.exitCode).toBe(0)
    expect(create.stderr).toBe("")
    expect(cliResultParse(create.stdout)).toEqual({ success: true, data: { id: "article-2" } })

    const update = await cliExecutableRun([
      "article",
      "update",
      "--base-url",
      api.baseUrl,
      "--access-token",
      "option-token",
      "--id",
      "article-3",
      "--type",
      "SERVICE",
      "--title",
      "Consulting",
      "--leading-price",
      "GROSS",
      "--gross-price",
      "12.5",
    ])
    expect(update.exitCode).toBe(0)
    expect(update.stderr).toBe("")
    expect(cliResultParse(update.stdout)).toEqual({ success: true, data: { id: "article-3" } })

    expect(api.requests).toHaveLength(3)
    expect(api.requests[0]).toMatchObject({
      authorization: "Bearer environment-token",
      method: "GET",
      path: "/v1/articles",
      query: { page: "2", type: "PRODUCT" },
    })
    expect(api.requests[1]).toMatchObject({
      authorization: "Bearer option-token",
      method: "POST",
      path: "/v1/articles",
      body: {
        title: "Desk",
        type: "PRODUCT",
        price: { leadingPrice: "NET", netPrice: 10, taxRate: 19 },
        version: 0,
      },
    })
    expect(api.requests[2]).toMatchObject({
      authorization: "Bearer option-token",
      method: "PUT",
      path: "/v1/articles/article-3",
      body: {
        title: "Consulting",
        type: "SERVICE",
        price: { leadingPrice: "GROSS", grossPrice: 12.5 },
      },
    })
  } finally {
    api.stop()
  }
})

test("CLI reports typed and assembled validation failures before calling the API", async () => {
  const api = mockApiStart(() => jsonResponse({ ok: true }))

  try {
    const typed = await cliExecutableRun([
      "article",
      "list",
      "--base-url",
      api.baseUrl,
      "--access-token",
      "token",
      "--page",
      "not-a-number",
    ])
    expect(typed.exitCode).not.toBe(0)
    expect(typed.stdout).toBe("")
    expect(cliResultParse(typed.stderr)).toMatchObject({ success: false, op: "cliArgumentParse" })

    const assembled = await cliExecutableRun([
      "article",
      "create",
      "--base-url",
      api.baseUrl,
      "--access-token",
      "token",
      "--type",
      "PRODUCT",
      "--net-price",
      "1",
    ])
    expect(assembled.exitCode).not.toBe(0)
    expect(assembled.stdout).toBe("")
    const assembledResult = cliResultParse(assembled.stderr)
    expect(assembledResult).toMatchObject({ success: false, op: "articleCreate" })
    expect(assembledResult.errorMessage).toContain("leadingPrice")
    expect(api.requests).toHaveLength(0)
  } finally {
    api.stop()
  }
})

test("CLI uses environment token fallbacks and rejects missing authentication", async () => {
  const api = mockApiStart(() => jsonResponse({ countries: ["DE"] }))

  try {
    const legacy = await cliExecutableRun(["country", "list", "--base-url", api.baseUrl], {
      environment: { LEXWARE_ACCESS_TOKEN: "legacy-token" },
      unsetEnvironment: ["LEXWARE_TOKEN", "LEXWARE_API_KEY"],
    })
    expect(legacy.exitCode).toBe(0)
    expect(legacy.stderr).toBe("")
    expect(cliResultParse(legacy.stdout)).toEqual({ success: true, data: { countries: ["DE"] } })
    expect(api.requests[0]?.authorization).toBe("Bearer legacy-token")

    const missing = await cliExecutableRun(["country", "list", "--base-url", api.baseUrl])
    expect(missing.exitCode).not.toBe(0)
    expect(missing.stdout).toBe("")
    expect(cliResultParse(missing.stderr)).toMatchObject({ success: false, op: "cliAccessTokenResolve" })
    expect(api.requests).toHaveLength(1)
  } finally {
    api.stop()
  }
})

test("CLI loads default and selected environment files without overriding inherited values", async () => {
  const directory = await mkdtemp(join(tmpdir(), "lexware-cli-env-"))
  const envFilePath = join(directory, "selected.env")
  await writeFile(join(directory, ".env"), "LEXWARE_API_KEY=file-api-key\n")
  await writeFile(envFilePath, "LEXWARE_TOKEN=file-token\n")
  const api = mockApiStart(() => jsonResponse({ countries: ["DE"] }))

  try {
    const inherited = await cliExecutableRun(["country", "list", "--base-url", api.baseUrl], {
      cwd: directory,
      environment: { LEXWARE_API_KEY: "inherited-api-key" },
      unsetEnvironment: ["LEXWARE_TOKEN"],
    })
    expect(inherited.exitCode).toBe(0)
    expect(cliResultParse(inherited.stdout)).toEqual({ success: true, data: { countries: ["DE"] } })
    expect(api.requests[0]?.authorization).toBe("Bearer inherited-api-key")

    const selected = await cliExecutableRun(["--env-path", envFilePath, "country", "list", "--base-url", api.baseUrl], {
      cwd: directory,
      unsetEnvironment: ["LEXWARE_TOKEN", "LEXWARE_API_KEY"],
    })
    expect(selected.exitCode).toBe(0)
    expect(cliResultParse(selected.stdout)).toEqual({ success: true, data: { countries: ["DE"] } })
    expect(api.requests[1]?.authorization).toBe("Bearer file-token")

    const selectedAfterRoute = await cliExecutableRun(
      ["country", "list", "--base-url", api.baseUrl, `--env-path=${envFilePath}`],
      { cwd: directory, unsetEnvironment: ["LEXWARE_TOKEN", "LEXWARE_API_KEY"] },
    )
    expect(selectedAfterRoute.exitCode).toBe(0)
    expect(api.requests[2]?.authorization).toBe("Bearer file-token")

    const missing = await cliExecutableRun(["--env-path", join(directory, "missing.env"), "--help"], {
      cwd: directory,
    })
    expect(missing.exitCode).not.toBe(0)
    expect(missing.stdout).toBe("")
    expect(cliResultParse(missing.stderr)).toEqual({
      success: false,
      op: "cliEnvironmentLoad",
      errorMessage: `Unable to read environment file "${join(directory, "missing.env")}"`,
    })
  } finally {
    api.stop()
    await rm(directory, { force: true, recursive: true })
  }
})

test("CLI executes print-layout list command and outputs JSON", async () => {
  const api = mockApiStart(async (request, url) => {
    if (request.method === "GET" && url.pathname === "/v1/print-layouts") {
      return jsonResponse([{ id: "layout-1", name: "Default" }])
    }

    return jsonResponse({ success: false, op: "mockApi", errorMessage: "Unexpected request" }, { status: 500 })
  })

  try {
    const list = await cliExecutableRun([
      "print-layout",
      "list",
      "--base-url",
      api.baseUrl,
      "--access-token",
      "test-token",
    ])
    expect(list.exitCode).toBe(0)
    expect(list.stderr).toBe("")
    expect(cliResultParse(list.stdout)).toEqual({
      success: true,
      data: [{ id: "layout-1", name: "Default" }],
    })
    expect(api.requests).toHaveLength(1)
    expect(api.requests[0]).toMatchObject({
      authorization: "Bearer test-token",
      method: "GET",
      path: "/v1/print-layouts",
    })
  } finally {
    api.stop()
  }
})

test("CLI diagnostics and API errors stay JSON and use failure status codes", async () => {
  const frameworkCases = [
    { args: ["article", "unknown"], op: "cliCommandRoute" },
    { args: ["article", "list", "--unknown-option"], op: "cliArgumentParse" },
    { args: ["article", "get"], op: "cliArgumentParse" },
    { args: ["article", "list", "--page", "not-a-number"], op: "cliArgumentParse" },
    { args: ["article", "list", "1"], op: "cliArgumentParse" },
    { args: ["article", "list", '{"page":1}'], op: "cliArgumentParse" },
  ]

  for (const testCase of frameworkCases) {
    const result = await cliExecutableRun(testCase.args)
    expect(result.exitCode).not.toBe(0)
    expect(result.stdout).toBe("")
    const error = cliResultParse(result.stderr)
    expect(error).toMatchObject({ success: false, op: testCase.op })
    expect(error.errorMessage).toBeString()
  }

  const api = mockApiStart(() =>
    jsonResponse({ success: false, op: "mockApi", errorMessage: "Request rejected" }, { status: 422 }),
  )
  try {
    const result = await cliExecutableRun(["article", "list", "--base-url", api.baseUrl, "--access-token", "token"])
    expect(result.exitCode).not.toBe(0)
    expect(result.stdout).toBe("")
    expect(cliResultParse(result.stderr)).toEqual({
      success: false,
      op: "mockApi",
      errorMessage: "Request rejected",
      statusCode: 422,
    })
  } finally {
    api.stop()
  }
})

test("CLI uploads files and returns download metadata while writing bytes only when requested", async () => {
  const directory = await mkdtemp(join(tmpdir(), "lexware-cli-"))
  const uploadPath = join(directory, "upload.txt")
  const outputPath = join(directory, "download.bin")
  await writeFile(uploadPath, "upload contents")

  const api = mockApiStart(async (request, url, captured) => {
    if (request.method === "POST" && url.pathname === "/v1/files") {
      const form = await request.formData()
      const file = form.get("file")
      captured.body = {
        contents: file instanceof File ? await file.text() : null,
        filename: file instanceof File ? file.name : null,
        type: form.get("type"),
      }
      return jsonResponse({ id: "file-1" })
    }

    if (request.method === "GET" && url.pathname === "/v1/files/file-1") {
      return new Response(Uint8Array.from([0, 1, 2, 255]), {
        headers: {
          "Content-Disposition": 'attachment; filename="download.bin"',
          "Content-Type": "application/octet-stream",
        },
      })
    }

    return jsonResponse({ success: false, op: "mockApi", errorMessage: "Unexpected request" }, { status: 500 })
  })

  try {
    const upload = await cliExecutableRun([
      "file",
      "upload",
      "--base-url",
      api.baseUrl,
      "--access-token",
      "token",
      "--type",
      "TEXT",
      "--filename",
      "remote.txt",
      "--path",
      uploadPath,
    ])
    expect(upload.exitCode).toBe(0)
    expect(upload.stderr).toBe("")
    expect(cliResultParse(upload.stdout)).toEqual({ success: true, data: { id: "file-1" } })
    expect(api.requests[0]?.body).toEqual({ contents: "upload contents", filename: "remote.txt", type: "text" })

    const metadata = await cliExecutableRun([
      "file",
      "download",
      "--base-url",
      api.baseUrl,
      "--access-token",
      "token",
      "--id",
      "file-1",
    ])
    expect(metadata.exitCode).toBe(0)
    expect(metadata.stderr).toBe("")
    expect(cliResultParse(metadata.stdout)).toEqual({
      success: true,
      data: { filename: "download.bin", contentType: "application/octet-stream", byteLength: 4, output: null },
    })

    const download = await cliExecutableRun([
      "file",
      "download",
      "--base-url",
      api.baseUrl,
      "--access-token",
      "token",
      "--id",
      "file-1",
      "--output",
      outputPath,
    ])
    expect(download.exitCode).toBe(0)
    expect(download.stderr).toBe("")
    expect(cliResultParse(download.stdout)).toEqual({
      success: true,
      data: { filename: "download.bin", contentType: "application/octet-stream", byteLength: 4, output: outputPath },
    })
    expect(new Uint8Array(await readFile(outputPath))).toEqual(Uint8Array.from([0, 1, 2, 255]))
  } finally {
    api.stop()
    await rm(directory, { force: true, recursive: true })
  }
})

test("built package bin executes under the Node and Bun runtime matrix", async () => {
  expect(await Bun.file(builtCliPath).exists()).toBe(true)
  const directory = await mkdtemp(join(tmpdir(), "lexware-cli-runtime-"))
  const envPath = join(directory, "runtime.env")
  await writeFile(envPath, "LEXWARE_TOKEN=runtime-token\n")
  const api = mockApiStart(() => jsonResponse({ countries: ["DE"] }))

  try {
    for (const runtime of ["bun", "node"] as const) {
      const result = await cliExecutableRun(["--env-path", envPath, "country", "list", "--base-url", api.baseUrl], {
        cwd: directory,
        executable: builtCliPath,
        runtime,
        unsetEnvironment: ["LEXWARE_TOKEN"],
      })
      expect(result.exitCode).toBe(0)
      expect(result.stderr).toBe("")
      expect(cliResultParse(result.stdout)).toEqual({ success: true, data: { countries: ["DE"] } })
    }
    expect(api.requests.map((request) => request.authorization)).toEqual([
      "Bearer runtime-token",
      "Bearer runtime-token",
    ])
  } finally {
    api.stop()
    await rm(directory, { force: true, recursive: true })
  }
})

async function cliExecutableRun(args: readonly string[], options: CliRunOptions = {}): Promise<CliExecution> {
  const executable = options.executable ?? sourceCliPath
  const command = cliCommandCreate(executable, args, options.runtime)
  const environment: Record<string, string | undefined> = {
    ...process.env,
    LEXWARE_TOKEN: "",
    LEXWARE_API_KEY: "",
    LEXWARE_ACCESS_TOKEN: "",
    ...options.environment,
  }
  for (const variable of options.unsetEnvironment ?? []) delete environment[variable]

  const child = Bun.spawn(command, {
    cwd: options.cwd,
    env: environment,
    stderr: "pipe",
    stdout: "pipe",
  })

  const [stdout, stderr, exitCode] = await Promise.all([
    Bun.readableStreamToText(child.stdout),
    Bun.readableStreamToText(child.stderr),
    child.exited,
  ])

  return { exitCode, stderr, stdout }
}

function cliCommandCreate(executable: string, args: readonly string[], runtime?: CliRuntime): string[] {
  if (runtime === "bun") return [process.execPath, "--no-env-file", executable, ...args]
  if (runtime === "node") return ["node", executable, ...args]
  if (executable.endsWith(".ts")) return [process.execPath, "--no-env-file", executable, ...args]
  return [executable, ...args]
}

function cliResultParse(value: string): CliResult {
  return JSON.parse(value) as CliResult
}

function jsonResponse(data: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  })
}

function mockApiStart(handler: MockApiHandler): MockApi {
  const requests: MockApiRequest[] = []
  const server = Bun.serve({
    port: 0,
    async fetch(request) {
      const url = new URL(request.url)
      const captured: MockApiRequest = {
        authorization: request.headers.get("Authorization"),
        method: request.method,
        path: url.pathname,
        query: Object.fromEntries(url.searchParams.entries()),
      }
      requests.push(captured)
      return handler(request, url, captured)
    },
  })

  return {
    baseUrl: `http://127.0.0.1:${server.port}`,
    requests,
    stop: () => server.stop(),
  }
}
