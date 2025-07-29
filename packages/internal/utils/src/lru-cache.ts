class LinkNode<K, V> {
  key: K
  value: V
  prev: LinkNode<K, V> | null
  next: LinkNode<K, V> | null

  constructor(key: K, value: V) {
    this.key = key
    this.value = value
    this.prev = null
    this.next = null
  }
}

export class LRUCache<K, V> {
  private capacity: number
  private cache: Map<K, LinkNode<K, V>>
  private head: LinkNode<K, V>
  private tail: LinkNode<K, V>

  constructor(capacity: number) {
    if (capacity <= 0) {
      throw new Error("Capacity must be a positive number")
    }
    this.capacity = capacity
    this.cache = new Map<K, LinkNode<K, V>>()
    // Dummy head and tail nodes for easier list management
    this.head = new LinkNode<K, V>(null as any, null as any)
    this.tail = new LinkNode<K, V>(null as any, null as any)
    this.head.next = this.tail
    this.tail.prev = this.head
  }

  /**
   * Retrieves the value associated with the key and moves it to the front (most recently used).
   * @param key The key to look up
   * @returns The value if found, undefined otherwise
   */
  get(key: K): V | undefined {
    const node = this.cache.get(key)
    if (!node) {
      return undefined
    }
    this.moveToFront(node)
    return node.value
  }

  /**
   * Adds or updates a key-value pair and moves it to the front (most recently used).
   * Evicts the least recently used item if capacity is exceeded.
   * @param key The key to set
   * @param value The value to associate with the key
   */
  put(key: K, value: V): void {
    let node = this.cache.get(key)
    if (node) {
      node.value = value
      this.moveToFront(node)
    } else {
      node = new LinkNode(key, value)
      this.cache.set(key, node)
      this.addToFront(node)
      if (this.cache.size > this.capacity) {
        const lruNode = this.tail.prev!
        this.removeNode(lruNode)
        this.cache.delete(lruNode.key)
      }
    }
  }

  /**
   * Clears all entries in the cache.
   */
  clear(): void {
    this.cache.clear()
    this.head.next = this.tail
    this.tail.prev = this.head
  }

  /**
   * Returns the current number of entries in the cache.
   * @returns The size of the cache
   */
  size(): number {
    return this.cache.size
  }

  /**
   * Moves a node to the front of the list (most recently used).
   * @param node The node to move
   */
  private moveToFront(node: LinkNode<K, V>): void {
    this.removeNode(node)
    this.addToFront(node)
  }

  /**
   * Adds a node to the front of the list.
   * @param node The node to add
   */
  private addToFront(node: LinkNode<K, V>): void {
    node.next = this.head.next
    node.prev = this.head
    this.head.next!.prev = node
    this.head.next = node
  }

  /**
   * Removes a node from the list.
   * @param node The node to remove
   */
  private removeNode(node: LinkNode<K, V>): void {
    node.prev!.next = node.next
    node.next!.prev = node.prev
  }
}
