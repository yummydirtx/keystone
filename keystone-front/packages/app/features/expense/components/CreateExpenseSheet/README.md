# CreateExpenseSheet Component Structure

This document describes the refactored `CreateExpenseSheet` component that has been modularized for better readability and maintainability.

## Overview

The original monolithic `CreateExpenseSheet` component (647 lines) has been broken down into smaller, focused components that each handle a specific aspect of the expense creation form.

## Component Structure

```
packages/app/features/expense/components/CreateExpenseSheet/
├── index.ts                      # Main export file
├── types.ts                      # TypeScript interfaces and types
├── CreateExpenseSheet.tsx        # Main orchestrator component
├── useExpenseForm.ts            # Custom hook for form logic
├── ReceiptUploadSection.tsx     # Receipt upload and AI processing
├── BasicInformationSection.tsx  # Amount, description, date inputs
├── ItemizedListSection.tsx      # Itemized list management
└── ExpenseFormActions.tsx       # Submit/Cancel buttons
```

## Components

### `CreateExpenseSheet.tsx`

The main orchestrator component that:

- Manages the overall sheet layout and presentation
- Coordinates between all sub-components
- Handles platform-specific behavior (web page refresh prevention)
- Uses the `useExpenseForm` hook for all business logic

### `useExpenseForm.ts`

A custom hook that encapsulates all form logic including:

- State management for form data, items, and receipt uploads
- Validation logic for all form fields
- Receipt upload and AI processing coordination
- API submission logic for both regular and guest users
- Form reset functionality
- Guest contact information handling (name and email)

### `ReceiptUploadSection.tsx`

Handles receipt-related functionality:

- Receipt picker component integration
- AI processing status display
- Upload feedback and error handling
- Displays parsing progress and results

### `BasicInformationSection.tsx`

Manages core expense information:

- Amount input field
- Description input field
- Transaction date input field
- Input validation display

### `ItemizedListSection.tsx`

Handles itemized expense breakdown:

- Display of existing items with edit/delete actions
- Add new item form
- Item editing functionality (inline editing)
- Input validation for quantities and prices

### `GuestInformationSection.tsx`

Manages guest contact information input:

- Conditional rendering for guest users only
- Name and email input fields
- Integration with form state management

### `ExpenseFormActions.tsx`

Manages form actions:

- Submit button with loading states
- Cancel button
- Disabled states based on form status

## Benefits of the Refactoring

### 1. **Improved Readability**

- Each component has a single, clear responsibility
- Complex logic is isolated in the custom hook
- Components are easier to understand at a glance

### 2. **Better Maintainability**

- Changes to specific features are isolated to relevant components
- Testing can be done on individual components
- Easier to debug issues in specific sections

### 3. **Enhanced Reusability**

- Individual sections can be reused in other forms if needed
- The `useExpenseForm` hook can be used in different UI implementations
- Components follow consistent patterns that can be applied elsewhere

### 4. **Cleaner Architecture**

- Clear separation between UI (components) and logic (hook)
- TypeScript interfaces provide clear contracts between components
- Reduced prop drilling through focused component interfaces

## Usage

The refactored component maintains the same public API as the original:

```tsx
import { CreateExpenseSheet } from './features/expense/CreateExpenseSheet'

;<CreateExpenseSheet
  isOpen={isOpen}
  onClose={handleClose}
  categoryId={categoryId}
  onExpenseCreated={handleExpenseCreated}
/>
```

## Type Safety

All components are fully typed with TypeScript interfaces defined in `types.ts`:

- `CreateExpenseSheetProps` - Main component props
- `ExpenseFormData` - Core form data structure
- `ItemFormData` - Item addition form state
- `ItemEditData` - Item editing state
- Component-specific prop interfaces for each section

## Future Enhancements

The modular structure makes it easy to add new features:

- Additional validation sections
- New input types or form fields
- Enhanced AI processing feedback
- Different receipt upload methods
- Alternative item management UIs

This refactoring maintains all existing functionality while providing a much more maintainable and extensible codebase.
