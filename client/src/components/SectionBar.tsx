interface SectionBarProps {
  title: string
}

/** White heading bar reused at the top of each page (legacy "filter-bar"). */
export function SectionBar({ title }: SectionBarProps) {
  return (
    <div className="mx-auto my-4 max-w-7xl px-4">
      <div className="flex items-center justify-center rounded-[10px] bg-white px-4 py-3 shadow-sm">
        <h1 className="text-xl font-semibold text-primary sm:text-2xl">
          {title}
        </h1>
      </div>
    </div>
  )
}
