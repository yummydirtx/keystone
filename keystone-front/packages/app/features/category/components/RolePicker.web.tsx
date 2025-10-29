import { YStack, Label, XStack, Button } from '@my/ui'
import Select from 'react-select'
import { useMemo } from 'react'
import { HelpCircle } from '@tamagui/lucide-icons'

interface Role {
  name: string
  value: string
}

interface RolePickerProps {
  role: string
  setRole: (role: string) => void
  roles: Role[]
  label?: string
  placeholder?: string
  onHelpPress?: () => void
}

export function RolePicker({
  role,
  setRole,
  roles,
  label = 'Role',
  placeholder = 'Select a role...',
  onHelpPress,
}: RolePickerProps) {
  const options = useMemo(() => roles.map((r) => ({ value: r.value, label: r.name })), [roles])

  const selectedOption = options.find((option) => option.value === role) || null

  return (
    <YStack gap="$2">
      <XStack
        items="center"
        justify="space-between"
        gap="$2"
      >
        <Label>{label}</Label>
        {onHelpPress ? (
          <Button
            size="$2"
            circular
            variant="outlined"
            icon={HelpCircle}
            onPress={onHelpPress}
            aria-label="Role permissions info"
          />
        ) : null}
      </XStack>
      <Select
        value={selectedOption}
        onChange={(option) => setRole(option?.value || '')}
        options={options}
        placeholder={placeholder}
        isSearchable={false}
        styles={{
          control: (baseStyles, state) => ({
            ...baseStyles,
            backgroundColor: '#1F2937',
            borderColor: state.isFocused ? '#007AFF' : '#374151',
            boxShadow: state.isFocused ? '0 0 0 1px #007AFF' : 'none',
            color: '#F9FAFB',
            '&:hover': {
              borderColor: '#007AFF',
            },
          }),
          singleValue: (baseStyles) => ({
            ...baseStyles,
            color: '#F9FAFB',
          }),
          placeholder: (baseStyles) => ({
            ...baseStyles,
            color: '#9CA3AF',
          }),
          option: (baseStyles, state) => ({
            ...baseStyles,
            backgroundColor: state.isSelected ? '#007AFF' : state.isFocused ? '#374151' : '#1F2937',
            color: state.isSelected ? 'white' : '#F9FAFB',
            '&:hover': {
              backgroundColor: state.isSelected ? '#007AFF' : '#374151',
            },
          }),
          menu: (baseStyles) => ({
            ...baseStyles,
            backgroundColor: '#1F2937',
            border: '1px solid #374151',
            zIndex: 9999,
          }),
          menuList: (baseStyles) => ({
            ...baseStyles,
            backgroundColor: '#1F2937',
          }),
        }}
      />
    </YStack>
  )
}
