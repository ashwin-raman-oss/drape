import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useProfile } from './hooks/useProfile'
import Auth from './pages/Auth'
import Onboarding from './pages/Onboarding'
import Home from './pages/Home'
import Weather from './pages/Weather'
import Recommendations from './pages/Recommendations'
import Wardrobe from './pages/Wardrobe'
import Upload from './pages/Upload'
import History from './pages/History'
import Settings from './pages/Settings'

function ProtectedApp({ userId }) {
  const { data: profile, isLoading } = useProfile(userId)

  if (isLoading) {
    return <div className="min-h-screen bg-bg flex items-center justify-center text-muted text-sm">Loading...</div>
  }

  // First time: no profile or empty lifestyle context → onboarding
  if (!profile || !profile.lifestyle_context?.length) {
    return (
      <Routes>
        <Route path="/onboarding" element={<Onboarding userId={userId} />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/weather" element={<Weather />} />
      <Route path="/recommendations" element={<Recommendations />} />
      <Route path="/wardrobe" element={<Wardrobe />} />
      <Route path="/upload" element={<Upload />} />
      <Route path="/history" element={<History />} />
      <Route path="/settings" element={<Settings userId={userId} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  const { session, loading } = useAuth()

  if (loading) {
    return <div className="min-h-screen bg-bg" />
  }

  if (!session) {
    return (
      <Routes>
        <Route path="*" element={<Auth />} />
      </Routes>
    )
  }

  return <ProtectedApp userId={session.user.id} />
}
