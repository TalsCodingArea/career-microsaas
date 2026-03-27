interface Props {
  min: number
  max: number
  step: number
  unit?: string
  labels?: Record<string, string>
  value: number
  onChange: (value: number) => void
}

export function SliderInput({ min, max, step, unit, labels, value, onChange }: Props) {
  const pct = ((value - min) / (max - min)) * 100

  const displayLabel = labels?.[String(value)]
  const displayValue = displayLabel ?? `${value}${unit ? ` ${unit}` : ''}`

  return (
    <div className="w-full">
      <div className="text-center mb-6">
        <span className="text-4xl font-bold text-accent-400">{displayValue}</span>
      </div>

      <div className="relative px-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to left, #22c55e ${pct}%, #374151 ${pct}%)`,
          }}
          aria-label={`Slider: ${displayValue}`}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
        />
      </div>

      {labels && (
        <div className="flex justify-between mt-2 text-xs text-gray-500 px-1" dir="rtl">
          {Object.entries(labels).map(([k, v]) => (
            <span key={k}>{v}</span>
          ))}
        </div>
      )}

      <style>{`
        input[type='range']::-webkit-slider-thumb {
          appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #22c55e;
          cursor: pointer;
          border: 3px solid #111827;
          box-shadow: 0 0 0 2px #22c55e;
        }
        input[type='range']::-moz-range-thumb {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #22c55e;
          cursor: pointer;
          border: 3px solid #111827;
        }
      `}</style>
    </div>
  )
}
