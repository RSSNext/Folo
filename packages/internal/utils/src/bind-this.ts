/**
 * 自动绑定类实例的所有方法到正确的 this 上下文
 * 防止在解构赋值时丢失 this 指向
 *
 * @param instance 类实例
 * @param excludeMethods 要排除的方法名数组，默认排除 constructor
 * @returns 绑定了 this 的实例
 *
 * @example
 * ```ts
 * class MyClass {
 *   constructor() {
 *     return autoBindThis(this)
 *   }
 *
 *   myMethod() {
 *     console.log(this)
 *   }
 * }
 *
 * const instance = new MyClass()
 * const { myMethod } = instance // 解构不会丢失 this
 * myMethod() // this 仍然指向 instance
 * ```
 */
export function autoBindThis<T extends Record<string, any>>(
  instance: T,
  excludeMethods: string[] = ["constructor"],
): T {
  const prototype = Object.getPrototypeOf(instance)
  const propertyNames = Object.getOwnPropertyNames(prototype)

  for (const name of propertyNames) {
    if (excludeMethods.includes(name)) {
      continue
    }

    const descriptor = Object.getOwnPropertyDescriptor(prototype, name)
    if (descriptor && typeof descriptor.value === "function") {
      ;(instance as any)[name] = instance[name].bind(instance)
    }
  }

  return instance
}

/**
 * 创建一个自动绑定 this 的类装饰器
 *
 * @param excludeMethods 要排除的方法名数组
 * @returns 类装饰器
 *
 * @example
 * ```ts
 * @AutoBindThis()
 * class MyClass {
 *   myMethod() {
 *     console.log(this)
 *   }
 * }
 *
 * const instance = new MyClass()
 * const { myMethod } = instance
 * myMethod() // this 仍然指向 instance
 * ```
 */
export function AutoBindThis(excludeMethods: string[] = ["constructor"]) {
  return function <T extends new (...args: any[]) => any>(constructor: T) {
    return class extends constructor {
      constructor(...args: any[]) {
        super(...args)
        autoBindThis(this, excludeMethods)
      }
    }
  }
}
