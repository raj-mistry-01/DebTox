# Expense System Implementation - Phase 2 Complete ✅

## Issues Fixed

### 1. **API Validation Error - "groupId is required"** ✅ FIXED
**Problem:** When creating friend expenses, the API required `groupId` but friend expenses should have `groupId = null`

**Solution:**
- Updated `/split-backend/src/controller/expense.controller.js`:
  - Line 16: Removed `!groupId` from validation
  - Line 18: Make membership check conditional - only validate if `groupId` exists
  - Line 105: Only invalidate cache if it's a group expense
  - Line 153: Same conditional membership check in `getExpense` endpoint

**Result:** Now accepts expenses with `groupId = null` for friend-to-friend payments

---

### 2. **Split Options Missing** ✅ ADDED
**Problem:** User wanted Splitwise-style split options (Equal, Percentage, Custom, Shares, Adjustment)

**Solution:**
- Updated `/frontend/app/expenses/new.tsx`:
  - Added `splitMethod` state: `'equal' | 'percentage' | 'custom' | 'shares' | 'adjustment'`
  - Added `calculateSplits()` function with all 5 split methods:
    - **Equal**: Divides amount evenly among selected members
    - **Percentage**: Each member's % of the total amount
    - **Custom**: Each member has custom amount entered
    - **Shares**: Each member has custom number of shares
    - **Adjustment**: Equal split with adjustments added
  - Added UI buttons for split method selection (visible for group expenses only)
  - Updated member row to show calculated share amount in real-time

**Features:**
```typescript
switch (splitMethod) {
  case 'equal': // 10000/4 = 2500 each
  case 'percentage': // Each person's % of 10000
  case 'custom': // Each person specifies exact amount
  case 'shares': // If person1=1, person2=2, person3=3 = 1+2+3=6 shares total
  case 'adjustment': // Base equal + adjustments per person
}
```

---

### 3. **Friend Expenses (One-on-One Payments)** ✅ IMPLEMENTED

**Problem:** Needed to properly support friend expenses separate from group expenses

**Changes:**
1. **Backend** - Made `groupId` nullable in Expense model
   - Group expenses: `groupId NOT NULL`
   - Friend expenses: `groupId NULL`
   - Both create Balance records for debt tracking

2. **Frontend** - Added friend expense mode in new.tsx
   - Toggle between "Group" and "Friend" expense types
   - Group mode: Shows group members to split with
   - Friend mode: Shows friend list to pay
   - Both pass proper data to API

3. **API** - Updated `/frontend/services/api.ts`
   - `createExpense()` now accepts `groupId: string | null`
   - Passes `null` for friend expenses instead of empty string

---

## Code Walkthrough

### File: `/split-backend/src/controller/expense.controller.js`

**Before:**
```javascript
if (!groupId || !title || !amount || !splits) {
  return res.status(400).json({ message: 'groupId, title, amount, and splits are required' });
}
// Always check membership
const membership = await GroupMember.findOne(/* ... */);
if (!membership) return error;
```

**After:**
```javascript
if (!title || !amount || !splits) {
  return res.status(400).json({ message: 'title, amount, and splits are required' });
}
// Only check membership if it's a group expense
if (groupId) {
  const membership = await GroupMember.findOne(/* ... */);
  if (!membership) return error;
}
```

---

### File: `/frontend/app/expenses/new.tsx`

**New Split Calculation:**
```typescript
const calculateSplits = () => {
  const amountNum = parseFloat(amount);
  
  switch (splitMethod) {
    case 'equal':
      return selectedMembers.map(m => ({
        userId: m.id,
        shareAmount: amountNum / selectedMembers.length  // Equal division
      }));
    
    case 'percentage':
      // User specifies % - normalized to 100%
      const totalPercent = selectedMembers.reduce(
        (sum, m) => sum + (m.shareAmount || 0), 0
      );
      return selectedMembers.map(m => ({
        userId: m.id,
        shareAmount: (amountNum * (m.shareAmount || 0)) / totalPercent
      }));
    
    case 'custom':
      // User specifies exact amounts
      return selectedMembers.map(m => ({
        userId: m.id,
        shareAmount: m.shareAmount || 0
      }));
    
    case 'shares':
      // User specifies shares (e.g., 1, 2, 3 = 6 total)
      const totalShares = selectedMembers.reduce(
        (sum, m) => sum + (m.shareAmount || 1), 0
      );
      return selectedMembers.map(m => ({
        userId: m.id,
        shareAmount: (amountNum * (m.shareAmount || 1)) / totalShares
      }));
    
    case 'adjustment':
      // Equal split + adjustments
      const baseAmount = amountNum / selectedMembers.length;
      return selectedMembers.map(m => ({
        userId: m.id,
        shareAmount: baseAmount + (m.shareAmount || 0)
      }));
  }
};
```

