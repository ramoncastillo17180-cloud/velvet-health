import { motion } from 'framer-motion'

interface ProgressCircleProps {
  /** Progress percentage, 0–100 (clamped internally). */
  value: number
  size?: number
  strokeWidth?: number
  /** Optional image rendered inside the circle. */
  image?: string
  imageAlt?: string
  /** Accessible label for the progress indicator. */
  label?: string
}

/** Animated SVG progress ring with an optional inner image and percentage. */
export function ProgressCircle({
  value,
  size = 180,
  strokeWidth = 10,
  image,
  imageAlt = '',
  label,
}: ProgressCircleProps) {
  const clamped = Math.max(0, Math.min(100, value))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (clamped / 100) * circumference

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="-rotate-90"
        role="img"
        aria-label={label ?? `Progreso: ${clamped}%`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e0e0e0"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-success)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
        {image && (
          <img
            src={image}
            alt={imageAlt}
            className="max-h-[45%] max-w-[55%] object-contain"
          />
        )}
        <span className="rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-success">
          {clamped}%
        </span>
      </div>
    </div>
  )
}
