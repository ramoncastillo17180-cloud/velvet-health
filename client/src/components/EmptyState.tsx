import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
}

/** Friendly placeholder when a list has no items. */
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-green-200 bg-white/60 px-6 py-14 text-center">
      <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-2xl text-primary">
        <i className="fa-solid fa-inbox" aria-hidden="true" />
      </span>
      <h3 className="mb-1 text-lg font-semibold text-gray-800">{title}</h3>
      {description && (
        <p className="mb-5 max-w-md text-sm text-gray-500">{description}</p>
      )}
      {action}
    </div>
  )
}
