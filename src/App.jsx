import { Routes, Route } from 'react-router-dom'
import GafferHero from './GafferHero'
import SignupQuiz from './SignupQuiz'
import PredictionScreen from './PredictionScreen'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<GafferHero />} />
      <Route path="/signup" element={<SignupQuiz />} />
      <Route path="/predict" element={<PredictionScreen />} />
    </Routes>
  )
}