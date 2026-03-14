  # 💸 Splitwise Debt Settlement Algorithm (JavaScript)

  > Minimize group expenses using a Greedy Max-Heap algorithm — implemented in clean, modular JavaScript with full visualization.

  ---

  ## 📋 Table of Contents

  1. [Problem Statement](#1-problem-statement)
  2. [Algorithm Explanation](#2-algorithm-explanation)
  3. [Graph Theory Representation](#3-graph-theory-representation)
  4. [Example Dataset](#4-example-dataset)
  5. [Graph Visualizations](#5-graph-visualizations)
  6. [JavaScript Implementation](#6-javascript-implementation)
  7. [Step-by-Step Execution](#7-step-by-step-execution)
  8. [Complexity Analysis](#8-complexity-analysis)
  9. [Real-World Usage in Splitwise](#9-real-world-usage-in-splitwise)
  10. [How to Run](#10-how-to-run)

  ---

  ## 1. Problem Statement

  When a group of friends splits expenses (trips, dinners, shared bills), each person pays for different things at different times. After everything is settled, some people are owed money (creditors) and others owe money (debtors).

  **The challenge:** Settle all debts using the **minimum number of transactions** possible.

  **Example problem:**
  - Alice paid $500 for 4 people
  - Frank paid $700 for everyone
  - Grace paid $120 for Charlie

  After 18 such transactions across 10 people, naively everyone pays everyone back = potentially 90 transactions. The algorithm reduces this to **9 transactions** — the theoretical minimum.

  ---

  ## 2. Algorithm Explanation

  ### Concept: Net Balance Reduction

  Instead of tracking individual who-paid-whom chains, we collapse everything into a single **net balance per person**:

  ```
  Net Balance = (Total paid by person) − (Total share owed by person)
  ```

  - **Positive balance** → Creditor (should receive money)
  - **Negative balance** → Debtor (should pay money)
  - **Zero balance** → Already settled

  ### The Greedy Strategy

  Once we have net balances, we use a **greedy matching** strategy:

  > Always match the **largest creditor** with the **largest debtor**.  
  > Transfer `min(credit, debt)`.  
  > Push any remainder back and repeat.

  This is optimal because every match either fully resolves at least one person's balance, ensuring no wasted transactions.

  ### Why Max-Heaps?

  We need to efficiently find the person who is owed the most (max creditor) and the person who owes the most (max debtor) at each step. A **Max-Heap** gives us both insertions and max-extractions in **O(log N)** time.

  ### Algorithm Steps

  ```
  1. Compute net balance for every person
  2. Push all creditors (balance > 0) into a Max-Heap
  3. Push all debtors  (balance < 0) into a Max-Heap (stored as positive)
  4. While both heaps are non-empty:
      a. Pop max creditor C and max debtor D
      b. amount = min(C.balance, D.balance)
      c. Record: D pays `amount` to C
      d. If C has remaining balance → push back to creditor heap
      e. If D has remaining balance → push back to debtor heap
  5. All balances are now zero — done!
  ```

  ---

  ## 3. Graph Theory Representation

  The problem can be modeled as a **directed weighted graph**:

  - **Nodes** = People
  - **Edges** = Payment obligations
  - **Edge weight** = Amount owed

  ### Before Settlement
  A dense graph with potentially `O(N²)` edges, representing every individual debt relationship.

  ### After Settlement
  A sparse graph with at most `N−1` edges (like a spanning tree), representing the minimum set of transactions.

  The algorithm essentially transforms a dense debt graph into a minimal-edge equivalent — analogous to finding a **minimum spanning structure** in graph theory.

  ---

  ## 4. Example Dataset

  ### People (10)
  `Alice, Bob, Charlie, David, Emma, Frank, Grace, Henry, Ivy, Jack`

  ### Transactions (18)

  | # | Payer   | Amount | Split Among                          |
  |---|---------|--------|--------------------------------------|
  | 1 | Alice   | $500   | Alice, Bob, Charlie, David           |
  | 2 | Emma    | $300   | Alice, Emma, Grace                   |
  | 3 | Frank   | $700   | Everyone (all 10)                    |
  | 4 | Henry   | $400   | Henry, Ivy, Jack, Bob                |
  | 5 | Charlie | $250   | Charlie, David, Emma                 |
  | 6 | Bob     | $180   | Bob, Grace, Ivy                      |
  | 7 | David   | $600   | David, Alice, Frank, Jack            |
  | 8 | Grace   | $120   | Grace, Charlie                       |
  | 9 | Ivy     | $350   | Ivy, Emma, Henry, Bob                |
  |10 | Jack    | $280   | Jack, Alice, Charlie                 |
  |11 | Alice   | $450   | Alice, Emma, Frank, Grace            |
  |12 | Frank   | $320   | Frank, Henry, Ivy, David             |
  |13 | Bob     | $200   | Bob, Charlie, Jack                   |
  |14 | Emma    | $150   | Emma, Grace, Alice                   |
  |15 | Henry   | $500   | Henry, Frank, David, Charlie, Bob    |
  |16 | Ivy     | $270   | Ivy, Jack, Grace                     |
  |17 | Charlie | $380   | Charlie, Alice, Bob, Emma            |
  |18 | David   | $220   | David, Ivy, Henry                    |

  ### Computed Net Balances

  | Person  | Net Balance | Role      |
  |---------|-------------|-----------|
  | Frank   | +$507.50    | Creditor  |
  | Henry   | +$389.17    | Creditor  |
  | Alice   | +$154.17    | Creditor  |
  | David   | +$138.33    | Creditor  |
  | Ivy     | +$59.17     | Creditor  |
  | Charlie | −$63.33     | Debtor    |
  | Emma    | −$148.33    | Debtor    |
  | Jack    | −$290.00    | Debtor    |
  | Bob     | −$324.17    | Debtor    |
  | Grace   | −$422.50    | Debtor    |

  ---

  ## 5. Graph Visualizations

  ### Graph 1 — Original Transactions (Sample of flows)

  ```mermaid
  graph LR
    Bob -->|$125| Alice
    Charlie -->|$125| Alice
    David -->|$125| Alice
    Alice -->|$100| Emma
    Grace -->|$100| Emma
    Alice -->|$70| Frank
    Bob -->|$70| Frank
    Charlie -->|$70| Frank
    David -->|$70| Frank
    Emma -->|$70| Frank
    Grace -->|$70| Frank
    Henry -->|$70| Frank
    Ivy -->|$70| Frank
    Jack -->|$70| Frank
    Ivy -->|$100| Henry
    Jack -->|$100| Henry
    Bob -->|$100| Henry
    David -->|$83| Charlie
    Emma -->|$83| Charlie
  ```

  > **28+ directed edges** — complex and hard to settle manually.

  ---

  ### Graph 2 — Net Balances

  ```mermaid
  graph TD
    subgraph Creditors
      Alice["Alice +$154"]
      David["David +$138"]
      Frank["Frank +$508"]
      Henry["Henry +$389"]
      Ivy["Ivy +$59"]
    end
    subgraph Debtors
      Bob["Bob -$324"]
      Charlie["Charlie -$63"]
      Emma["Emma -$148"]
      Grace["Grace -$423"]
      Jack["Jack -$290"]
    end
  ```

  ---

  ### Graph 3 — Final Settlements (Minimized)

  ```mermaid
  graph LR
    Grace -->|$422.50| Frank
    Bob -->|$324.17| Henry
    Jack -->|$154.17| Alice
    Emma -->|$138.33| David
    Jack -->|$85.00| Frank
    Charlie -->|$63.33| Henry
    Jack -->|$50.83| Ivy
    Emma -->|$8.34| Ivy
    Emma -->|$1.66| Henry
  ```

  > Only **9 transactions** — reduced from 18 original payments across 10 people.

  ---

  ## 6. JavaScript Implementation

  ### File Structure

  ```
  splitwise.js
  ├── MaxHeap class          — Priority queue for greedy matching
  ├── PEOPLE                 — Array of participant names
  ├── TRANSACTIONS           — Raw expense records
  ├── computeNetBalances()   — Step 1: Calculate who owes what
  ├── settleDebts()          — Step 2: Greedy heap-based settlement
  ├── printTransactions()    — Display raw transactions
  ├── printNetBalances()     — Display computed balances
  ├── printStepByStep()      — Display algorithm trace
  ├── printSettlements()     — Display final minimized transactions
  ├── printMermaidDiagrams() — Generate Mermaid graph strings
  └── main()                 — Entry point
  ```

  ### MaxHeap Class (Core Data Structure)

  ```javascript
  class MaxHeap {
    push(item)   // Insert { amount, name }  → O(log N)
    pop()        // Remove & return max      → O(log N)
    peek()       // View max without removal → O(1)
    isEmpty()    // Check if empty           → O(1)
  }
  ```

  ### Key Function: settleDebts()

  ```javascript
  function settleDebts(balanceMap) {
    // Build two heaps
    const creditorHeap = new MaxHeap();
    const debtorHeap = new MaxHeap();

    // Main greedy loop
    while (!creditorHeap.isEmpty() && !debtorHeap.isEmpty()) {
      const creditor = creditorHeap.pop();  // largest owed
      const debtor = debtorHeap.pop();      // largest owing
      const amount = Math.min(creditor.amount, debtor.amount);

      // Record this settlement
      // Push remainders back to heaps
    }
  }
  ```

  ---

  ## 7. Step-by-Step Execution

  ```
  Step 1
    Max Creditor : Frank  (+$507.50)
    Max Debtor   : Grace  (-$422.50)
    → Grace pays $422.50 to Frank
    Remaining: Frank still to receive +$85.00

  Step 2
    Max Creditor : Henry  (+$389.17)
    Max Debtor   : Bob    (-$324.17)
    → Bob pays $324.17 to Henry
    Remaining: Henry still to receive +$65.00

  Step 3
    Max Creditor : Alice  (+$154.17)
    Max Debtor   : Jack   (-$290.00)
    → Jack pays $154.17 to Alice
    Remaining: Jack still owes -$135.83

  Step 4
    Max Creditor : David  (+$138.33)
    Max Debtor   : Emma   (-$148.33)
    → Emma pays $138.33 to David
    Remaining: Emma still owes -$10.00

  Step 5
    Max Creditor : Frank  (+$85.00)
    Max Debtor   : Jack   (-$135.83)
    → Jack pays $85.00 to Frank
    Remaining: Jack still owes -$50.83

  Step 6
    Max Creditor : Henry  (+$65.00)
    Max Debtor   : Charlie (-$63.33)
    → Charlie pays $63.33 to Henry
    Remaining: Henry still to receive +$1.67

  Step 7
    Max Creditor : Ivy    (+$59.17)
    Max Debtor   : Jack   (-$50.83)
    → Jack pays $50.83 to Ivy
    Remaining: Ivy still to receive +$8.34

  Step 8
    Max Creditor : Ivy    (+$8.34)
    Max Debtor   : Emma   (-$10.00)
    → Emma pays $8.34 to Ivy
    Remaining: Emma still owes -$1.66

  Step 9
    Max Creditor : Henry  (+$1.67)
    Max Debtor   : Emma   (-$1.66)
    → Emma pays $1.66 to Henry
    ✓ All balances settled!
  ```

  ---

  ## 8. Complexity Analysis

  ### Time Complexity: **O(N log N)**

  | Operation                  | Cost      |
  |----------------------------|-----------|
  | Build heaps (N insertions) | O(N log N)|
  | Each heap pop + push       | O(log N)  |
  | Total iterations           | At most N |
  | **Total**                  | **O(N log N)** |

  Where `N` = number of people with non-zero balance.

  ### Space Complexity: **O(N)**

  - Two heaps holding at most N elements total
  - Settlement list: O(N) entries

  ### Why This Minimizes Transactions

  **Theorem:** The minimum number of transactions needed is `N − 1` where `N` is the number of people with non-zero balance (at most).

  **Proof sketch:** Each transaction fully settles at least one person's balance (sets it to zero). With N non-zero balances, you need at most N−1 transactions. The greedy approach achieves this because:

  1. Every `pop()` produces one transaction
  2. At least one person (creditor or debtor) is fully settled per transaction
  3. The matched person is removed from the heap permanently

  This is analogous to the **minimum spanning tree** argument — connecting N nodes requires exactly N−1 edges.

  ---

  ## 9. Real-World Usage in Splitwise

  Splitwise (the app) uses a variant of this algorithm called **"Simplify Debts"**:

  1. **Group expenses** are recorded as raw transactions (like our dataset)
  2. Net balances are computed per person
  3. The settlement algorithm runs to minimize payments
  4. Users see only the simplified, minimal payment list

  **Additional real-world considerations:**
  - **Currency rounding** — handled with `Math.round(...* 100) / 100`
  - **Partial settlements** — users can mark payments as partial
  - **Multi-currency groups** — requires exchange rate normalization before running the algorithm
  - **Payment methods** — Splitwise integrates with Venmo/PayPal for one-click settlement

  The core algorithm remains the same greedy heap approach — elegant in its simplicity and optimal in its result.

  ---

  ## 10. How to Run

  ### Prerequisites
  - Node.js v14 or higher

  ### Steps

  ```bash
  # Clone or download the project
  git clone <your-repo>
  cd splitwise-settlement

  # No dependencies needed — pure Node.js!
  node splitwise.js
  ```

  ### Expected Output

  ```
  ╔══════════════════════════════════════════════════╗
  ║   Splitwise Debt Settlement — JS Implementation  ║
  ╚══════════════════════════════════════════════════╝

  === Original Transactions ===
    Alice paid $500 for [Alice, Bob, Charlie, David]
    ...

  === Net Balances ===
    Frank      +507.50  (creditor)
    Henry      +389.17  (creditor)
    ...

  === Step-by-Step Algorithm Execution ===
    Step 1: Grace pays $422.50 to Frank
    ...

  === Final Settlement Transactions ===
    1. Grace   → pays $422.50 → Frank
    2. Bob     → pays $324.17 → Henry
    ...
    Total transactions needed: 9 (minimized)
  ```

  ### Customize the Dataset

  Edit `PEOPLE` and `TRANSACTIONS` in `splitwise.js`:

  ```javascript
  const PEOPLE = ["Alice", "Bob", ...];
  const TRANSACTIONS = [
    { payer: "Alice", amount: 500, participants: ["Alice", "Bob", "Charlie"] },
    // add more...
  ];
  ```

  Run again — the algorithm handles any input automatically.

  ---

  ## License

  MIT — free to use, modify, and share.

  ---

  *Built as a hackathon demo showcasing graph algorithms, greedy strategies, and heap data structures in JavaScript.*
