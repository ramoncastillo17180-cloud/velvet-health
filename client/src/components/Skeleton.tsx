interface SkeletonProps {
  className?: string
}

/** Base shimmer block. Combine with sizing utilities (e.g. `h-4 w-full`). */
export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />
}
