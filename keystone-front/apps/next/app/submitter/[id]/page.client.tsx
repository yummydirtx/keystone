'use client'

import { CategorySubmitterScreen } from 'app/features/submitter/category-screen'
import { useParams } from 'solito/navigation'

export default function PageClient({ params }: { params?: { id: string } }) {
  // Fallback to useParams if params prop is not provided
  const routeParams = useParams()
  const id = params?.id || (routeParams?.id ? String(routeParams.id) : undefined)

  if (!id) {
    return <div>Error: No category ID provided</div>
  }

  return <CategorySubmitterScreen id={id} />
}
