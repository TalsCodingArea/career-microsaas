import { QuestionnaireProvider } from './context/QuestionnaireContext.tsx'
import { Questionnaire } from './components/Questionnaire.tsx'

export default function App() {
  return (
    <QuestionnaireProvider>
      <Questionnaire />
    </QuestionnaireProvider>
  )
}
