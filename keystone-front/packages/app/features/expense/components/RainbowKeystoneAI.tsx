import type React from 'react'
import { useEffect, useMemo } from 'react'
import { Text } from 'react-native'
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming,
  Easing,
  interpolateColor,
  type SharedValue
} from 'react-native-reanimated'

interface RainbowKeystoneAIProps {
  children?: React.ReactNode
  style?: any
  duration?: number
}

const rainbowColors = [
  '#ff0000', // red
  '#ff7f00', // orange  
  '#ffff00', // yellow
  '#00ff00', // green
  '#0000ff', // blue
  '#4b0082', // indigo
  '#9400d3', // violet
]

// Component for individual character animation
const AnimatedCharacter: React.FC<{
  char: string
  index: number
  totalChars: number
  progress: SharedValue<number>
  style?: any
}> = ({ char, index, totalChars, progress, style }) => {
  const animatedStyle = useAnimatedStyle(() => {
    // Create a wave effect: each character starts its cycle with a delay based on its position
    const delay = (index / Math.max(totalChars - 1, 1)) * 0.3 // Reduce stagger to 30% of the cycle
    
    // Use modulo to ensure smooth looping without jumps
    let adjustedProgress = (progress.value + delay) % 1
    
    // Ensure the progress is always positive
    if (adjustedProgress < 0) {
      adjustedProgress += 1
    }
    
    const color = interpolateColor(
      adjustedProgress,
      [0, 1/7, 2/7, 3/7, 4/7, 5/7, 6/7, 1],
      [
        '#ff0000', // red
        '#ff7f00', // orange  
        '#ffff00', // yellow
        '#00ff00', // green
        '#0000ff', // blue
        '#4b0082', // indigo
        '#9400d3', // violet
        '#ff0000', // red again for smooth looping
      ]
    )
    
    return {
      color,
    }
  })

  return (
    <Animated.Text style={[style, animatedStyle]}>
      {char}
    </Animated.Text>
  )
}

export const RainbowKeystoneAI: React.FC<RainbowKeystoneAIProps> = ({ 
  children,
  style,
  duration = 3000
}) => {
  const progress = useSharedValue(0)
  
  const text = typeof children === 'string' ? children : String(children || '')
  const characters = useMemo(() => text.split(''), [text])

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { 
        duration,
        easing: Easing.linear 
      }),
      -1,
      false
    )
  }, [duration])

  return (
    <Text style={style}>
      {characters.map((char, index) => (
        <AnimatedCharacter
          key={`${char}-${index}`}
          char={char}
          index={index}
          totalChars={characters.length}
          progress={progress}
          style={{
            fontWeight: 'bold',
            // Preserve the original style properties except for color (which will be animated)
            fontSize: style?.fontSize,
            fontFamily: style?.fontFamily,
            lineHeight: style?.lineHeight,
            includeFontPadding: false, // Remove extra padding on Android
          }}
        />
      ))}
    </Text>
  )
}
