import type React from 'react'
import { motion } from 'framer-motion'

interface RainbowKeystoneAIProps {
  children?: React.ReactNode
}

export const RainbowKeystoneAI: React.FC<RainbowKeystoneAIProps> = ({ children }) => {
  return (
    <motion.span
      style={{
        background:
          'linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)',
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        display: 'inline',
      }}
      animate={{
        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
      }}
      transition={{
        duration: 3,
        repeat: Number.POSITIVE_INFINITY,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.span>
  )
}
