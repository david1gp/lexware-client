# Environment loading

## Goal

Load CLI environment variables from a default or explicitly selected `.env` file and accept `LEXWARE_API_KEY` without removing existing token variable names.

## Decisions

- Keep the installed CLI compatible with Node and Bun.
- Support a global `--env-path <path>` option and default `.env` loading; avoid Node's reserved `--env-file` runtime flag.
- Require `bun --no-env-file` for direct Bun execution so the CLI owns deterministic environment loading.
- Preserve existing process environment values over file values.
- Resolve tokens in this order: `--access-token`, `LEXWARE_TOKEN`, `LEXWARE_API_KEY`, `LEXWARE_ACCESS_TOKEN`.
- Keep `LEXWARE_ACCESS_TOKEN` as a supported legacy alias.

## Approach

- Add runtime-neutral environment-file loading before token resolution.
- Extend token resolution, tests, and user documentation.
- Verify behavior under the supported runtimes and existing quality checks.
- Commit and push the completed changes, then publish a release and correct GitHub Actions OIDC release failures if encountered.

Current context: implementation, tests, documentation, build, and package verification are complete with no release blockers.

## Tasks

- [x] Implement environment-file loading and token alias support.
- [x] Add and run focused and full verification.
- [x] Update CLI documentation.
- [ ] Create conventional commits and push.
- [ ] Publish the release and verify the release workflow.

## Paths

- `src/cli.ts`
- `src/cli/`
- `src/cli.test.ts`
- `README.md`
- `package.json`
- `.github/workflows/`