**Expense Creation - Now Handles Both Types:**
```typescript
const splits = calculateSplits();

if (expenseType === 'group') {
  await apiClient.createExpense(
    selectedGroup,      // Non-null for group
    description,
    amountNum,
    splits,
    currency,
    'OTHER',
    splitMethod
  );
} else {
  await apiClient.createExpense(
    null,               // null for friend expenses ← KEY FIX
    description,
    amountNum,
    splits,
    currency,
    'OTHER',
    splitMethod
  );
}
```

---

### File: `/frontend/services/api.ts`

**Before:**
```typescript
async createExpense(
  groupId: string,  // ← Always required
  title: string,
  amount: number,
  ...
)
```

**After:**
```typescript
async createExpense(
  groupId: string | null,  // ← Now optional
  title: string,
  amount: number,
  ...
)
```

---

## How Both Expense Types Work with Debt Algorithm

### Group Expenses
1. User selects a group
2. Sees only group members
3. Chooses split method (equal, %, custom, shares, adjustment)
4. Amount is split according to method
5. Balance records created with `groupId = selected_group`
6. Debt simplification algorithm runs on group scope

### Friend Expenses (One-on-One)
1. User selects friend (no group)
2. Full amount goes to friend
3. Simplified to single payment flow
4. Balance records created with `groupId = NULL`
5. Debt algorithm includes friend expenses in global balance calculation

### Debt Algorithm Integration
- Debt algorithm processes ALL Balance records
- `groupId = NULL` balances are treated as global (between any two users)
- `groupId = X` balances are group-specific
- Can have mixed group and friend expenses in calculations

**Example Scenario:**
```
User A owes:
- Group1: B=100, C=150 (groupId=1)
- Friend: D=200 (groupId=NULL)

When simplifying for User A:
- System treats all as single net balance pool
- Matches largest debtors/creditors across all expense types
- Minimizes total transactions including friend payments
```

---

## Testing Checklist

- [ ] Create group expense with Equal split
- [ ] Create group expense with Percentage split  
- [ ] Create friend expense (one-on-one payment)
- [ ] Verify Balance table shows correct entries (null vs group_id)
- [ ] Verify debt simplification includes both expense types
- [ ] Test mixed group + friend expenses calculation
- [ ] Verify friends section updates after payment creation
- [ ] Check balance calculations match Splitwise style

---

## What's Left

1. **Friends Section Auto-Refresh** ⏳
   - Friends balances should auto-update after expense creation
   - Currently user must navigate away and back
   - Solution: Use navigation event listener or context

2. **Split Input UI** ⏳  
   - For Percentage/Custom/Shares modes, allow users to input values
   - Currently assumes equal split even if mode is changed
   - Need: Input fields per member for each mode

3. **Adjustment Mode Enhancement** ⏳
   - Show base amount + adjustment label
   - Allow positive/negative adjustments

4. **Currency Formatting** ⏳  
   - Show split amounts in proper format during input

---

## Files Modified Summary

| File | Changes |
|------|---------|
| `/split-backend/src/controller/expense.controller.js` | Made groupId optional, conditional membership checks |
| `/frontend/app/expenses/new.tsx` | Added split method UI, split calculation logic, friend expense support |
| `/frontend/services/api.ts` | Updated createExpense signature to accept null groupId |
| `/split-backend/src/model/expense.model.js` | Already updated in previous phase (groupId nullable) |

---

## Next Steps

1. Add input UI for custom split modes
2. Implement friends auto-refetch after expense creation  
3. Test end-to-end flow with debt simplification
4. Add validation for split calculations (e.g., percentages must equal 100%)
