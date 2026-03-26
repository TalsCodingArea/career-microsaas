interface Props {
  current: number
  total: number
}

export function ProgressBar({ current, total }: Props) {
  const pct = Math.round((current / total) * 100)

  return (
    <div className="w-full" role="progressbar" aria-valuenow={current} aria-valuemin={0} aria-valuemax={total} aria-label={`Question ${current} of ${total}`}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-gray-500 font-medium tracking-wide uppercase">
          Step {current} of {total}
        </span>
        <span className="text-xs text-accent-400 font-semibold">{pct}%</span>
      </div>
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-accent-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
