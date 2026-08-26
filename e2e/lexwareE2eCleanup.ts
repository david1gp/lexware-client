type LexwareE2eCleanupAction = () => Promise<void>

export function lexwareE2eCleanup() {
  const actions: LexwareE2eCleanupAction[] = []

  return {
    add(action: LexwareE2eCleanupAction): void {
      actions.push(action)
    },
    async run(): Promise<void> {
      const pendingActions = actions.splice(0).reverse()
      let hasFailure = false

      for (const action of pendingActions) {
        try {
          await action()
        } catch {
          hasFailure = true
        }
      }

      if (hasFailure) throw new Error("Live E2E cleanup failed")
    },
  }
}
