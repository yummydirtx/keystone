import type { ExpenseItem, Category } from '../../../../types'

export interface CreateExpenseSheetProps {
  isOpen: boolean
  onClose: () => void
  categoryId?: number
  categoryData?: Category
  userRole?: string
  onExpenseCreated: () => void
}

export interface ExpenseFormData {
  description: string
  amount: string
  transactionDate: string
  receiptFilePath: string | null
  receiptUrl: string | null
  selectedReceipt: string | null
  items: ExpenseItem[]
  guestName?: string
  guestEmail?: string
}

export interface ItemFormData {
  itemName: string
  itemQuantity: string
  itemPrice: string
}

export interface ItemEditData {
  editingItemIndex: number | null
  editItemName: string
  editItemQuantity: string
  editItemPrice: string
}

export interface ReceiptUploadState {
  uploadingReceipt: boolean
}

export interface ReceiptUploadSectionProps {
  selectedReceipt: string | null
  uploadingReceipt: boolean
  creating: boolean
  onReceiptSelected: (imageUri: string, skipAI?: boolean) => Promise<void>
  onReceiptRemoved: () => void
  isRequired?: boolean
  receiptProcessor: {
    parsingReceipt: boolean
    parsingInfo: string | null
    parsingError: string | null
  }
  skipAI?: boolean
  onSkipAIChange?: (skip: boolean) => void
}

export interface BasicInformationSectionProps {
  amount: string
  description: string
  transactionDate: string
  onAmountChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onTransactionDateChange: (value: string) => void
  resetSignal?: number
}

export interface GuestInformationSectionProps {
  guestName: string
  guestEmail: string
  onGuestNameChange: (value: string) => void
  onGuestEmailChange: (value: string) => void
  resetSignal?: number
}

export interface ItemizedListSectionProps {
  items: ExpenseItem[]
  itemName: string
  itemQuantity: string
  itemPrice: string
  editingItemIndex: number | null
  editItemName: string
  editItemQuantity: string
  editItemPrice: string
  onItemNameChange: (value: string) => void
  onItemQuantityChange: (value: string) => void
  onItemPriceChange: (value: string) => void
  onEditItemNameChange: (value: string) => void
  onEditItemQuantityChange: (value: string) => void
  onEditItemPriceChange: (value: string) => void
  onAddItem: () => void
  onEditItem: (index: number) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onDeleteItem: (index: number) => void
  resetSignal?: number
}

export interface ExpenseFormActionsProps {
  creating: boolean
  uploadingReceipt: boolean
  parsingReceipt: boolean
  onClose: () => void
  onSubmit: () => void
}
