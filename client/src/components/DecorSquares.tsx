import type { CSSProperties } from 'react'

// Decorative rotated squares (45°) — the Velvet Health brand motif.
// Header squares sit on the left, footer squares on the right.

interface SquareSpec {
  size: number
  color: string
  placement: CSSProperties
}

const HEADER_SQUARES: SquareSpec[] = [
  { size: 50, color: 'bg-green-400', placement: { top: -10, left: -10 } },
  { size: 70, color: 'bg-green-300', placement: { top: 10, left: 20 } },
  { size: 40, color: 'bg-green-500', placement: { top: 40, left: 5 } },
  { size: 80, color: 'bg-green-100', placement: { top: -20, left: 60 } },
]

const FOOTER_SQUARES: SquareSpec[] = [
  { size: 60, color: 'bg-green-400', placement: { bottom: -10, right: -10 } },
  { size: 80, color: 'bg-green-300', placement: { bottom: 20, right: 30 } },
  { size: 40, color: 'bg-green-500', placement: { bottom: 60, right: 10 } },
  { size: 100, color: 'bg-green-100', placement: { bottom: -30, right: 80 } },
]

interface DecorSquaresProps {
  variant: 'header' | 'footer'
}

export function DecorSquares({ variant }: DecorSquaresProps) {
  const squares = variant === 'header' ? HEADER_SQUARES : FOOTER_SQUARES

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {squares.map((square, index) => (
        <span
          key={index}
          className={`absolute rotate-45 ${square.color}`}
          style={{
            width: square.size,
            height: square.size,
            ...square.placement,
          }}
        />
      ))}
    </div>
  )
}
