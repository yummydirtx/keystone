import { useState, useRef } from 'react'
import { useToastController } from '@my/ui'
import { useCreateExpense, useSubmitGuestExpense } from '../../../../utils/queries.optimized'
import { useAuth } from '../../../../provider/AuthProvider'
import { useReceiptProcessor } from '../../hooks/useReceiptProcessor'
import type { ExpenseItem } from '../../../../types'
import type { ExpenseFormData, ItemFormData, ItemEditData, ReceiptUploadState } from './types'

export function useExpenseForm(categoryId?: number, onExpenseCreated?: () => void) {
  const toast = useToastController()
  const { user, isGuest, guestSession, firebaseApp, authInstance } = useAuth()

  // Core expense data
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0])
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')

  // Receipt upload state
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null)
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null)
  const [uploadingReceipt, setUploadingReceipt] = useState(false)
  const [receiptFilePath, setReceiptFilePath] = useState<string | null>(null)
  const [skipAI, setSkipAI] = useState(false) // false = use AI by default

  // Itemized list state
  const [items, setItems] = useState<ExpenseItem[]>([])
  const [itemName, setItemName] = useState('')
  const [itemQuantity, setItemQuantity] = useState('1')
  const [itemPrice, setItemPrice] = useState('')

  // Edit state for itemized list
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null)
  const [editItemName, setEditItemName] = useState('')
  const [editItemQuantity, setEditItemQuantity] = useState('')
  const [editItemPrice, setEditItemPrice] = useState('')

  // Mutation hooks
  const createExpenseMutation = useCreateExpense()
  const submitGuestExpenseMutation = useSubmitGuestExpense()

  const creating = createExpenseMutation.isPending || submitGuestExpenseMutation.isPending

  // References for tracking receipt processing state
  const pendingReceiptDocIdRef = useRef<string | null>(null)
  const unsubmittedReceiptUriRef = useRef<string | null>(null)

  // AI receipt processing setup
  const receiptProcessor = useReceiptProcessor({
    app: firebaseApp || null!,
    auth: authInstance || null,
    guestToken: isGuest ? guestSession?.token : undefined,
    refs: {
      pendingReceiptDocIdRef,
      unsubmittedReceiptUriRef,
    },
    receiptCallbacks: {
      createPendingReceiptDoc: async (gsUri: string) => {
        const docId = `pending_${Date.now()}`
        pendingReceiptDocIdRef.current = docId
        return docId
      },
      deletePendingReceiptDoc: async (docId: string) => {
        pendingReceiptDocIdRef.current = null
      },
      hookSetUnsubmittedReceiptUri: (uri: string | null) => {
        unsubmittedReceiptUriRef.current = uri
      },
      onDeleteStorageFile: async (gsUri: string) => {
        // You can implement actual storage file deletion here if needed
      },
    },
    formCallbacks: {
      setFormReceiptGsUri: (uri: string) => {
        // No-op: We manage receipt URLs separately
      },
      setFormDescription: (description: string) => setDescription(description || ''),
      setFormAmount: (amount: string) => setAmount(amount || ''),
      setFormTransactionDate: (date: string) => setTransactionDate(date),
      setFormItems: (items: any[]) => {
        const formattedItems = items.map((item) => ({
          name: item.description || '',
          quantity: item.quantity || 1,
          price: item.price || 0,
        }))
        setItems(formattedItems)
      },
    },
  })

  // Item management functions
  const handleAddItem = () => {
    if (!itemName.trim() || !itemPrice.trim()) {
      toast.show('Error', { message: 'Please fill in item name and price.' })
      return
    }

    const price = Number.parseFloat(itemPrice)
    const quantity = Number.parseInt(itemQuantity, 10)
    if (Number.isNaN(price) || price <= 0 || Number.isNaN(quantity) || quantity <= 0) {
      toast.show('Error', { message: 'Please enter a valid quantity and price.' })
      return
    }

    if (price > 999999.99) {
      toast.show('Error', { message: 'Item price cannot exceed $999,999.99.' })
      return
    }

    setItems([...items, { name: itemName, quantity, price }])
    setItemName('')
    setItemQuantity('1')
    setItemPrice('')
  }

  const handleEditItem = (index: number) => {
    const item = items[index]
    setEditingItemIndex(index)
    setEditItemName(item.name || '')
    setEditItemQuantity(item.quantity.toString())
    setEditItemPrice(item.price.toString())
  }

  const handleSaveEdit = () => {
    if (!editItemName.trim() || !editItemPrice.trim()) {
      toast.show('Error', { message: 'Please fill in item name and price.' })
      return
    }

    const price = Number.parseFloat(editItemPrice)
    const quantity = Number.parseInt(editItemQuantity, 10)
    if (Number.isNaN(price) || price <= 0 || Number.isNaN(quantity) || quantity <= 0) {
      toast.show('Error', { message: 'Please enter a valid quantity and price.' })
      return
    }

    if (price > 999999.99) {
      toast.show('Error', { message: 'Item price cannot exceed $999,999.99.' })
      return
    }

    const updatedItems = [...items]
    updatedItems[editingItemIndex!] = {
      name: editItemName,
      quantity,
      price,
    }
    setItems(updatedItems)

    setEditingItemIndex(null)
    setEditItemName('')
    setEditItemQuantity('')
    setEditItemPrice('')
  }

  const handleCancelEdit = () => {
    setEditingItemIndex(null)
    setEditItemName('')
    setEditItemQuantity('')
    setEditItemPrice('')
  }

  const handleDeleteItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index)
    setItems(updatedItems)

    if (editingItemIndex === index) {
      handleCancelEdit()
    }
  }

  // Receipt management functions
  const handleReceiptSelected = async (imageUri: string, skipAIProcessing = false) => {
    if (!user && !(isGuest && guestSession?.token)) {
      toast.show('Error', { message: 'Authentication required to upload receipts.' })
      return
    }

    if (!firebaseApp) {
      toast.show('Error', { message: 'Firebase not initialized. Please try again.' })
      return
    }

    setUploadingReceipt(true)
    try {
      let uploadResult: { filePath: string; downloadURL: string; gsUri: string }

      if (isGuest && guestSession?.token) {
        const { uploadReceiptAsGuest } = await import('../../../../utils/receiptUpload.web')
        uploadResult = await uploadReceiptAsGuest(imageUri, guestSession.token)
      } else if (user?.uid) {
        const { uploadReceipt } = await import('../../../../utils/receiptUpload')
        uploadResult = await uploadReceipt(imageUri, user.uid)
      } else {
        throw new Error('No valid authentication found')
      }

      setReceiptFilePath(uploadResult.filePath)
      setReceiptUrl(uploadResult.downloadURL)
      setSelectedReceipt(uploadResult.downloadURL)

      if (uploadResult.gsUri && !skipAIProcessing) {
        try {
          await receiptProcessor.handleReceiptUploadAndParse(uploadResult.gsUri, 'image/jpeg')
          toast.show('Success', {
            message: 'Receipt uploaded successfully! Keystone AI is analyzing the receipt...',
          })
        } catch (aiError) {
          console.warn('[useExpenseForm] AI parsing failed:', aiError)
          toast.show('Info', {
            message:
              'Receipt uploaded successfully, but automatic processing failed. Please fill in details manually.',
          })
        }
      } else {
        toast.show('Success', {
          message: skipAIProcessing 
            ? 'Receipt uploaded successfully! Please fill in the expense details manually.' 
            : 'Receipt uploaded successfully!',
        })
      }
    } catch (error) {
      console.error('[useExpenseForm] Failed to upload receipt:', error)
      toast.show('Error', {
        message: 'Failed to upload receipt. Please try again.',
      })
    } finally {
      setUploadingReceipt(false)
    }
  }

  const handleReceiptRemoved = () => {
    setSelectedReceipt(null)
    setReceiptUrl(null)
    setReceiptFilePath(null)
  }

  // Form validation
  const validateGuestFields = () => {
    if (isGuest) {
      // Validate guest email if provided
      if (guestEmail && guestEmail.trim() !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(guestEmail)) {
          toast.show('Error', { message: 'Please enter a valid email address.' })
          return false
        }
      }

      // Validate guest name if provided
      if (guestName && guestName.trim() !== '' && guestName.trim().length < 2) {
        toast.show('Error', { message: 'Guest name must be at least 2 characters long.' })
        return false
      }
    }
    return true
  }

  // Form submission
  const handleCreateExpense = async (isReceiptRequired = false) => {
    if (!description.trim()) {
      toast.show('Error', { message: 'Please enter a description.' })
      return
    }

    if (!amount.trim()) {
      toast.show('Error', { message: 'Please enter an amount.' })
      return
    }

    const expenseAmount = Number.parseFloat(amount)
    if (Number.isNaN(expenseAmount) || expenseAmount <= 0) {
      toast.show('Error', { message: 'Please enter a valid amount.' })
      return
    }

    if (expenseAmount > 999999.99) {
      toast.show('Error', { message: 'Amount cannot exceed $999,999.99.' })
      return
    }

    if (!categoryId) {
      toast.show('Error', { message: 'Please select a category for this expense.' })
      return
    }

    if (isGuest && !guestSession?.token) {
      toast.show('Error', { message: 'Guest session expired. Please refresh the page.' })
      return
    }

    // Check receipt requirement
    if (isReceiptRequired && (!receiptFilePath || receiptFilePath.trim() === '')) {
      toast.show('Receipt Required', {
        message: 'This category requires a receipt to be uploaded before submitting.',
      })
      return
    }

    // Validate guest fields if needed
    if (!validateGuestFields()) {
      return
    }

    try {
      const expenseData = {
        description: description.trim(),
        amount: Number.parseFloat(amount),
        transactionDate: new Date(transactionDate).toISOString(),
        receiptUrl: receiptFilePath || undefined,
        items: { details: items },
      }

      if (isGuest && guestSession) {
        const guestExpenseData = {
          description: expenseData.description,
          amount: expenseData.amount,
          transaction_date: expenseData.transactionDate,
          receipt_url: expenseData.receiptUrl,
          items: expenseData.items,
          category_id: categoryId, // Include the category ID for guest submissions
          guest_name: guestName.trim() || undefined,
          guest_email: guestEmail.trim() || undefined,
        }
        await submitGuestExpenseMutation.mutateAsync({
          token: guestSession.token,
          data: guestExpenseData,
        })
      } else {
        await createExpenseMutation.mutateAsync({
          ...expenseData,
          categoryId: categoryId,
        })
      }

      toast.show('Success', { message: 'Expense submitted successfully.' })
      onExpenseCreated?.()
      return true
    } catch (err) {
      console.error('Failed to create expense:', err)
      toast.show('Error', { message: 'Failed to submit expense.' })
      return false
    }
  }

  // Reset form
  const resetForm = () => {
    setDescription('')
    setAmount('')
    setTransactionDate(new Date().toISOString().split('T')[0])
    setGuestName('')
    setGuestEmail('')
    setSelectedReceipt(null)
    setReceiptUrl(null)
    setReceiptFilePath(null)
    setUploadingReceipt(false)
    setSkipAI(false)
    setItems([])
    setItemName('')
    setItemQuantity('1')
    setItemPrice('')
    setEditingItemIndex(null)
    setEditItemName('')
    setEditItemQuantity('')
    setEditItemPrice('')
    receiptProcessor.resetParsingState()
  }

  return {
    // State
    formData: {
      description,
      amount,
      transactionDate,
      receiptFilePath,
      receiptUrl,
      selectedReceipt,
      items,
      guestName,
      guestEmail,
    },
    itemFormData: {
      itemName,
      itemQuantity,
      itemPrice,
    },
    itemEditData: {
      editingItemIndex,
      editItemName,
      editItemQuantity,
      editItemPrice,
    },
    uploadState: {
      uploadingReceipt,
    },
    creating,
    skipAI,
    receiptProcessor: {
      parsingReceipt: receiptProcessor.parsingReceipt,
      parsingInfo: receiptProcessor.parsingInfo,
      parsingError: receiptProcessor.parsingError,
    },

    // Actions
    setDescription,
    setAmount,
    setTransactionDate,
    setGuestName,
    setGuestEmail,
    setItemName,
    setItemQuantity,
    setItemPrice,
    setEditItemName,
    setEditItemQuantity,
    setEditItemPrice,
    setSkipAI,

    // Item management
    handleAddItem,
    handleEditItem,
    handleSaveEdit,
    handleCancelEdit,
    handleDeleteItem,

    // Receipt management
    handleReceiptSelected,
    handleReceiptRemoved,

    // Form management
    handleCreateExpense,
    resetForm,
  }
}
