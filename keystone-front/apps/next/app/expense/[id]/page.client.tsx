'use client'

import { ExpenseDetailScreen } from 'app/features/expense/detail-screen'
import { useParams } from 'solito/navigation'

export default function PageClient({ params }: { params?: { id: string } }) {
  // Fallback to useParams if params prop is not provided
  const routeParams = useParams()
  const id = params?.id || (routeParams?.id ? String(routeParams.id) : undefined)

  if (!id) {
    return <div>Error: No expense ID provided</div>
  }

  return <ExpenseDetailScreen id={id} />
}
