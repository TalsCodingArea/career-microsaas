import { useQuestionnaire } from '../context/QuestionnaireContext.tsx'
import { QuestionCard } from './QuestionCard.tsx'
import { ProgressBar } from './ProgressBar.tsx'
import { Results } from './Results.tsx'
import questionnaire from '../data/questionnaire.json'
import type { Question } from '../types/QuestionnaireTypes.ts'

const questions = questionnaire.questions as Question[]

export function Questionnaire() {
  const { state, goNext, goBack } = useQuestionnaire()
  const { currentQuestionIndex, isComplete, result } = state

  if (isComplete && result) {
    return (
      <div className="min-h-screen bg-gray-950 py-12 px-4">
        <Results result={result} />
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]

  if (!currentQuestion) return null

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Top bar */}
      <header className="w-full max-w-lg mx-auto px-4 pt-8 pb-4">
        <div className="mb-6">
          <span className="text-accent-400 font-bold text-lg tracking-tight">Career Evaluator</span>
        </div>
        <ProgressBar
          current={currentQuestionIndex + 1}
          total={questions.length}
        />
      </header>

      {/* Question */}
      <main className="flex-1 flex items-start justify-center px-4 pt-8 pb-16">
        <QuestionCard
          key={currentQuestion.id}
          question={currentQuestion}
          allQuestions={questions}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={questions.length}
          onNext={goNext}
          onBack={goBack}
          isFirst={currentQuestionIndex === 0}
        />
      </main>
    </div>
  )
}
