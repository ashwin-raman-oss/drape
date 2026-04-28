import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import MobileLayout from '../components/layout/MobileLayout'
import BottomNav from '../components/layout/BottomNav'
import LifestyleGrid from '../components/onboarding/LifestyleGrid'
import { useProfile, useUpsertProfile } from '../hooks/useProfile'
import { supabase } from '../lib/supabase'

function UnsavedModal({ onLeave, onStay }) {
  return (
    <div className="fixed inset-0 bg-black/80 z-[60] flex items-end justify-center p-4">
      <div className="bg-surface border border-border rounded-3xl p-6 w-full max-w-md space-y-4">
        <h3 className="text-primary font-medium text-base">Unsaved changes</h3>
        <p className="text-muted text-sm">You have unsaved changes. Leave without saving?</p>
        <div className="space-y-3 pt-1">
          <button
            type="button"
            onClick={onLeave}
            className="w-full border border-border text-muted py-4 rounded-2xl text-sm"
          >
            Leave
          </button>
          <button
            type="button"
            onClick={onStay}
            className="w-full bg-accent text-bg py-4 rounded-2xl text-sm font-medium"
          >
            Stay and save
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Settings({ userId }) {
  const navigate = useNavigate()
  const { data: profile } = useProfile(userId)
  const { mutateAsync: upsertProfile, isPending } = useUpsertProfile()
  const [selected, setSelected] = useState([])
  const [saved, setSaved] = useState(false)
  const [pendingNav, setPendingNav] = useState(null) // path to navigate to if user confirms leave

  useEffect(() => {
    if (profile?.lifestyle_context) setSelected(profile.lifestyle_context)
  }, [profile])

  const savedContext = profile?.lifestyle_context ?? []
  const isDirty =
    selected.length !== savedContext.length ||
    selected.some(s => !savedContext.includes(s))

  async function handleSave() {
    await upsertProfile({ userId, lifestyleContext: selected })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    if (pendingNav) {
      navigate(pendingNav)
      setPendingNav(null)
    }
  }

  function handleNavAttempt(path) {
    if (isDirty) {
      setPendingNav(path)
    } else {
      navigate(path)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  return (
    <>
      <MobileLayout className="pb-nav">
        <div className="px-6 pt-14 pb-4">
          <h1 className="text-2xl font-light text-primary mb-1">Settings</h1>
        </div>

        <div className="px-6 space-y-8 pb-6">
          <div>
            <h2 className="text-xs text-muted tracking-widest uppercase mb-4">Lifestyle context</h2>
            <LifestyleGrid selected={selected} onChange={setSelected} />
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="w-full mt-4 border border-accent text-accent py-3 rounded-2xl text-sm disabled:opacity-40"
            >
              {saved ? 'Saved ✓' : isPending ? 'Saving...' : 'Save changes'}
            </button>
          </div>

          <div className="border-t border-border pt-6">
            <button type="button" onClick={handleSignOut} className="text-muted text-sm">Sign out</button>
          </div>
        </div>

        <BottomNav onNavAttempt={isDirty ? handleNavAttempt : null} />
      </MobileLayout>

      {pendingNav && (
        <UnsavedModal
          onLeave={() => { navigate(pendingNav); setPendingNav(null) }}
          onStay={() => { setPendingNav(null); handleSave() }}
        />
      )}
    </>
  )
}
