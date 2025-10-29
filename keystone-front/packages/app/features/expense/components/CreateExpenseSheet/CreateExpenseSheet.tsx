import {
  Sheet,
  Form,
  H2,
  YStack,
  Separator,
  XStack,
  Paragraph,
  Button,
  Card,
  Text,
} from '@my/ui'
import { Receipt, AlertCircle, X, Building2, Folder } from '@tamagui/lucide-icons'
import { useEffect, useState } from 'react'
import { Platform } from 'react-native'
import { ReceiptUploadSection } from './ReceiptUploadSection'
import { BasicInformationSection } from './BasicInformationSection'
import { GuestInformationSection } from './GuestInformationSection'
import { ItemizedListSection } from './ItemizedListSection'
import { ExpenseFormActions } from './ExpenseFormActions'
import { useExpenseForm } from './useExpenseForm'
import { useAuth } from '../../../../provider/AuthProvider'
import { useCategory } from '../../../../utils/queries.optimized'
import type { CreateExpenseSheetProps } from './types'

export function CreateExpenseSheet({
  isOpen,
  onClose,
  categoryId,
  categoryData: passedCategoryData,
  userRole: passedUserRole,
  onExpenseCreated,
}: CreateExpenseSheetProps) {
  const { isGuest, user, guestSession } = useAuth()

  // Fetch category data to check receipt requirements (only if not passed in)
  const queryEnabled = !!categoryId && isOpen && !passedCategoryData

  const { data: fetchedCategoryData, isLoading: fetchingCategory } = useCategory(
    categoryId?.toString() || '',
    {
      enabled: queryEnabled,
    }
  )

  // Use passed data if available, otherwise fall back to fetched data
  // Handle both response format {category, userRole} and direct category object
  const category = passedCategoryData ?? (fetchedCategoryData?.category || fetchedCategoryData)
  const userRole = passedUserRole ?? fetchedCategoryData?.userRole

  // Check if submissions are allowed for this user and category
  const canSubmit = isGuest
    ? category?.allow_guest_submissions !== false
    : userRole === 'SUBMITTER'
      ? category?.allow_user_submissions !== false
      : true

  // Check if receipt is required for this user and category
  const isReceiptRequired =
    category?.require_receipt &&
    (userRole === 'SUBMITTER' || (isGuest && guestSession?.permissions === 'SUBMIT_ONLY'))

  const {
    // State
    formData,
    itemFormData,
    itemEditData,
    uploadState,
    creating,
    skipAI,
    receiptProcessor,

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
  } = useExpenseForm(categoryId, onExpenseCreated)

  // Set global flag to prevent page refreshes when expense sheet is open (web only)
  useEffect(() => {
    if (Platform.OS === 'web') {
      if (isOpen) {
        ;(window as any).__expenseSheetOpen = true
      } else {
        ;(window as any).__expenseSheetOpen = false
      }

      return () => {
        ;(window as any).__expenseSheetOpen = false
      }
    }
  }, [isOpen])

  // Set global flag when expense sheet is open to prevent page refreshes (web only)
  useEffect(() => {
    if (Platform.OS === 'web' && isOpen) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault()
      }

      window.addEventListener('beforeunload', handleBeforeUnload)

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload)
      }
    }
  }, [isOpen])

  const [resetVersion, setResetVersion] = useState(0)

  const handleClose = () => {
    resetForm()
    setResetVersion((v) => v + 1)
    onClose()
  }

  const handleSubmit = async () => {
    const success = await handleCreateExpense(isReceiptRequired)
    if (success) {
      handleClose()
    }
  }

  return (
    <Sheet
      modal
      open={isOpen}
      onOpenChange={onClose}
      snapPoints={[85]}
      moveOnKeyboardChange
    >
      <Sheet.Frame
        p="$4"
        gap="$4"
        flex={1}
        maxH="90vh"
      >
        <Sheet.Handle />

        {/* Header */}
        <XStack
          items="center"
          gap="$2"
          justify="space-between"
        >
          <XStack
            items="center"
            gap="$2"
          >
            <Receipt size={20} />
            <H2>Submit Expense</H2>
          </XStack>
          <Button
            size="$3"
            circular
            icon={X}
            onPress={onClose}
            chromeless
          />
        </XStack>

        {/* Check if submissions are allowed */}
        {!canSubmit ? (
          <Card
            p="$4"
            bg="$color3"
            items="center"
          >
            <YStack
              gap="$2"
              items="center"
            >
              <Text
                color="$color11"
                fontWeight="600"
              >
                {isGuest
                  ? 'Guest submissions are disabled for this category'
                  : 'User submissions are disabled for this category'}
              </Text>
              <Button
                variant="outlined"
                onPress={onClose}
              >
                Close
              </Button>
            </YStack>
          </Card>
        ) : (
          <Sheet.ScrollView
            key={isOpen ? 'open' : 'closed'}
            showsVerticalScrollIndicator={false}
          >
            <Form onSubmit={handleSubmit}>
              <YStack gap="$4">
                {/* Category and Workspace Information */}
                {category && (
                  <>
                    <Card
                      p="$3"
                      bg="$color2"
                      bordered
                    >
                      <YStack gap="$2">
                        <XStack
                          items="center"
                          gap="$2"
                        >
                          <Folder
                            size={16}
                            color="$color10"
                          />
                          <Text
                            fontWeight="600"
                            color="$color12"
                          >
                            Category: {category.name}
                          </Text>
                        </XStack>
                        {category.report && (
                          <XStack
                            items="center"
                            gap="$2"
                          >
                            <Building2
                              size={16}
                              color="$color10"
                            />
                            <Text
                              color="$color10"
                              fontSize="$3"
                            >
                              Workspace: {category.report.name}
                            </Text>
                          </XStack>
                        )}
                      </YStack>
                    </Card>
                    <Separator />
                  </>
                )}

                {/* Guest Information Section - only for guest users */}
                {isGuest && (
                  <>
                    <GuestInformationSection
                      key={`guest-${resetVersion}`}
                      guestName={formData.guestName || ''}
                      guestEmail={formData.guestEmail || ''}
                      onGuestNameChange={setGuestName}
                      onGuestEmailChange={setGuestEmail}
                      resetSignal={resetVersion}
                    />
                    <Separator />
                  </>
                )}

                {/* Receipt Upload Section */}
                <ReceiptUploadSection
                  selectedReceipt={formData.selectedReceipt}
                  uploadingReceipt={uploadState.uploadingReceipt}
                  creating={creating}
                  onReceiptSelected={handleReceiptSelected}
                  onReceiptRemoved={handleReceiptRemoved}
                  isRequired={isReceiptRequired}
                  receiptProcessor={receiptProcessor}
                  skipAI={skipAI}
                  onSkipAIChange={setSkipAI}
                />

                <Separator />

                {/* Basic Information Section */}
                <BasicInformationSection
                  key={`basic-${resetVersion}`}
                  amount={formData.amount}
                  description={formData.description}
                  transactionDate={formData.transactionDate}
                  onAmountChange={setAmount}
                  onDescriptionChange={setDescription}
                  onTransactionDateChange={setTransactionDate}
                  resetSignal={resetVersion}
                />

                <Separator />

                {/* Itemized List Section */}
                <ItemizedListSection
                  key={`items-${resetVersion}`}
                  items={formData.items}
                  itemName={itemFormData.itemName}
                  itemQuantity={itemFormData.itemQuantity}
                  itemPrice={itemFormData.itemPrice}
                  editingItemIndex={itemEditData.editingItemIndex}
                  editItemName={itemEditData.editItemName}
                  editItemQuantity={itemEditData.editItemQuantity}
                  editItemPrice={itemEditData.editItemPrice}
                  onItemNameChange={setItemName}
                  onItemQuantityChange={setItemQuantity}
                  onItemPriceChange={setItemPrice}
                  onEditItemNameChange={setEditItemName}
                  onEditItemQuantityChange={setEditItemQuantity}
                  onEditItemPriceChange={setEditItemPrice}
                  onAddItem={handleAddItem}
                  onEditItem={handleEditItem}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={handleCancelEdit}
                  onDeleteItem={handleDeleteItem}
                  resetSignal={resetVersion}
                />

                {/* Action Buttons */}
                <ExpenseFormActions
                  creating={creating}
                  uploadingReceipt={uploadState.uploadingReceipt}
                  parsingReceipt={receiptProcessor.parsingReceipt}
                  onClose={handleClose}
                  onSubmit={handleSubmit}
                />
              </YStack>
            </Form>
          </Sheet.ScrollView>
        )}
      </Sheet.Frame>
      <Sheet.Overlay />
    </Sheet>
  )
}
