import React from 'react'
import Svg, { Path } from 'react-native-svg'

interface EmailIconProps {
  width?: number
  height?: number
  color?: string
}

/**
 * Renders an email icon as an SVG component using react-native-svg.
 *
 * @param {object} props - The component's props.
 * @param {number} [props.width=18] - The width of the icon in pixels.
 * @param {number} [props.height=18] - The height of the icon in pixels.
 * @param {string} [props.color="currentColor"] - The color of the icon.
 * @returns {JSX.Element} The rendered email icon SVG element.
 *
 * @example
 * // Basic usage with default size
 * <EmailIcon />
 *
 * @example
 * // White email icon for dark backgrounds
 * <EmailIcon width={18} height={18} color="white" />
 */
export const EmailIcon = ({ width = 18, height = 18, color = 'currentColor' }: EmailIconProps) => (
  <Svg
    height={height}
    viewBox="0 0 24 24"
    width={width}
  >
    <Path
      d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
      stroke={color}
      strokeWidth="2"
      fill="none"
    />
    <Path
      d="m22 6-10 7L2 6"
      stroke={color}
      strokeWidth="2"
      fill="none"
    />
  </Svg>
)
