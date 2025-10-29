import type { Expense } from '../../../../types'

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'APPROVED':
      return '$green10'
    case 'PENDING_REVIEW':
    case 'PENDING_ADMIN':
      return '$yellow10'
    case 'DENIED':
      return '$red10'
    case 'REIMBURSED':
      return '$blue10'
    default:
      return '$color11'
  }
}

export const formatStatus = (status: string) => {
  switch (status) {
    case 'PENDING_REVIEW':
      return 'Pending Review'
    case 'PENDING_ADMIN':
      return 'Pending Admin'
    case 'APPROVED':
      return 'Approved'
    case 'DENIED':
      return 'Denied'
    case 'REIMBURSED':
      return 'Reimbursed'
    default:
      return status
  }
}

export const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export const calculateTotal = (expenseList: Expense[]) => {
  return expenseList.reduce((total, expense) => total + expense.amount, 0)
}
