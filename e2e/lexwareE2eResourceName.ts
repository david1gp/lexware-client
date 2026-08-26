export function lexwareE2eResourceName(label: string): string {
  return `Davids-KI-E2E-TEST ${label} ${crypto.randomUUID()}`
}
