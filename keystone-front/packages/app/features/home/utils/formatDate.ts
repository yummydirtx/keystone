export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString)

    // Check if the date is valid
    if (Number.isNaN(date.getTime())) {
      return 'Invalid date'
    }

    const now = new Date()

    // Convert both dates to the user's local timezone for comparison
    // This ensures consistent behavior regardless of how the date was stored
    const localDate = new Date(date.getTime())
    const localNow = new Date(now.getTime())

    // Get date parts in local timezone
    const dateYear = localDate.getFullYear()
    const dateMonth = localDate.getMonth()
    const dateDay = localDate.getDate()

    const nowYear = localNow.getFullYear()
    const nowMonth = localNow.getMonth()
    const nowDay = localNow.getDate()

    // Check if it's the same day in the user's local timezone
    const isSameDay = dateDay === nowDay && dateMonth === nowMonth && dateYear === nowYear

    if (isSameDay) {
      return 'today'
    }

    // Check if it's yesterday in the user's local timezone
    const yesterday = new Date(localNow)
    yesterday.setDate(yesterday.getDate() - 1)
    const isYesterday =
      dateDay === yesterday.getDate() &&
      dateMonth === yesterday.getMonth() &&
      dateYear === yesterday.getFullYear()

    if (isYesterday) {
      return 'yesterday'
    }

    // Calculate days difference using local timezone dates
    // Create dates at midnight in local timezone for accurate day counting
    const localDateMidnight = new Date(dateYear, dateMonth, dateDay)
    const localNowMidnight = new Date(nowYear, nowMonth, nowDay)

    const diffTime = Math.abs(localNowMidnight.getTime() - localDateMidnight.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    // If it's within the last week
    if (diffDays <= 7 && diffDays > 1) {
      return `${diffDays} days ago`
    }

    // If it's within the current year
    if (dateYear === nowYear) {
      return localDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    }

    // For older dates, include the year
    return localDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch (error) {
    console.error('Error formatting date:', error)
    return 'Unknown date'
  }
}
