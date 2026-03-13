/**
 * DebtSimplificationService
 * 
 * Implements the Greedy Max-Heap algorithm to minimize cash flow among friends
 * Algorithm: https://www.geeksforgeeks.org/dsa/minimize-cash-flow-among-given-set-friends-borrowed-money/
 * 
 * Core Idea:
 * 1. Calculate net balance per person (total paid - total owed)
 * 2. Separate into creditors (positive) and debtors (negative)
 * 3. Greedily match largest creditor with largest debtor
 * 4. Record transaction, update balances, re-queue remainders
 * 5. Repeat until all settled
 * 
 * Result: O(N-1) transactions for N people (theoretical minimum)
 * Time: O(N log N), Space: O(N)
 */

import { MaxHeap } from '../utils/maxHeap.js';
import { Expense, ExpenseShare, GroupMember, User, Balance } from '../model/index.js';

export class DebtSimplificationService {
  /**
   * Calculate net balance for each person in a group
   * Net balance = sum(received) - sum(paid)
   * 
   * @param {number} groupId - Group ID
   * @returns {Promise<Map>} - Map of userId -> netBalance
   */
  static async calculateNetBalances(groupId) {
    try {
      const netBalances = new Map();

      // Get all group members
      const members = await GroupMember.findAll({
        where: { groupId },
        attributes: ['userId'],
      });

      // Initialize all members with 0 balance
      for (const member of members) {
        netBalances.set(member.userId, 0);
      }

      // Get all expenses in group with shares
      const expenses = await Expense.findAll({
        where: { groupId },
        include: [{ model: ExpenseShare, as: 'shares' }],
      });

      // For each expense, update net balances
      for (const expense of expenses) {
        const paidBy = expense.paidByUserId;
        const amount = parseFloat(expense.amount);

        // Payer receives (credit) the full amount
        netBalances.set(paidBy, (netBalances.get(paidBy) || 0) + amount);

        // Each participant owes their share
        for (const share of expense.shares) {
          const shareAmount = parseFloat(share.shareAmount);
          netBalances.set(
            share.userId,
            (netBalances.get(share.userId) || 0) - shareAmount
          );
        }
      }

      // Remove zero balances (settled people)
      for (const [userId, balance] of netBalances.entries()) {
        if (Math.abs(balance) < 0.01) { // Account for floating point errors
          netBalances.delete(userId);
        }
      }

      return netBalances;
    } catch (error) {
      console.error('Error calculating net balances:', error);
      throw error;
    }
  }

  /**
   * Get user info (name, email) with their net balance
   * 
   * @param {number} userId - User ID
   * @param {number} netBalance - Calculated net balance
   * @returns {Promise<Object>} - User with balance
   */
  static async getUserWithBalance(userId, netBalance) {
    const user = await User.findByPk(userId, {
      attributes: ['id', 'name', 'email'],
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      balance: netBalance,
    };
  }

  /**
   * Core algorithm: Minimize cash flow using Greedy Max-Heap approach
   * 
   * Algorithm Steps:
   * 1. Separate into Creditors (balance > 0) and Debtors (balance < 0)
   * 2. Build max heaps for both groups (prioritize by absolute amount)
   * 3. While both heaps non-empty:
   *    - Pop max creditor and max debtor
   *    - Transfer min(credit, debt)
   *    - Update remaining balances
   *    - Push back to heap if remainder exists
   * 4. Return minimized transactions list
   * 
   * @param {Map} netBalances - Map of userId -> netBalance
   * @returns {Promise<Array>} - Array of settlement transactions
   */
  static async minimizeCashFlow(netBalances) {
    // Validate zero-sum property (required for valid settlement)
    let totalBalance = 0;
    for (const balance of netBalances.values()) {
      totalBalance += balance;
    }

    if (Math.abs(totalBalance) > 0.01) {
      throw new Error(
        `Invalid net balances: sum must be zero, got ${totalBalance.toFixed(2)}`
      );
    }

    const creditorHeap = new MaxHeap();
    const debtorHeap = new MaxHeap();
    const settlements = [];

    // Separate into creditors and debtors with user info
    for (const [userId, balance] of netBalances.entries()) {
      const user = await this.getUserWithBalance(userId, balance);

      if (balance > 0.01) {
        // Creditor: is owed money
        creditorHeap.push({
          ...user,
          amount: balance,
        });
      } else if (balance < -0.01) {
        // Debtor: owes money (store as positive)
        debtorHeap.push({
          ...user,
          amount: Math.abs(balance),
        });
      }
    }

    // Greedy matching loop
    while (!creditorHeap.isEmpty() && !debtorHeap.isEmpty()) {
      const creditor = creditorHeap.pop();
      const debtor = debtorHeap.pop();

      // Transaction amount = minimum of credit and debt
      const amount = Math.min(creditor.amount, debtor.amount);

      // Record settlement transaction
      settlements.push({
        from: {
          id: debtor.id,
          name: debtor.name,
          email: debtor.email,
        },
        to: {
          id: creditor.id,
          name: creditor.name,
          email: creditor.email,
        },
        amount: parseFloat(amount.toFixed(2)),
      });

      // Update remaining balances
      creditor.amount -= amount;
      debtor.amount -= amount;

      // Push back to heap if balance remains (more than 1 cent rounding)
      if (creditor.amount > 0.01) {
        creditorHeap.push(creditor);
      }

      if (debtor.amount > 0.01) {
        debtorHeap.push(debtor);
      }
    }

    return settlements;
  }

  /**
   * Main orchestrator: Calculate and simplify group debts
   * 
   * @param {number} groupId - Group ID
   * @returns {Promise<Object>} - Simplified debts with metadata
   */
  static async simplifyGroupDebts(groupId) {
    try {
      // Step 1: Calculate net balances
      const netBalances = await this.calculateNetBalances(groupId);

      if (netBalances.size === 0) {
        // No unsettled debts
        return {
          simplifiedDebts: [],
          totalTransactions: 0,
          originalTransactions: 0,
          savings: 0,
          status: 'settled',
        };
      }

      // Step 2: Run minimization algorithm
      const simplifiedDebts = await this.minimizeCashFlow(netBalances);

      // Calculate stats
      const result = {
        simplifiedDebts,
        totalTransactions: simplifiedDebts.length,
        originalTransactions: netBalances.size * 2, // Rough estimate
        savings: ((simplifiedDebts.length / (netBalances.size * 2)) * 100).toFixed(1),
        calculatedAt: new Date().toISOString(),
      };

      return result;
    } catch (error) {
      console.error('Error simplifying group debts:', error);
      throw error;
    }
  }

  /**
   * Alternative: Get existing Balance table records without simplification
   * Used for comparison and validation
   * 
   * @param {number} groupId - Group ID
   * @returns {Promise<Array>} - Current explicit balances
   */
  static async getCurrentBalances(groupId) {
    const balances = await Balance.findAll({
      where: { groupId },
      include: [
        { model: User, as: 'debtor', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'creditor', attributes: ['id', 'name', 'email'] },
      ],
    });

    return balances.map((b) => ({
      from: b.debtor,
      to: b.creditor,
      amount: parseFloat(b.netAmount),
    }));
  }
}

export default DebtSimplificationService;
