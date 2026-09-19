import type { Question } from '../api'

interface ExamQuestionProps {
  question: Question
  index: number
  selectedOptionId: number | null
  onSelect: (optionId: number) => void
}

export function ExamQuestion({
  question,
  index,
  selectedOptionId,
  onSelect,
}: ExamQuestionProps) {
  return (
    <div className="card p-5 sm:p-6">
      <p className="mb-4 flex items-start gap-3 text-lg font-semibold text-gray-800">
        <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
          {index + 1}
        </span>
        <span>{question.prompt}</span>
      </p>

      <div role="radiogroup" className="space-y-2">
        {question.options.map((option) => {
          const checked = selectedOptionId === option.id
          return (
            <label
              key={option.id}
              className={`flex cursor-pointer items-center gap-3 rounded-[10px] border p-3 transition-colors ${
                checked
                  ? 'border-primary bg-green-selected'
                  : 'border-gray-200 hover:border-green-400'
              }`}
            >
              <input
                type="radio"
                name={`question-${question.id}`}
                value={option.id}
                checked={checked}
                onChange={() => onSelect(option.id)}
                className="sr-only"
              />
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  checked
                    ? 'border-primary bg-primary text-white'
                    : 'border-gray-300 text-transparent'
                }`}
              >
                <i className="fa-solid fa-check text-[10px]" aria-hidden="true" />
              </span>
              <span className="text-gray-700">{option.text}</span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
