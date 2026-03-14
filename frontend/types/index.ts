export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  phone?: string;
  upiId?: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  currency?: string;
  createdBy?: string;
  createdAt?: string;
  emoji?: string;
  members: User[];
  netBalance?: number; // positive = owed to you, negative = you owe
  expenses?: Expense[]; // from backend response
  userBalances?: Array<{
    fromUser: User;
    toUser: User;
    amount: number;
  }>;
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

export interface FriendRequest {
  id: string;
  sender: User;
  receiver: User;
  status: 'pending' | 'accepted' | 'rejected';
  message?: string;
  createdAt: string;
  respondedAt?: string;
}

export interface Notification {
  id: string;
  type: 'friend_request' | 'friend_accepted' | 'expense_added' | 'payment_received';
  title: string;
  message: string;
  isRead: boolean;
  relatedUser?: User;
  relatedId?: string;
  createdAt: string;
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
