import { YStack, Label, Select, Adapt, Sheet, XStack, Button } from '@my/ui'
import { Check, ChevronDown, HelpCircle } from '@tamagui/lucide-icons'

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
        id="role"
        value={role}
        onValueChange={setRole}
        disablePreventBodyScroll
      >
        <Select.Trigger iconAfter={ChevronDown}>
          <Select.Value placeholder={placeholder} />
        </Select.Trigger>

        <Adapt
          when="sm"
          platform="native"
        >
          <Sheet
            native
            modal
            dismissOnSnapToBottom
          >
            <Sheet.Frame>
              <Sheet.ScrollView>
                <Adapt.Contents />
              </Sheet.ScrollView>
            </Sheet.Frame>
            <Sheet.Overlay />
          </Sheet>
        </Adapt>

        <Select.Content
          zIndex={200000}
          trapped={false}
        >
          <Select.Viewport minW={200}>
            <Select.Group>
              <Select.Label>Roles</Select.Label>
              {roles.map((item, i) => (
                <Select.Item
                  index={i}
                  key={item.name}
                  value={item.value}
                >
                  <Select.ItemText>{item.name}</Select.ItemText>
                  <Select.ItemIndicator marginLeft="auto">
                    <Check size={16} />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Group>
          </Select.Viewport>
        </Select.Content>
      </Select>
    </YStack>
  )
}
