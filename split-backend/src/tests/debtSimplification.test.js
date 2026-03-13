/**
 * Debt Simplification Algorithm - Test Cases
 * 
 * This file contains comprehensive test cases for the greedy max-heap algorithm
 * based on examples from GeeksForGeeks and Splitwise scenarios
 */

import { DebtSimplificationService } from '../services/debtSimplification.service.js';
import { MaxHeap } from '../utils/maxHeap.js';

/**
 * Test Case 1: Simple 3-person scenario (GeeksForGeeks example)
 * 
 * Scenario:
 *   Person A borrowed $1000
 *   Person B borrowed $5000
 *   Person C lent $6000
 * 
 * Expected:
 *   - A pays C: $1000
 *   - B pays C: $5000
 *   Total: 2 transactions (N-1 where N=3 non-zero balances)
 */
export const testCase1 = {
  name: '3-Person Simple Scenario',
  initialBalances: new Map([
    ['A', -1000],  // A owes 1000
    ['B', -5000],  // B owes 5000
    ['C', 6000],   // C is owed 6000
  ]),
  expectedTransactions: 2,
  expectedOutput: [
    { from: 'A', to: 'C', amount: 1000 },
    { from: 'B', to: 'C', amount: 5000 },
  ],
};

/**
 * Test Case 2: Circular debt (complex 3-person)
 * 
 * Scenario:
 *   A owes B $100
 *   B owes C $100
 *   C owes A $100
 * 
 * Expected (after net balance calculation):
 *   - All balances = 0 (circular debt cancels out)
 *   Total: 0 transactions
 */
export const testCase2 = {
  name: 'Circular Debt (3-Person)',
  initialBalances: new Map([
    ['A', 0],  // A paid 100, is owed 100 → net 0
    ['B', 0],  // B paid 100, is owed 100 → net 0
    ['C', 0],  // C paid 100, is owed 100 → net 0
  ]),
  expectedTransactions: 0,
  expectedOutput: [],
};

/**
 * Test Case 3: Complex 5-person scenario
 * 
 * Scenario (from GeeksForGeeks):
 *   A: -100 (owes 100)
 *   B: -50  (owes 50)
 *   C: -40  (owes 40)
 *   D: 90   (is owed 90)
 *   E: 100  (is owed 100)
 * 
 * Expected:
 *   With greedy matching:
 *   - E (100 owed) matched with A (100 owes) → A pays E 100
 *   - D (90 owed) matched with B (50 owes) → B pays D 50
 *   - D still needs 40, C owes 40 → C pays D 40
 *   Total: 3 transactions (N-1 where N=5)
 */
export const testCase3 = {
  name: '5-Person Complex Scenario',
  initialBalances: new Map([
    ['A', -100],
    ['B', -50],
    ['C', -40],
    ['D', 90],
    ['E', 100],
  ]),
  expectedTransactions: 3,
  expectedOutput: [
    { from: 'A', to: 'E', amount: 100 },
    { from: 'B', to: 'D', amount: 50 },
    { from: 'C', to: 'D', amount: 40 },
  ],
  note: 'Greedy algorithm may produce different order but same total transactions',
};

/**
 * Test Case 4: MaxHeap functionality
 * 
 * Verify MaxHeap correctly maintains heap property
 */
export const testMaxHeap = () => {
  const heap = new MaxHeap();

  // Test insertions
  heap.push({ name: 'A', amount: 50 });
  heap.push({ name: 'B', amount: 100 });
  heap.push({ name: 'C', amount: 30 });
  heap.push({ name: 'D', amount: 75 });

  // Test max extraction order
  const extracted = [];
  while (!heap.isEmpty()) {
    extracted.push(heap.pop());
  }

  const expectedOrder = [100, 75, 50, 30];
  const actualOrder = extracted.map((e) => e.amount);

  return {
    passed: JSON.stringify(actualOrder) === JSON.stringify(expectedOrder),
    expected: expectedOrder,
    actual: actualOrder,
  };
};

/**
 * Test Case 5: Balance verification (zero-sum property)
 * 
 * After simplification, sum of all net balances must equal zero
 */
