import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { getReportRootCategory } from '../../../utils/api'
import { queryKeys } from '../../../utils/queries.optimized'
import type { Workspace, Category } from '../../../types'

/**
 * Custom React hook to fetch and attach root category budget information to each workspace.
 *
 * For each workspace, this hook fetches the root category (using the workspace's ID)
 * and extracts its budget and ID, returning an array of workspaces with this additional data.
 *
 * @param {Workspace[]} workspaces - The list of workspaces to fetch budgets for.
 * @returns {{
 *   workspacesWithBudgets: (Workspace & { rootCategoryBudget?: string; rootCategoryId?: string })[],
 *   isLoading: boolean,
 *   error: unknown
 * }} An object containing the array of workspaces with budget info, loading state, and any error encountered.
 */
export const useWorkspaceBudgets = (workspaces: Workspace[]) => {
  // Fetch root category for each report to get the budget using useQueries
  const rootCategoryQueries = useQueries({
    queries: workspaces.map((workspace) => ({
      queryKey: [...queryKeys.reports(), workspace.id, 'root-category'],
      queryFn: async ({ signal }) => {
        const response = await getReportRootCategory(workspace.id.toString(), signal)
        return (response as any).data?.category
      },
      enabled: !!workspace.id,
      // Cache for 5 minutes by default
      staleTime: 5 * 60 * 1000,
      // Retry failed queries 2 times
      retry: 2,
    })),
  })

  const isLoading = rootCategoryQueries.some((query) => query.isLoading)
  const error = rootCategoryQueries.find((query) => query.error)?.error

  const workspacesWithBudgets = useMemo(() => {
    return workspaces.map((workspace, index) => {
      const rootCategoryQuery = rootCategoryQueries[index]
      const rootCategory = rootCategoryQuery.data as Category | undefined

      return {
        ...workspace,
        rootCategoryBudget: rootCategory?.budget ? rootCategory.budget.toString() : undefined,
        rootCategoryId: rootCategory?.id,
      }
    })
  }, [workspaces, rootCategoryQueries])

  return {
    workspacesWithBudgets,
    isLoading,
    error,
  }
}
