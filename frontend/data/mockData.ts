import { Activity, Expense, Friend, Group, User } from '@/types';

export const MOCK_USERS: User[] = [
  { id: 'user-1', name: 'Alex Johnson', email: 'alex@example.com' },
  { id: 'user-2', name: 'Jamie Smith', email: 'jamie@example.com' },
  { id: 'user-3', name: 'Taylor Brown', email: 'taylor@example.com' },
  { id: 'user-4', name: 'Morgan Lee', email: 'morgan@example.com' },
];

export const MOCK_GROUPS: Group[] = [
  {
    id: 'group-1',
    name: 'Barcelona Trip 🏖️',
    emoji: '🏖️',
    members: [MOCK_USERS[0], MOCK_USERS[1], MOCK_USERS[2]],
    netBalance: 42.5,
  },
  {
    id: 'group-2',
    name: 'Apartment 4B',
    emoji: '🏠',
    members: [MOCK_USERS[0], MOCK_USERS[3]],
    netBalance: -120.0,
  },
  {
    id: 'group-3',
    name: 'Ski Trip ⛷️',
    emoji: '⛷️',
    members: [MOCK_USERS[0], MOCK_USERS[1], MOCK_USERS[2], MOCK_USERS[3]],
    netBalance: 0,
  },
  {
    id: 'group-4',
    name: 'Office Lunch',
    emoji: '🍱',
    members: [MOCK_USERS[0], MOCK_USERS[1]],
    netBalance: 15.75,
  },
];

export const MOCK_FRIENDS: Friend[] = [
  { id: 'friend-1', user: MOCK_USERS[1], balance: 42.5 },
  { id: 'friend-2', user: MOCK_USERS[2], balance: -30.0 },
  { id: 'friend-3', user: MOCK_USERS[3], balance: -120.0 },
];

export const MOCK_EXPENSES: Expense[] = [
  {
    id: 'expense-1',
    groupId: 'group-1',
    description: 'Dinner at La Boqueria',
    amount: 128.0,
    currency: 'USD',
    paidBy: MOCK_USERS[0],
    splitWith: [
      { user: MOCK_USERS[1], share: 42.67 },
      { user: MOCK_USERS[2], share: 42.67 },
    ],
    date: '2026-03-10T19:00:00Z',
    category: 'Food & Drink',
  },
  {
    id: 'expense-2',
    groupId: 'group-1',
    description: 'Hotel — 3 nights',
    amount: 480.0,
    currency: 'USD',
    paidBy: MOCK_USERS[1],
    splitWith: [
      { user: MOCK_USERS[0], share: 160.0 },
      { user: MOCK_USERS[2], share: 160.0 },
    ],
    date: '2026-03-08T12:00:00Z',
    category: 'Travel',
  },
  {
    id: 'expense-3',
    groupId: 'group-2',
    description: 'Electricity bill',
    amount: 90.0,
    currency: 'USD',
    paidBy: MOCK_USERS[3],
    splitWith: [{ user: MOCK_USERS[0], share: 45.0 }],
    date: '2026-03-01T09:00:00Z',
    category: 'Utilities',
  },
  {
    id: 'expense-4',
    groupId: 'group-4',
    description: 'Sushi lunch',
    amount: 62.0,
    currency: 'USD',
    paidBy: MOCK_USERS[0],
    splitWith: [{ user: MOCK_USERS[1], share: 31.0 }],
    date: '2026-03-12T13:00:00Z',
    category: 'Food & Drink',
  },
];

export const MOCK_ACTIVITIES: Activity[] = [
  {
    id: 'act-1',
    type: 'expense',
    description: 'Alex added "Dinner at La Boqueria"',
    amount: 128.0,
    date: '2026-03-10T19:00:00Z',
    groupName: 'Barcelona Trip 🏖️',
    involvedUsers: [MOCK_USERS[0], MOCK_USERS[1], MOCK_USERS[2]],
  },
  {
    id: 'act-2',
    type: 'expense',
    description: 'Jamie added "Hotel — 3 nights"',
    amount: 480.0,
    date: '2026-03-08T12:00:00Z',
    groupName: 'Barcelona Trip 🏖️',
    involvedUsers: [MOCK_USERS[0], MOCK_USERS[1], MOCK_USERS[2]],
  },
  {
    id: 'act-3',
    type: 'payment',
    description: 'Alex paid Taylor $30.00',
    amount: 30.0,
    date: '2026-03-05T10:00:00Z',
    involvedUsers: [MOCK_USERS[0], MOCK_USERS[2]],
  },
  {
    id: 'act-4',
    type: 'expense',
    description: 'Morgan added "Electricity bill"',
    amount: 90.0,
    date: '2026-03-01T09:00:00Z',
    groupName: 'Apartment 4B',
    involvedUsers: [MOCK_USERS[0], MOCK_USERS[3]],
  },
  {
    id: 'act-5',
    type: 'expense',
    description: 'Alex added "Sushi lunch"',
    amount: 62.0,
    date: '2026-03-12T13:00:00Z',
    groupName: 'Office Lunch',
    involvedUsers: [MOCK_USERS[0], MOCK_USERS[1]],
  },
];
