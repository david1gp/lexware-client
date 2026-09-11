import { existsSync, realpathSync } from "node:fs"
import { release as osRelease } from "node:os"
import { dirname, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import pkg from "../../package.json" with { type: "json" }

type PackageMetadata = typeof pkg & {
  readonly author?: string | { readonly name?: string; readonly url?: string }
  readonly engines?: Readonly<Record<string, string>>
}

type Executable = {
  readonly entrypoint: string
  readonly target?: string
}

const packageMetadata = pkg as PackageMetadata

function cliVersionExecutableResolve(): Executable {
  const entrypoint = process.argv[1]
  if (entrypoint === undefined) return { entrypoint: "unavailable" }

  const resolvedEntrypoint = resolve(entrypoint)
  try {
    return { entrypoint: resolvedEntrypoint, target: realpathSync(resolvedEntrypoint) }
  } catch {
    return { entrypoint: resolvedEntrypoint }
  }
}

function cliVersionInstallationTypeResolve(executableTarget: string | undefined): string {
  const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..")
  if (existsSync(resolve(packageRoot, ".git"))) return "development checkout"
  if (executableTarget !== undefined && !relative(packageRoot, executableTarget).startsWith(".."))
    return "package installation"
  return "unknown"
}

function cliVersionAuthorRender(): string {
  if (typeof packageMetadata.author === "string") return packageMetadata.author
  if (packageMetadata.author !== undefined) {
    return [packageMetadata.author.name, packageMetadata.author.url].filter(Boolean).join(" — ") || "unavailable"
  }
  return "unavailable"
}

function cliVersionRuntimeResolve(): string {
  if (typeof Bun !== "undefined") return `bun ${Bun.version}`
  return `${process.release.name} ${process.version}`
}

function cliVersionRequirementsRender(): string {
  return (
    Object.entries(packageMetadata.engines ?? {})
      .map(([runtime, requirement]) => `${runtime} ${requirement}`)
      .join(", ") || "unavailable"
  )
}

export function cliVersionMetadataRender(): string {
  const executable = cliVersionExecutableResolve()
  const project = packageMetadata.homepage ?? packageMetadata.repository?.url ?? "unavailable"

  return [
    `user agent: ${packageMetadata.name}/${packageMetadata.version}`,
    `executable: ${executable.entrypoint}`,
    `executable target: ${executable.target ?? "unavailable"}`,
    `version: ${packageMetadata.version}`,
    `description: ${packageMetadata.description ?? "unavailable"}`,
    `author: ${cliVersionAuthorRender()}`,
    `license: ${packageMetadata.license ?? "unavailable"}`,
    `project: ${project}`,
    `installation type: ${cliVersionInstallationTypeResolve(executable.target)}`,
    `runtime: ${cliVersionRuntimeResolve()}`,
    `runtime requirements: ${cliVersionRequirementsRender()}`,
    `platform: ${process.platform} ${process.arch} (OS release ${osRelease()})`,
  ].join("\n")
}
