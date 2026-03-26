import React, { createContext, useContext, useReducer, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type {
  Answer,
  EvaluationResult,
  QuestionnaireState,
} from '../types/QuestionnaireTypes.ts'
import { submitEvaluation } from '../services/api.ts'

type Action =
  | { type: 'ANSWER'; payload: Answer }
  | { type: 'NEXT'; payload: number }
  | { type: 'BACK' }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS'; payload: EvaluationResult }
  | { type: 'SUBMIT_ERROR'; payload: string }
  | { type: 'RESET' }

function getSessionId(): string {
  const stored = sessionStorage.getItem('career_session_id')
  if (stored) return stored
  const id = uuidv4()
  sessionStorage.setItem('career_session_id', id)
  return id
}

function initialState(): QuestionnaireState {
  return {
    sessionId: getSessionId(),
    currentQuestionIndex: 0,
    answers: [],
    isComplete: false,
    isSubmitting: false,
    result: null,
    error: null,
  }
}

function reducer(state: QuestionnaireState, action: Action): QuestionnaireState {
  switch (action.type) {
    case 'ANSWER': {
      const existing = state.answers.findIndex(a => a.questionId === action.payload.questionId)
      const answers =
        existing >= 0
          ? state.answers.map((a, i) => (i === existing ? action.payload : a))
          : [...state.answers, action.payload]
      return { ...state, answers }
    }
    case 'NEXT':
      return { ...state, currentQuestionIndex: action.payload }
    case 'BACK':
      return { ...state, currentQuestionIndex: Math.max(0, state.currentQuestionIndex - 1) }
    case 'SUBMIT_START':
      return { ...state, isSubmitting: true, error: null }
    case 'SUBMIT_SUCCESS':
      return { ...state, isSubmitting: false, isComplete: true, result: action.payload }
    case 'SUBMIT_ERROR':
      return { ...state, isSubmitting: false, error: action.payload }
    case 'RESET':
      sessionStorage.removeItem('career_session_id')
      return initialState()
    default:
      return state
  }
}

interface QuestionnaireContextValue {
  state: QuestionnaireState
  setAnswer: (answer: Answer) => void
  goNext: (nextIndex: number) => void
  goBack: () => void
  submit: () => Promise<void>
  reset: () => void
  getAnswer: (questionId: string) => Answer | undefined
}

const QuestionnaireContext = createContext<QuestionnaireContextValue | null>(null)

export function QuestionnaireProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)

  const setAnswer = useCallback((answer: Answer) => {
    dispatch({ type: 'ANSWER', payload: answer })
  }, [])

  const goNext = useCallback((nextIndex: number) => {
    dispatch({ type: 'NEXT', payload: nextIndex })
  }, [])

  const goBack = useCallback(() => {
    dispatch({ type: 'BACK' })
  }, [])

  const submit = useCallback(async () => {
    dispatch({ type: 'SUBMIT_START' })
    try {
      const result = await submitEvaluation(state.sessionId, state.answers)
      dispatch({ type: 'SUBMIT_SUCCESS', payload: result })
    } catch (err) {
      dispatch({ type: 'SUBMIT_ERROR', payload: (err as Error).message })
    }
  }, [state.sessionId, state.answers])

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' })
  }, [])

  const getAnswer = useCallback(
    (questionId: string) => state.answers.find(a => a.questionId === questionId),
    [state.answers]
  )

  return (
    <QuestionnaireContext.Provider value={{ state, setAnswer, goNext, goBack, submit, reset, getAnswer }}>
      {children}
    </QuestionnaireContext.Provider>
  )
}

export function useQuestionnaire() {
  const ctx = useContext(QuestionnaireContext)
  if (!ctx) throw new Error('useQuestionnaire must be used within QuestionnaireProvider')
  return ctx
}
