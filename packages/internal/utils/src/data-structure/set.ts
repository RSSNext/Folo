export class EnhanceSet<T> extends Set<T> {
  only(value: T) {
    return this.size === 1 && super.has(value)
  }

  clone() {
    return new EnhanceSet(this)
  }

  static of<T>(...values: T[]) {
    return new EnhanceSet(values)
  }

  override has(...value: T[]): boolean {
    return value.every((v) => super.has(v))
  }

  or(...value: T[]): boolean {
    return value.some((v) => super.has(v))
  }
}
