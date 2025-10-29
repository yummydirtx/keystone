import React from 'react'

interface AppleIconProps {
  width?: number
  height?: number
  color?: string
}

/**
 * Renders an Apple logo icon as an SVG component.
 *
 * @param {object} props - The component's props.
 * @param {number} [props.width=18] - The width of the icon in pixels.
 * @param {number} [props.height=18] - The height of the icon in pixels.
 * @param {string} [props.color='#000000'] - The fill color of the icon in any valid CSS color format.
 * @returns {JSX.Element} The rendered Apple icon SVG element.
 *
 * @example
 * // Basic usage with default props
 * <AppleIcon />
 *
 * @example
 * // Custom sized white Apple icon
 * <AppleIcon width={24} height={24} color="#FFFFFF" />
 *
 * @example
 * // Large Apple icon with brand color
 * <AppleIcon width={48} height={48} color="#A855F7" />
 */
export const AppleIcon = ({ width = 18, height = 18, color = '#000000' }: AppleIconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    height={height}
    viewBox="0 0 24 24"
    width={width}
  >
    <path
      d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 22C7.78997 22.05 6.79997 20.68 5.95997 19.47C4.24997 17 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.13997 6.91 8.85997 6.88C10.15 6.86 11.36 7.75 12.11 7.75C12.86 7.75 14.28 6.68 15.87 6.84C16.52 6.87 18.11 7.15 19.09 8.71C19 8.76 17.36 9.78 17.37 11.94C17.39 14.59 19.56 15.8 19.56 15.82C19.55 15.86 19.05 17.58 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"
      fill={color}
    />
  </svg>
)
