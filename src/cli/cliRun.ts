import { type Application, run, type StricliProcess } from "@stricli/core"
import { createResult, createResultError, type Result } from "#result"
import type { CliCommandContext } from "./cliCommandContext.js"
import { cliEnvironmentLoad } from "./cliEnvironmentLoad.js"
import { cliJsonStringify } from "./cliJsonStringify.js"

type CliRunOutput = {
  stdout: string
  stderr: string
}

type CliRunInputs = {
  readonly envPath?: string
  readonly inputs: readonly string[]
}

export async function cliRun(
  application: Application<CliCommandContext>,
  inputs: readonly string[],
  process: StricliProcess,
): Promise<void> {
  const output: CliRunOutput = { stdout: "", stderr: "" }
  const inputResult = cliRunInputsPrepare(inputs)
  if (!inputResult.success) {
    process.exitCode = 1
    output.stderr += `${cliJsonStringify(inputResult)}\n`
    cliRunOutputWrite(process, output)
    return
  }

  const environmentResult = await cliEnvironmentLoad(inputResult.data.envPath, process.env)
  if (!environmentResult.success) {
    process.exitCode = 1
    output.stderr += `${cliJsonStringify(environmentResult)}\n`
    cliRunOutputWrite(process, output)
    return
  }

  const runProcess = cliRunProcessCreate(process, output, environmentResult.data)

  try {
    await run(application, inputResult.data.inputs, { process: runProcess })
  } catch (error) {
    runProcess.exitCode = 1
    output.stderr += `${cliJsonStringify(createResultError("cliRun", cliRunErrorMessage(error)))}\n`
  }

  cliRunOutputWrite(process, output)
}

function cliRunInputsPrepare(inputs: readonly string[]): Result<CliRunInputs> {
  const op = "cliRunInputsPrepare"
  const commandInputs: string[] = []
  let envPath: string | undefined

  for (let index = 0; index < inputs.length; index += 1) {
    const input = inputs[index]
    if (input === "--env-path") {
      const path = inputs[index + 1]
      if (path === undefined || path.startsWith("--")) return createResultError(op, "--env-path requires a path")
      envPath = path
      index += 1
      continue
    }

    if (input?.startsWith("--env-path=")) {
      const path = input.slice("--env-path=".length)
      if (path.length === 0) return createResultError(op, "--env-path requires a path")
      envPath = path
      continue
    }

    if (input !== undefined) commandInputs.push(input)
  }

  return createResult({ envPath, inputs: commandInputs })
}

function cliRunProcessCreate(
  process: StricliProcess,
  output: CliRunOutput,
  environment: Readonly<Record<string, string | undefined>>,
): StricliProcess {
  return {
    env: environment,
    get exitCode() {
      return process.exitCode
    },
    set exitCode(value) {
      process.exitCode = value
    },
    stdout: cliRunStreamCreate(process.stdout, output, "stdout"),
    stderr: cliRunStreamCreate(process.stderr, output, "stderr"),
  }
}

function cliRunStreamCreate(
  stream: StricliProcess["stdout"],
  output: CliRunOutput,
  key: keyof CliRunOutput,
): StricliProcess["stdout"] {
  return {
    write(value: string) {
      output[key] += value
    },
    getColorDepth: stream.getColorDepth === undefined ? undefined : (env) => stream.getColorDepth?.(env) ?? 1,
  }
}

function cliRunOutputWrite(process: StricliProcess, output: CliRunOutput): void {
  const stdout = cliRunOutputNormalize(output.stdout, true)
  if (stdout !== undefined) process.stdout.write(`${stdout}\n`)

  const stderr = cliRunOutputNormalize(output.stderr, false)
  if (stderr !== undefined) process.stderr.write(`${stderr}\n`)
}

function cliRunOutputNormalize(value: string, success: boolean): string | undefined {
  const trimmed = value.trim()
  if (trimmed.length === 0) return undefined

  try {
    JSON.parse(trimmed)
    return trimmed
  } catch {
    if (success) return cliJsonStringify(createResult(trimmed))
    return cliJsonStringify(createResultError("cliOutput", trimmed))
  }
}

function cliRunErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
