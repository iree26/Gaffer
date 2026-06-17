import { Routes, Route } from 'react-router-dom'
import GafferHero from './GafferHero'
import SignupQuiz from './SignupQuiz'
import PredictionScreen from './PredictionScreen'
import Leaderboard from './Leaderboard'
import Comments from './Comments'
import Profile from './Profile'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<GafferHero />} />
      <Route path="/signup" element={<SignupQuiz />} />
      <Route path="/predict" element={<PredictionScreen />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="/talk" element={<Comments />} />
      <Route path="/profile" element={<Profile />} />
    </Routes>
  )
}