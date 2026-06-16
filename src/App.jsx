import { Routes, Route, Navigate } from 'react-router-dom'
import { useUser } from './UserContext'
import GafferHero from './GafferHero'
import SignupQuiz from './SignupQuiz'
import Login from './Login'
import PredictionScreen from './PredictionScreen'
import Leaderboard from './Leaderboard'
import Comments from './Comments'
import Feed from './Feed'
import HotTakes from './HotTakes'
import Challenges from './Challenges'
import Groups from './Groups'
import Brackets from './Brackets'
import MatchPredictions from './MatchPredictions'
import Standings from './Standings'
import GafferAI from './GafferAI'
import Notifications from './Notifications'
import Profile from './Profile'
import Lineups from './Lineups'
import OnboardingOverlay from './OnboardingOverlay'

function AuthenticatedApp() {
  const { isOnboarding, onboardingStep } = useUser();

  if (isOnboarding && onboardingStep === 'quiz') {
    return (
      <>
        <OnboardingOverlay />
        <Routes>
          <Route path="*" element={<SignupQuiz />} />
        </Routes>
      </>
    );
  }

  return (
    <>
      {isOnboarding && <OnboardingOverlay />}
      <Routes>
        <Route path="/" element={<Navigate to={isOnboarding ? '/predict' : '/feed'} replace />} />
        <Route path="/signup" element={<Navigate to={isOnboarding ? '/predict' : '/feed'} replace />} />
        <Route path="/login" element={<Navigate to={isOnboarding ? '/predict' : '/feed'} replace />} />
        <Route path="/predict" element={<PredictionScreen />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/talk" element={<Comments />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/hottakes" element={<HotTakes />} />
        <Route path="/challenges" element={<Challenges />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/groups/:groupId" element={<Groups />} />
        <Route path="/brackets" element={<Brackets />} />
        <Route path="/matchpredictions" element={<MatchPredictions />} />
        <Route path="/standings" element={<Standings />} />
        <Route path="/standings/:group" element={<Standings />} />
        <Route path="/gafferai" element={<GafferAI />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:username" element={<Profile />} />
        <Route path="/lineups" element={<Lineups />} />
        <Route path="/lineups/:matchId" element={<Lineups />} />
      </Routes>
    </>
  );
}

export default function App() {
  const { isAuthenticated } = useUser();

  if (isAuthenticated) {
    return <AuthenticatedApp />;
  }

  return (
    <Routes>
      <Route path="/" element={<GafferHero />} />
      <Route path="/signup" element={<SignupQuiz />} />
      <Route path="/login" element={<Login />} />
      <Route path="/predict" element={<PredictionScreen />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="/talk" element={<Comments />} />
      <Route path="/feed" element={<Feed />} />
      <Route path="/hottakes" element={<HotTakes />} />
      <Route path="/challenges" element={<Challenges />} />
      <Route path="/groups" element={<Groups />} />
      <Route path="/groups/:groupId" element={<Groups />} />
      <Route path="/brackets" element={<Brackets />} />
      <Route path="/matchpredictions" element={<MatchPredictions />} />
      <Route path="/standings" element={<Standings />} />
      <Route path="/standings/:group" element={<Standings />} />
      <Route path="/gafferai" element={<GafferAI />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/profile/:username" element={<Profile />} />
      <Route path="/lineups" element={<Lineups />} />
      <Route path="/lineups/:matchId" element={<Lineups />} />
    </Routes>
  )
}
