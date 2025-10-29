import React from 'react'
import { AppleButton } from '@invertase/react-native-apple-authentication'
import type {
  AppleButtonStyle,
  AppleButtonType,
} from '@invertase/react-native-apple-authentication'

interface AppleSignInButtonProps {
  onPress: () => void
  disabled?: boolean
  style?: object
  buttonStyle?: AppleButtonStyle
  buttonType?: AppleButtonType
}

/**
 * Renders an Apple Sign-In button with customizable styling and behavior.
 * This component wraps the native Apple authentication button and provides
 * additional functionality like disabled state handling.
 *
 * @param {object} props - The component's props.
 * @param {function} props.onPress - Callback function triggered when the button is pressed.
 * @param {boolean} [props.disabled=false] - Whether the button should be disabled and non-interactive.
 * @param {object} [props.style={ width: 200, height: 45 }] - Custom style object for the button container.
 * @param {AppleButtonStyle} [props.buttonStyle=AppleButton.Style.BLACK] - The visual style of the Apple button (BLACK, WHITE, WHITE_OUTLINE).
 * @param {AppleButtonType} [props.buttonType=AppleButton.Type.SIGN_IN] - The type/text of the Apple button (SIGN_IN, CONTINUE, SIGN_UP).
 * @returns {JSX.Element} The rendered Apple Sign-In button component.
 *
 * @example
 * // Basic Apple Sign-In button
 * <AppleSignInButton onPress={handleAppleSignIn} />
 *
 * @example
 * // White style Apple button with custom size
 * <AppleSignInButton
 *   onPress={handleAppleSignIn}
 *   buttonStyle={AppleButton.Style.WHITE}
 *   style={{ width: 280, height: 50 }}
 * />
 *
 * @example
 * // Disabled Apple Sign-In button
 * <AppleSignInButton
 *   onPress={handleAppleSignIn}
 *   disabled={isLoading}
 *   buttonType={AppleButton.Type.CONTINUE}
 * />
 */
export const AppleSignInButton = ({
  onPress,
  disabled = false,
  style = { width: 200, height: 45 },
  buttonStyle = AppleButton.Style.BLACK,
  buttonType = AppleButton.Type.SIGN_IN,
}: AppleSignInButtonProps) => {
  // Apple button doesn't support disabled state directly, so we handle it in onPress
  const handlePress = () => {
    if (!disabled) {
      onPress()
    }
  }

  return (
    <AppleButton
      buttonStyle={buttonStyle}
      buttonType={buttonType}
      style={[style, disabled && { opacity: 0.5 }]}
      onPress={handlePress}
    />
  )
}
