import React from 'react'
import { YStack, Card, Paragraph, ListItem, XStack, Button, Checkbox, H2, Separator } from '@my/ui'
import { ChevronRight, Check, ChevronDown, FolderOpen, Plus } from '@tamagui/lucide-icons'
import { useRouter, useSearchParams } from 'solito/navigation'
import type { Category } from '../../../types'
import { formatCurrency } from '../../../utils/currency'
import { useAuth } from '../../../provider/AuthProvider'

interface CategoryListProps {
  categories: Category[]
  selectedCategories?: number[]
  onCategorySelectionChange?: (categoryId: number, selected: boolean) => void
  collapsedCategories?: Set<number>
  onToggleCollapse?: (categoryId: number) => void
  showCheckboxes?: boolean
  onCreateSubcategory?: () => void
}

export function CategoryList({
  categories,
  selectedCategories = [],
  onCategorySelectionChange,
  collapsedCategories = new Set(),
  onToggleCollapse,
  showCheckboxes = false,
  onCreateSubcategory,
}: CategoryListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isGuest } = useAuth()

  // Function to handle category navigation with guest token preservation
  const handleCategoryNavigation = (categoryId: number) => {
    const guestToken = searchParams?.get('guestToken')
    if (isGuest && guestToken) {
      // For guest users, preserve the guest token in the URL
      router.push(`/category/${categoryId}?guestToken=${guestToken}`)
    } else {
      // For authenticated users, navigate normally
      router.push(`/category/${categoryId}`)
    }
  }

  // Flatten all categories (including children) for easier selection management
  const flattenCategories = (cats: Category[]): Category[] => {
    const flattened: Category[] = []
    const traverse = (category: Category) => {
      flattened.push(category)
      if (category.children) {
        category.children.forEach(traverse)
      }
    }
    cats.forEach(traverse)
    return flattened
  }

  const allCategories = flattenCategories(categories)
  const hasSelectionFeature = showCheckboxes && onCategorySelectionChange !== undefined
  const allSelected =
    hasSelectionFeature &&
    allCategories.length > 0 &&
    allCategories.every((cat) => selectedCategories.includes(cat.id))
  const someSelected = selectedCategories.length > 0

  const renderCategory = (category: Category, level = 0) => {
    const hasChildren = category.children && category.children.length > 0
    const isCollapsed = collapsedCategories.has(category.id)

    return (
      <YStack
        key={category.id}
        pl={level > 0 ? '$4' : '$0'}
      >
        <React.Fragment>
          <XStack
            p="$3"
            justify="space-between"
            items="center"
            minH="$6"
            gap="$3"
            pressStyle={{ scale: 0.98 }}
            onPress={() => handleCategoryNavigation(category.id)}
            cursor="pointer"
          >
            {hasSelectionFeature && (
              <Checkbox
                id={`category-${category.id}`}
                checked={selectedCategories.includes(category.id)}
                onCheckedChange={(checked) => onCategorySelectionChange?.(category.id, !!checked)}
              >
                <Checkbox.Indicator>
                  <Check />
                </Checkbox.Indicator>
              </Checkbox>
            )}
            <YStack
              flex={1}
              gap="$1"
            >
              <XStack
                gap="$2"
                items="center"
              >
                <Paragraph
                  fontWeight="600"
                  color="$color12"
                >
                  {category.name}
                </Paragraph>
                {hasChildren && onToggleCollapse && (
                  <Button
                    size="$2"
                    variant="outlined"
                    onPress={(e) => {
                      e.stopPropagation()
                      onToggleCollapse(category.id)
                    }}
                    icon={isCollapsed ? ChevronRight : ChevronDown}
                    pressStyle={{ scale: 0.95 }}
                  />
                )}
              </XStack>
              {category?.spentAmount !== undefined ? (
                <Paragraph color="$color10">
                  {Number.parseFloat((category?.budget ?? 0).toString()) !== 0.0 ? (
                    <>
                      Spent: {formatCurrency(category.spentAmount)} /{' '}
                      {category?.budget
                        ? formatCurrency(Number.parseFloat(category.budget.toString()))
                        : formatCurrency(0)}{' '}
                      ({category.spentPercentage}%)
                    </>
                  ) : (
                    <>Spent: {formatCurrency(category.spentAmount)}</>
                  )}
                </Paragraph>
              ) : (
                Number.parseFloat((category?.budget ?? 0).toString()) !== 0.0 && (
                  <Paragraph color="$color10">
                    Budget:{' '}
                    {category?.budget
                      ? formatCurrency(Number.parseFloat(category.budget.toString()))
                      : formatCurrency(0)}
                  </Paragraph>
                )
              )}
            </YStack>
            <ChevronRight
              size={16}
              color="$color11"
            />
          </XStack>
        </React.Fragment>
        {hasChildren &&
          !isCollapsed &&
          category.children!.map((child, index) => (
            <React.Fragment key={child.id}>
              <Separator />
              {renderCategory(child, level + 1)}
            </React.Fragment>
          ))}
      </YStack>
    )
  }

  const renderContent = () => {
    if (categories.length === 0) {
      return (
        <YStack
          gap="$2"
          items="center"
          py="$4"
        >
          <FolderOpen
            size={32}
            color="$color8"
          />
          <Paragraph color="$color11">No sub-categories found</Paragraph>
          <Paragraph
            color="$color10"
            size="$3"
          >
            Sub-categories will appear here
          </Paragraph>
        </YStack>
      )
    }

    return (
      <>
        {hasSelectionFeature && allCategories.length > 1 && (
          <XStack
            p="$3"
            items="center"
            gap="$3"
            borderBottomWidth={1}
            borderBottomColor="$borderColor"
          >
            <Checkbox
              id="select-all-categories"
              checked={allSelected}
              onCheckedChange={(checked) => {
                if (checked) {
                  // Select all categories
                  allCategories.forEach((category) => {
                    if (!selectedCategories.includes(category.id)) {
                      onCategorySelectionChange!(category.id, true)
                    }
                  })
                } else {
                  // Clear all selections
                  selectedCategories.forEach((categoryId) => {
                    onCategorySelectionChange!(categoryId, false)
                  })
                }
              }}
            >
              <Checkbox.Indicator>
                <Check />
              </Checkbox.Indicator>
            </Checkbox>
            <YStack flex={1}>
              <Paragraph
                size="$3"
                color="$color10"
              >
                {allSelected ? 'Deselect All' : 'Select All'}
                {someSelected && !allSelected && ` (${selectedCategories.length} selected)`}
              </Paragraph>
            </YStack>
          </XStack>
        )}
        {categories.map((category, index) => (
          <React.Fragment key={category.id}>
            {index > 0 && <Separator />}
            {renderCategory(category)}
          </React.Fragment>
        ))}
      </>
    )
  }

  return (
    <Card
      p="$4"
      gap="$3"
    >
      <XStack
        gap="$2"
        items="center"
        justify="space-between"
      >
        <XStack
          gap="$2"
          items="center"
        >
          <FolderOpen
            size={24}
            color="$blue10"
          />
          <H2 size="$6">Categories</H2>
        </XStack>
        {onCreateSubcategory && (
          <Button
            size="$3"
            variant="outlined"
            onPress={onCreateSubcategory}
            icon={
              <Plus
                size={16}
                color="$color11"
              />
            }
            pressStyle={{ scale: 0.95 }}
          />
        )}
      </XStack>
      <Card>{renderContent()}</Card>
    </Card>
  )
}
