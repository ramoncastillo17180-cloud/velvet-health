import { motion } from 'framer-motion'
import type { Course } from '../api'

interface BaseProps {
  course: Course
}

interface SelectableProps extends BaseProps {
  variant: 'selectable'
  selected: boolean
  onToggle: () => void
}

interface CatalogProps extends BaseProps {
  variant: 'catalog'
  onStart: () => void
}

type CourseCardProps = SelectableProps | CatalogProps

/**
 * Course card with two visual variants:
 * - `selectable`: horizontal row used on Home for toggling selection.
 * - `catalog`: vertical card used on the /practicas catalog.
 */
export function CourseCard(props: CourseCardProps) {
  const { course } = props

  if (props.variant === 'selectable') {
    const { selected, onToggle } = props
    return (
      <motion.button
        type="button"
        onClick={onToggle}
        whileHover={{ y: -4 }}
        whileTap={{ scale: 0.99 }}
        aria-pressed={selected}
        className={`flex w-full items-center justify-between gap-4 rounded-card border bg-white p-5 text-left shadow-sm transition-colors ${
          selected ? 'border-primary bg-green-selected' : 'border-gray-200'
        }`}
      >
        <div className="flex items-center gap-4">
          <img
            src={`/images/${course.image}`}
            alt={course.title}
            className="h-12 w-12 shrink-0 object-contain"
          />
          <div>
            <p className="text-lg font-semibold text-primary">{course.title}</p>
            <p className="text-sm text-gray-500">
              Mínimo {course.passThreshold}% — Minutos {course.minutes}
            </p>
          </div>
        </div>
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
            selected
              ? 'border-primary bg-primary text-white'
              : 'border-gray-300 text-transparent'
          }`}
        >
          <i className="fa-solid fa-check text-sm" aria-hidden="true" />
        </span>
      </motion.button>
    )
  }

  const { onStart } = props
  return (
    <motion.article
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="flex flex-col justify-between rounded-card-lg bg-white p-5 shadow-card"
    >
      <img
        src={`/images/${course.image}`}
        alt={course.title}
        className="mx-auto mb-4 h-24 w-24 object-contain"
      />
      <h2 className="mb-1 text-center text-lg font-semibold text-primary">
        {course.title}
      </h2>
      <p className="mb-2 text-center text-sm font-semibold text-success">
        {course.minutes} Minutos
      </p>
      <p className="mb-5 text-center text-sm text-gray-600">
        {course.description}
      </p>
      <button type="button" onClick={onStart} className="btn-primary w-full">
        Iniciar
      </button>
    </motion.article>
  )
}
