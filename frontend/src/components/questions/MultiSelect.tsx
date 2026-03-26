import type { QuestionOption } from '../../types/QuestionnaireTypes.ts'

interface Props {
  options: QuestionOption[]
  value: string[]
  onChange: (value: string[]) => void
}

export function MultiSelect({ options, value, onChange }: Props) {
  const toggle = (val: string) => {
    if (value.includes(val)) {
      onChange(value.filter(v => v !== val))
    } else {
      onChange([...value, val])
    }
  }

  return (
    <div className="grid gap-3 w-full" role="group" aria-label="Select all that apply">
      {options.map(opt => {
        const selected = value.includes(opt.value)
        return (
          <button
            key={opt.value}
            aria-pressed={selected}
            onClick={() => toggle(opt.value)}
            className={`option-card ${selected ? 'option-card-selected' : ''}`}
          >
            <span className="flex items-center gap-3">
              <span
                className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                  selected ? 'border-accent-500 bg-accent-500' : 'border-gray-500'
                }`}
              >
                {selected && (
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 12 12">
                    <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span className="font-medium">{opt.label}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
