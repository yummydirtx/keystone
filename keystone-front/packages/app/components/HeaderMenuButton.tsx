import { ProfileMenuButton } from './ProfileMenuButton'

/**
 * Renders a profile menu button that shows the user's profile picture and toggles a user menu sheet.
 * This component manages the open/closed state of the menu and provides
 * a consistent header navigation experience with user profile integration.
 *
 * @returns {JSX.Element} The rendered profile menu button with associated user menu.
 *
 * @example
 * // Basic usage in a header
 * <HeaderMenuButton />
 *
 * @example
 * // Typically used within a navigation header
 * <Header>
 *   <HeaderMenuButton />
 *   <HeaderTitle>App Name</HeaderTitle>
 * </Header>
 */
export function HeaderMenuButton() {
  return <ProfileMenuButton />
}
