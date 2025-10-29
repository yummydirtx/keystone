import { config } from '@my/config'

export type Conf = typeof config

declare module '@my/ui' {
  interface TamaguiCustomConfig extends Conf {}
}

// API Types
export interface UserProfile {
  id: number
  firebase_uid: string
  email: string
  name: string
  avatar_url: string | null
  createdAt: string
  updatedAt: string
}

export interface Workspace {
  id: number
  name: string
  owner: {
    id: number
    name: string
    email: string
  }
  categoriesCount: number
  expensesCount: number
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: number
  name: string
  budget?: string
  spentAmount?: number
  spentPercentage?: number
  require_receipt?: boolean
  allow_guest_submissions?: boolean
  allow_user_submissions?: boolean
  children?: Category[]
  child_categories?: Category[]
  parentCategory?: {
    id: number
    name: string
  }
  expensesCount?: number
  subcategoriesCount?: number
  _count?: {
    expenses?: number
    child_categories?: number
  }
  report?: {
    id: number
    name: string
    owner?: {
      id: number
      name: string
      email: string
      avatar_url?: string
    }
  }
}

export interface Expense {
  id: number
  description: string
  amount: number
  status: 'PENDING_REVIEW' | 'PENDING_ADMIN' | 'APPROVED' | 'DENIED' | 'REIMBURSED'
  transaction_date: string
  receipt_url?: string
  notes?: string
  items?: {
    receipts?: string[]
    details?: ExpenseItem[]
  }
  guest_name?: string
  guest_email?: string
  createdAt: string
  updatedAt: string
  category?: {
    id: number
    name: string
  }
  submitter?: {
    id: number
    name: string
    email: string
    avatar_url?: string
  } | null
  report?: {
    id: number
    name: string
  }
}

export interface ExpensesResponse {
  message: string
  expenses: Expense[]
  deletedIds?: number[]
  pagination: {
    page: number
    limit: number
    totalExpenses: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export interface Approval {
  id: number
  status_change: 'PENDING_REVIEW' | 'PENDING_ADMIN' | 'APPROVED' | 'DENIED' | 'REIMBURSED'
  notes?: string
  createdAt: string
  user: {
    id: number
    name: string
    email: string
    avatar_url?: string
  }
}

export interface SharedCategory {
  role: string
  category: {
    id: number
    name: string
    parent_category_id?: number | null
    allow_user_submissions?: boolean
    allow_guest_submissions?: boolean
    report: {
      id: number
      name: string
      owner?: {
        id: number
        name: string
        email: string
        avatar_url?: string
      }
    }
  }
}

export interface ExpenseItem {
  name?: string
  description?: string
  quantity: number
  price: number
}

export interface SharedCategoriesResponse {
  message: string
  sharedCategories: SharedCategory[]
  deletedIds?: number[]
}
