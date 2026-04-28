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
import WardrobeIntro from './pages/WardrobeIntro'
import History from './pages/History'
import Settings from './pages/Settings'
import Saved from './pages/Saved'

export default function App() {
  const { session, loading: authLoading } = useAuth()
  // Fire profile fetch in parallel with auth check — enabled guard prevents premature fetch
  const { data: profile, isLoading: profileLoading, isError: profileError } = useProfile(session?.user?.id)

  // Show blank screen while auth resolves, or while profile fetches for an authenticated user
  if (authLoading || (session && profileLoading)) {
    return <div className="min-h-screen bg-bg" />
  }

  if (!session) {
    return (
      <Routes>
        <Route path="*" element={<Auth />} />
      </Routes>
    )
  }

  // Profile fetch failed — surface an actionable error
  if (profileError) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 text-center gap-4">
        <p className="text-red-400 text-sm">Failed to load your profile. Please refresh or sign out.</p>
        <button
          onClick={() => window.location.reload()}
          className="text-accent text-sm"
        >
          Refresh
        </button>
      </div>
    )
  }

  // First time — no profile or empty lifestyle context
  if (!profile || !profile.lifestyle_context?.length) {
    return (
      <Routes>
        <Route path="/onboarding" element={<Onboarding userId={session.user.id} />} />
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
      <Route path="/wardrobe-intro" element={<WardrobeIntro />} />
      <Route path="/saved" element={<Saved />} />
      <Route path="/history" element={<History />} />
      <Route path="/settings" element={<Settings userId={session.user.id} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