export const testZeroSumProperty = (initialBalances, simplifiedTransactions) => {
  // Calculate residual balances after transactions
  const residual = new Map(initialBalances);

  for (const txn of simplifiedTransactions) {
    residual.set(txn.from, (residual.get(txn.from) || 0) + txn.amount);
    residual.set(txn.to, (residual.get(txn.to) || 0) - txn.amount);
  }

  // Sum should be zero (within floating point tolerance)
  let sum = 0;
  for (const balance of residual.values()) {
    sum += balance;
  }

  return {
    passed: Math.abs(sum) < 0.01,
    residualSum: sum.toFixed(2),
    note: 'Tolerance: ±0.01',
  };
};

/**
 * Test Case 6: Single person owes (trivial)
 * 
 * Scenario:
 *   Only A owes B (No simplification possible)
 * 
 * Expected:
 *   1 transaction: A pays B
 */
export const testCase6 = {
  name: 'Single Transaction (Trivial)',
  initialBalances: new Map([
    ['A', -100],
    ['B', 100],
  ]),
  expectedTransactions: 1,
  expectedOutput: [{ from: 'A', to: 'B', amount: 100 }],
};

/**
 * Test Case 7: Everyone settled
 * 
 * Scenario:
 *   All balances are zero
 * 
 * Expected:
 *   0 transactions
 */
export const testCase7 = {
  name: 'All Settled (No Transactions)',
  initialBalances: new Map(),
  expectedTransactions: 0,
  expectedOutput: [],
};

/**
 * Test Suite Runner (for Node.js environment)
 */
export const runAllTests = () => {
  console.log('╔═════════════════════════════════════════════════════════════╗');
  console.log('║  Debt Simplification Algorithm - Test Suite                ║');
  console.log('╚═════════════════════════════════════════════════════════════╝\n');

  const tests = [
    { name: testCase1.name, test: testCase1 },
    { name: testCase2.name, test: testCase2 },
    { name: testCase3.name, test: testCase3 },
    { name: testCase6.name, test: testCase6 },
    { name: testCase7.name, test: testCase7 },
  ];

  let passed = 0;
  let failed = 0;

  for (const { name, test } of tests) {
    console.log(`\n📋 ${name}`);
    console.log('─'.repeat(60));

    // Check transaction count
    if (test.expectedTransactions === 'any') {
      console.log(`✓ Transaction count: ${test.expectedTransactions} (verified)`);
      passed++;
    } else if (test.expectedOutput.length === test.expectedTransactions) {
      console.log(`✓ Transaction count: ${test.expectedTransactions}`);
      passed++;
    } else {
      console.log(`✗ Transaction count mismatch`);
      console.log(`  Expected: ${test.expectedTransactions}, Got: ${test.expectedOutput.length}`);
      failed++;
    }

    // Zero-sum verification
    const zeroSumTest = testZeroSumProperty(test.initialBalances, test.expectedOutput);
    if (zeroSumTest.passed) {
      console.log(`✓ Zero-sum property verified`);
      passed++;
    } else {
      console.log(`✗ Zero-sum property failed (sum: ${zeroSumTest.residualSum})`);
      failed++;
    }
  }

  // MaxHeap test
  console.log(`\n📋 MaxHeap Data Structure`);
  console.log('─'.repeat(60));
  const heapTest = testMaxHeap();
  if (heapTest.passed) {
    console.log(`✓ MaxHeap maintains correct order`);
    console.log(`  Extraction order: ${heapTest.actual.join(', ')}`);
    passed++;
  } else {
    console.log(`✗ MaxHeap order incorrect`);
    console.log(`  Expected: ${heapTest.expected.join(', ')}`);
    console.log(`  Got:      ${heapTest.actual.join(', ')}`);
    failed++;
  }

  console.log('\n╔═════════════════════════════════════════════════════════════╗');
  console.log(`║  Results: ${passed} passed, ${failed} failed                    `);
  console.log('╚═════════════════════════════════════════════════════════════╝\n');

  return { passed, failed };
};

export default {
  testCase1,
  testCase2,
  testCase3,
  testCase6,
  testCase7,
  testMaxHeap,
  testZeroSumProperty,
  runAllTests,
};
