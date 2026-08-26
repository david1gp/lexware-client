import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { createResult, createResultError, type Result } from "#result"
import type { CliEnvironment } from "./cliAccessTokenResolve.js"

export async function cliEnvironmentLoad(
  envPath: string | undefined,
  inheritedEnvironment: CliEnvironment = process.env,
): Promise<Result<CliEnvironment>> {
  const op = "cliEnvironmentLoad"
  const filePath = envPath ?? join(process.cwd(), ".env")
  let contents: string

  try {
    contents = await readFile(filePath, "utf8")
  } catch (error) {
    if (envPath === undefined && cliEnvironmentLoadErrorCode(error) === "ENOENT") {
      return createResult({ ...inheritedEnvironment })
    }

    return createResultError(op, `Unable to read environment file "${filePath}"`)
  }

  const fileEnvironmentResult = cliEnvironmentFileParse(contents, filePath)
  if (!fileEnvironmentResult.success) return fileEnvironmentResult

  const environment: Record<string, string> = { ...fileEnvironmentResult.data }
  for (const [key, value] of Object.entries(inheritedEnvironment)) {
    if (value !== undefined) environment[key] = value
  }

  return createResult(environment)
}

function cliEnvironmentFileParse(contents: string, filePath: string): Result<Record<string, string>> {
  const op = "cliEnvironmentLoad"
  const environment: Record<string, string> = {}
  const lines = contents.replace(/^\uFEFF/, "").split(/\r\n|\n|\r/)

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]?.trim() ?? ""
    if (line.length === 0 || line.startsWith("#")) continue

    const assignment = /^export(?:\s+)(.*)$/.exec(line)?.[1] ?? line
    const match = /^([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$/.exec(assignment)
    if (match === null) {
      return createResultError(op, `Invalid environment entry in "${filePath}" at line ${index + 1}`)
    }

    const key = match[1]
    if (key === undefined) {
      return createResultError(op, `Invalid environment entry in "${filePath}" at line ${index + 1}`)
    }
    const valueResult = cliEnvironmentValueParse(match[2] ?? "")
    if (!valueResult.success) {
      return createResultError(op, `${valueResult.errorMessage} in "${filePath}" at line ${index + 1}`)
    }

    environment[key] = valueResult.data
  }

  return createResult(environment)
}

function cliEnvironmentValueParse(input: string): Result<string> {
  const op = "cliEnvironmentValueParse"
  const value = input.trimStart()

  if (value.startsWith('"')) {
    let escaped = false
    for (let index = 1; index < value.length; index += 1) {
      const character = value[index]
      if (escaped) {
        escaped = false
        continue
      }
      if (character === "\\") {
        escaped = true
        continue
      }
      if (character !== '"') continue

      const remainder = value.slice(index + 1).trim()
      if (remainder.length > 0 && !remainder.startsWith("#")) {
        return createResultError(op, "Unexpected characters after quoted environment value")
      }

      return createResult(cliEnvironmentDoubleQuotedValueParse(value.slice(1, index)))
    }

    return createResultError(op, "Unterminated double-quoted environment value")
  }

  if (value.startsWith("'")) {
    const closingQuoteIndex = value.indexOf("'", 1)
    if (closingQuoteIndex === -1) return createResultError(op, "Unterminated single-quoted environment value")

    const remainder = value.slice(closingQuoteIndex + 1).trim()
    if (remainder.length > 0 && !remainder.startsWith("#")) {
      return createResultError(op, "Unexpected characters after quoted environment value")
    }

    return createResult(value.slice(1, closingQuoteIndex))
  }

  const commentIndex = value.search(/\s+#/)
  return createResult((commentIndex === -1 ? value : value.slice(0, commentIndex)).trimEnd())
}

function cliEnvironmentDoubleQuotedValueParse(value: string): string {
  let parsed = ""

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index]
    if (character !== "\\") {
      parsed += character
      continue
    }

    const escaped = value[index + 1]
    if (escaped === undefined) {
      parsed += "\\"
      continue
    }

    parsed += { n: "\n", r: "\r", t: "\t", '"': '"', "\\": "\\" }[escaped] ?? `\\${escaped}`
    index += 1
  }

  return parsed
}

function cliEnvironmentLoadErrorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("code" in error)) return undefined
  const code = error.code
  return typeof code === "string" ? code : undefined
}
