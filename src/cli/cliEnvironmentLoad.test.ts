import { expect, test } from "bun:test"
import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { cliEnvironmentLoad } from "./cliEnvironmentLoad.js"

test("environment loading parses quoted values, inline comments, and inherited precedence", async () => {
  const directory = await mkdtemp(join(tmpdir(), "lexware-environment-"))
  const filePath = join(directory, "values.env")

  try {
    await writeFile(
      filePath,
      [
        'DOUBLE="value # stays" # trailing comment',
        "SINGLE='value # stays' # trailing comment",
        'ESCAPED="line\\n\\t\\"quote\\"\\\\slash" # trailing comment',
        "UNQUOTED=value#stays # trailing comment",
        "EMPTY=",
        "export EXPORTED=exported",
      ].join("\n"),
    )

    const result = await cliEnvironmentLoad(filePath, {
      DOUBLE: "inherited",
      INHERITED: "yes",
    })

    expect(result).toEqual({
      success: true,
      data: {
        DOUBLE: "inherited",
        SINGLE: "value # stays",
        ESCAPED: 'line\n\t"quote"\\slash',
        UNQUOTED: "value#stays",
        EMPTY: "",
        EXPORTED: "exported",
        INHERITED: "yes",
      },
    })
  } finally {
    await rm(directory, { force: true, recursive: true })
  }
})

test("environment loading returns deterministic JSON errors for malformed files", async () => {
  const directory = await mkdtemp(join(tmpdir(), "lexware-environment-"))
  const filePath = join(directory, "invalid.env")

  try {
    await writeFile(filePath, "LEXWARE_TOKEN=token\nnot an assignment\n")

    await expect(cliEnvironmentLoad(filePath, {})).resolves.toEqual({
      success: false,
      op: "cliEnvironmentLoad",
      errorMessage: `Invalid environment entry in "${filePath}" at line 2`,
    })
  } finally {
    await rm(directory, { force: true, recursive: true })
  }
})
