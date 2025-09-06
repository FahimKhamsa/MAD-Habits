// Habit Types
export interface Habit {
  id: string;
  userId?: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  frequency: "daily" | "weekly" | "monthly";
  daysOfWeek?: number[]; // 0 = Sunday, 1 = Monday, etc.
  streak: number;
  bestStreak: number;
  completedDates: string[]; // ISO date strings
  alternativeCompletionDates?: string[]; // Added for weekly habits to allow alternative completion dates
  createdAt: string;
  updatedAt: string;
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  userId?: string;
  date: string; // ISO date string
  completed: boolean;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Budget Types
export interface BudgetCategory {
  id: string;
  userId?: string;
  name: string;
  icon?: string;
  color?: string;
  limit: number;
  spent: number;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  userId?: string;
  categoryId: string;
  amount: number;
  description: string;
  date: string; // ISO date string
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

// Expense Splitting Types
export interface Group {
  id: string;
  name: string;
  creatorId?: string;
  members: GroupMember[];
  createdAt: string;
  updatedAt: string;
}

export interface GroupMember {
  id: string;
  name: string;
  email?: string;
  isCurrentUser: boolean;
}

export interface SharedExpense {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  paidById: string;
  date: string; // ISO date string
  splits: ExpenseSplit[];
  settled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseSplit {
  memberId: string;
  amount: number;
  settled: boolean;
}

// App Settings
export interface AppSettings {
  theme: "light" | "dark";
  currency: string;
  notifications: boolean;
}
