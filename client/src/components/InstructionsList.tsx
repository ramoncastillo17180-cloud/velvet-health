interface InstructionsListProps {
  instructions: string[]
}

/** Renders the course instructions as a two-column list with play icons. */
export function InstructionsList({ instructions }: InstructionsListProps) {
  const midpoint = Math.ceil(instructions.length / 2)
  const left = instructions.slice(0, midpoint)
  const right = instructions.slice(midpoint)

  return (
    <div className="grid gap-x-10 gap-y-4 md:grid-cols-2">
      <Column items={left} />
      <Column items={right} />
    </div>
  )
}

function Column({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li
          key={index}
          className="flex items-start gap-3 text-base leading-relaxed text-gray-700"
        >
          <i
            className="fa-solid fa-play mt-1.5 shrink-0 text-xs text-success"
            aria-hidden="true"
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}
