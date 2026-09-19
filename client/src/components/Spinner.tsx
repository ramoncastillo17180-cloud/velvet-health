interface SpinnerProps {
  className?: string
  label?: string
}

/** Inline loading spinner. */
export function Spinner({ className = '', label = 'Cargando' }: SpinnerProps) {
  return (
    <div
      className={`inline-flex items-center justify-center ${className}`}
      role="status"
      aria-label={label}
    >
      <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-green-200 border-t-primary" />
    </div>
  )
}
