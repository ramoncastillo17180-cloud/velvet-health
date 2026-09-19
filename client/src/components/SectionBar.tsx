interface SectionBarProps {
  title: string
  subtitle?: string
}

/** Refined page heading with an accent underline (replaces the legacy white bar). */
export function SectionBar({ title, subtitle }: SectionBarProps) {
  return (
    <div className="mx-auto my-8 max-w-7xl px-4 text-center">
      <h1 className="text-2xl font-semibold text-primary-dark sm:text-3xl">
        {title}
      </h1>
      {subtitle && (
        <p className="mx-auto mt-2 max-w-xl text-gray-500">{subtitle}</p>
      )}
      <span className="mx-auto mt-3 block h-1 w-16 rounded-full bg-accent" />
    </div>
  )
}
