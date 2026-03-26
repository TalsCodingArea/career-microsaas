import type { EvaluationResult } from '../types/QuestionnaireTypes.ts'
import { useQuestionnaire } from '../context/QuestionnaireContext.tsx'

interface Props {
  result: EvaluationResult
}

const demandColors = {
  low: 'text-yellow-400',
  medium: 'text-blue-400',
  high: 'text-accent-400',
}

const demandLabels = {
  low: 'Low Demand',
  medium: 'Medium Demand',
  high: 'High Demand',
}

function ScoreRing({ score }: { score: number }) {
  const pct = Math.round(score * 100)
  const radius = 54
  const circ = 2 * Math.PI * radius
  const dash = (pct / 100) * circ

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r={radius} fill="none" stroke="#1f2937" strokeWidth="12" />
          <circle
            cx="64"
            cy="64"
            r={radius}
            fill="none"
            stroke="#22c55e"
            strokeWidth="12"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-accent-400">{pct}</span>
          <span className="text-xs text-gray-400">/ 100</span>
        </div>
      </div>
      <p className="text-sm text-gray-400 font-medium">Market Readiness Score</p>
    </div>
  )
}

export function Results({ result }: Props) {
  const { reset } = useQuestionnaire()
  const { marketSnapshot, tips, networkingContacts } = result

  const salaryDisplay = `$${marketSnapshot.avgSalaryMin.toLocaleString()} – $${marketSnapshot.avgSalaryMax.toLocaleString()} / yr`

  return (
    <div className="animate-fade-in w-full max-w-2xl mx-auto space-y-6">
      <div className="text-center mb-2">
        <h1 className="text-3xl font-bold text-gray-100 mb-1">Your Career Evaluation</h1>
        <p className="text-gray-400">Based on your profile and current market data</p>
      </div>

      {/* Timeline + Score */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Estimated Timeline</p>
          <p className="text-4xl font-bold text-accent-400 mb-1">{result.timelineLabel}</p>
          <p className="text-sm text-gray-400">
            {result.timelineWeeksMin}–{result.timelineWeeksMax} weeks to an offer
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col items-center justify-center">
          <ScoreRing score={result.score} />
        </div>
      </div>

      {/* Market Snapshot */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-gray-100 mb-4">Market Snapshot</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Open Positions</p>
            <p className="text-2xl font-bold text-gray-100">
              {marketSnapshot.openPositions.toLocaleString()}+
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Avg Salary</p>
            <p className="text-xl font-bold text-gray-100">{salaryDisplay}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Demand</p>
            <p className={`text-xl font-bold ${demandColors[marketSnapshot.demandLevel]}`}>
              {demandLabels[marketSnapshot.demandLevel]}
            </p>
          </div>
        </div>
      </div>

      {/* Tips */}
      {tips.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-gray-100 mb-4">Personalized Tips</h2>
          <ul className="space-y-3">
            {tips.map((tip, i) => (
              <li key={i} className="flex gap-3">
                <span className="text-accent-400 font-bold flex-shrink-0">→</span>
                <span className="text-gray-300 text-sm leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Networking Contacts */}
      {networkingContacts.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-gray-100 mb-4">Suggested Connections</h2>
          <div className="space-y-3">
            {networkingContacts.map((contact, i) => (
              <a
                key={i}
                href={contact.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-accent-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-accent-400 font-bold text-sm">
                    {contact.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-100 group-hover:text-accent-400 transition-colors truncate">
                    {contact.name}
                  </p>
                  <p className="text-sm text-gray-400 truncate">
                    {contact.role} at {contact.company}
                  </p>
                </div>
                <span className="text-gray-500 group-hover:text-accent-400 transition-colors text-xs">
                  LinkedIn →
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="text-center pt-2">
        <button onClick={reset} className="btn-secondary text-sm">
          Start Over
        </button>
      </div>
    </div>
  )
}
