/**
 * MaxHeap - Priority queue data structure for greedy debt settlement
 * Efficiently retrieves the person with max balance (creditor or debtor)
 * Time Complexity: O(log N) for insert/extract, O(1) for peek
 */
export class MaxHeap {
  constructor() {
    this.heap = [];
  }

  /**
   * Parent index in heap array (used for traversal)
   */
  parentIdx(idx) {
    return Math.floor((idx - 1) / 2);
  }

  /**
   * Left child index
   */
  leftChildIdx(idx) {
    return 2 * idx + 1;
  }

  /**
   * Right child index
   */
  rightChildIdx(idx) {
    return 2 * idx + 2;
  }

  /**
   * Swap two elements in heap
   */
  swap(idx1, idx2) {
    [this.heap[idx1], this.heap[idx2]] = [this.heap[idx2], this.heap[idx1]];
  }

  /**
   * Insert element and maintain heap property
   * O(log N)
   */
  push(item) {
    this.heap.push(item);
    this.bubbleUp(this.heap.length - 1);
  }

  /**
   * Move element up the heap until heap property satisfied
   */
  bubbleUp(idx) {
    if (idx === 0) return;

    const parentIdx = this.parentIdx(idx);
    if (this.heap[parentIdx].amount < this.heap[idx].amount) {
      this.swap(idx, parentIdx);
      this.bubbleUp(parentIdx);
    }
  }

  /**
   * Remove and return max element
   * O(log N)
   */
  pop() {
    if (this.heap.length === 0) return null;
    if (this.heap.length === 1) return this.heap.pop();

    const max = this.heap[0];
    this.heap[0] = this.heap.pop();
    this.bubbleDown(0);
    return max;
  }

  /**
   * Move element down the heap until heap property satisfied
   */
  bubbleDown(idx) {
    const leftIdx = this.leftChildIdx(idx);
    const rightIdx = this.rightChildIdx(idx);
    let largestIdx = idx;

    if (leftIdx < this.heap.length && this.heap[leftIdx].amount > this.heap[largestIdx].amount) {
      largestIdx = leftIdx;
    }

    if (rightIdx < this.heap.length && this.heap[rightIdx].amount > this.heap[largestIdx].amount) {
      largestIdx = rightIdx;
    }

    if (largestIdx !== idx) {
      this.swap(idx, largestIdx);
      this.bubbleDown(largestIdx);
    }
  }

  /**
   * View max element without removing
   * O(1)
   */
  peek() {
    return this.heap.length > 0 ? this.heap[0] : null;
  }

  /**
   * Check if heap is empty
   */
  isEmpty() {
    return this.heap.length === 0;
  }

  /**
   * Get current size
   */
  size() {
    return this.heap.length;
  }

  /**
   * Debug: print heap contents
   */
  print() {
    console.log('Heap contents:', this.heap);
  }
}

export default MaxHeap;
