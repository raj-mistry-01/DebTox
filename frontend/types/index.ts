export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface Group {
  id: string;
  name: string;
  emoji?: string;
  members: User[];
  netBalance: number; // positive = owed to you, negative = you owe
}

export interface Expense {
  id: string;
  groupId?: string;
  description: string;
  amount: number;
  currency: string;
  paidBy: User;
  splitWith: { user: User; share: number }[];
  date: string; // ISO string
  category?: string;
}

export interface Friend {
  id: string;
  user: User;
  balance: number; // positive = they owe you, negative = you owe them
}

export interface Activity {
  id: string;
  type: 'expense' | 'payment' | 'settlement';
  description: string;
  amount: number;
  date: string;
  groupName?: string;
  involvedUsers: User[];
}

export interface Settlement {
  id: string;
  fromUser: User;
  toUser: User;
  amount: number;
  date: string;
}
