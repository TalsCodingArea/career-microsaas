interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function TextInput({ value, onChange, placeholder }: Props) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder ?? 'Type your answer…'}
      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-5 py-4 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent text-lg transition-colors"
      aria-label="Text answer"
    />
  )
}
