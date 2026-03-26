import type { QuestionOption } from '../../types/QuestionnaireTypes.ts'

interface Props {
  options: QuestionOption[]
  value: string | undefined
  onChange: (value: string) => void
}

export function SingleSelect({ options, value, onChange }: Props) {
  return (
    <div className="grid gap-3 w-full" role="listbox" aria-label="Select an option">
      {options.map(opt => (
        <button
          key={opt.value}
          role="option"
          aria-selected={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={`option-card ${value === opt.value ? 'option-card-selected' : ''}`}
        >
          <span className="flex items-center gap-3">
            <span
              className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors ${
                value === opt.value ? 'border-accent-500 bg-accent-500' : 'border-gray-500'
              }`}
            />
            <span className="font-medium">{opt.label}</span>
          </span>
        </button>
      ))}
    </div>
  )
}
