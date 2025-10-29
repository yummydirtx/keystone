import React from 'react'

interface EmailIconProps {
  width?: number
  height?: number
  color?: string
}

export const EmailIcon = ({ width = 18, height = 18, color = 'currentColor' }: EmailIconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    height={height}
    viewBox="0 0 24 24"
    width={width}
  >
    <path
      d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
      stroke={color}
      strokeWidth="2"
      fill="none"
    />
    <path
      d="m22 6-10 7L2 6"
      stroke={color}
      strokeWidth="2"
      fill="none"
    />
  </svg>
)
