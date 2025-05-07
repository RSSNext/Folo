class Registry {
  private actions: Record<string, () => void> = {}

  add(key: string, action: () => void) {
    this.actions[key] = action

    return () => {
      delete this.actions[key]
    }
  }

  remove(key: string) {
    delete this.actions[key]
  }

  getAll() {
    return this.actions
  }

  get(key: string) {
    return this.actions[key]
  }
}

export const DebugRegistry = new Registry()
