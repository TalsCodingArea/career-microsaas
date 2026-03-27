import { useState, useEffect } from 'react'
import type { Question } from '../types/QuestionnaireTypes.ts'
import { useQuestionnaire } from '../context/QuestionnaireContext.tsx'
import { SingleSelect } from './questions/SingleSelect.tsx'
import { MultiSelect } from './questions/MultiSelect.tsx'
import { SliderInput } from './questions/SliderInput.tsx'
import { TextInput } from './questions/TextInput.tsx'

interface Props {
  question: Question
  allQuestions: Question[]
  questionNumber: number
  totalQuestions: number
  onNext: (nextIndex: number) => void
  onBack: () => void
  isFirst: boolean
}

function resolveNextIndex(
  question: Question,
  answerValue: string | string[] | number,
  allQuestions: Question[]
): number {
  const { next } = question
  if (next === null) return -1 // signals completion

  if (typeof next === 'string') {
    const idx = allQuestions.findIndex(q => q.id === next)
    return idx >= 0 ? idx : -1
  }

  if (next.type === 'conditional') {
    for (const branch of next.branches) {
      if (branch.when) {
        const matches =
          branch.when.field === question.id &&
          branch.when.equals === (Array.isArray(answerValue) ? answerValue[0] : String(answerValue))
        if (matches) {
          const idx = allQuestions.findIndex(q => q.id === branch.goto)
          return idx >= 0 ? idx : -1
        }
      } else if (branch.default) {
        const idx = allQuestions.findIndex(q => q.id === branch.goto)
        return idx >= 0 ? idx : -1
      }
    }
  }

  return -1
}

export function QuestionCard({ question, allQuestions, questionNumber, totalQuestions, onNext, onBack, isFirst }: Props) {
  const { setAnswer, getAnswer, state, submit } = useQuestionnaire()
  const existingAnswer = getAnswer(question.id)

  const defaultSliderValue = question.type === 'slider'
    ? Math.round(((question.min ?? 0) + (question.max ?? 10)) / 2)
    : 0

  const [value, setValue] = useState<string | string[] | number>(() => {
    if (existingAnswer) return existingAnswer.answer as string | string[] | number
    if (question.type === 'slider') return defaultSliderValue
    if (question.type === 'multi') return []
    return ''
  })

  // Sync when navigating back to a previously answered question
  useEffect(() => {
    if (existingAnswer) {
      setValue(existingAnswer.answer as string | string[] | number)
    } else if (question.type === 'slider') {
      setValue(defaultSliderValue)
    } else if (question.type === 'multi') {
      setValue([])
    } else {
      setValue('')
    }
  }, [question.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const hasAnswer =
    question.type === 'slider'
      ? true
      : question.type === 'multi'
      ? (value as string[]).length > 0
      : String(value).trim().length > 0

  const handleNext = () => {
    const ans = { questionId: question.id, answer: value }
    setAnswer(ans)
    const nextIdx = resolveNextIndex(question, value, allQuestions)
    if (nextIdx < 0) {
      submit()
    } else {
      onNext(nextIdx)
    }
  }

  return (
    <div className="animate-slide-up w-full max-w-lg mx-auto">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
        <div className="mb-2 text-xs text-gray-500 font-medium tracking-widest">
          שאלה {questionNumber} מתוך {totalQuestions}
        </div>

        <h2 className="text-2xl font-semibold text-gray-100 mb-8 leading-snug">
          {question.text}
        </h2>

        <div className="mb-8">
          {question.type === 'single' && question.options && (
            <SingleSelect
              options={question.options}
              value={value as string}
              onChange={v => setValue(v)}
            />
          )}
          {question.type === 'multi' && question.options && (
            <MultiSelect
              options={question.options}
              value={value as string[]}
              onChange={v => setValue(v)}
            />
          )}
          {question.type === 'slider' && (
            <SliderInput
              min={question.min ?? 0}
              max={question.max ?? 10}
              step={question.step ?? 1}
              unit={question.unit}
              labels={question.labels}
              value={value as number}
              onChange={v => setValue(v)}
            />
          )}
          {question.type === 'text' && (
            <TextInput value={value as string} onChange={v => setValue(v)} />
          )}
        </div>

        <div className="flex gap-3">
          {!isFirst && (
            <button
              onClick={onBack}
              className="btn-secondary flex-shrink-0"
              aria-label="חזור"
            >
              חזור →
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!hasAnswer || state.isSubmitting}
            className="btn-primary flex-1"
            aria-label={question.next === null ? 'שלח וקבל תוצאות' : 'שאלה הבאה'}
          >
            {state.isSubmitting
              ? '…מעריך'
              : question.next === null
              ? '← קבל את התוצאות שלי'
              : '← הבא'}
          </button>
        </div>

        {state.error && (
          <p className="mt-4 text-red-400 text-sm text-center" role="alert">
            {state.error}
          </p>
        )}
      </div>
    </div>
  )
}
