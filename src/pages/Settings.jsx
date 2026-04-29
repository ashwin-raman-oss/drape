import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import MobileLayout from '../components/layout/MobileLayout'
import BottomNav from '../components/layout/BottomNav'
import LifestyleGrid from '../components/onboarding/LifestyleGrid'
import { useProfile, useUpsertProfile } from '../hooks/useProfile'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import { supabase } from '../lib/supabase'

function UnsavedModal({ onLeave, onStay }) {
  const leaveRef = useRef(null)

  useEffect(() => {
    const prev = document.activeElement
    leaveRef.current?.focus()
    return () => { prev?.focus() }
  }, [])

  function handleKeyDown(e) {
    if (e.key === 'Escape') { e.preventDefault(); onLeave() }
    if (e.key !== 'Tab') return
    const all = Array.from(document.querySelectorAll('[data-unsaved-modal]'))
    if (!all.length) return
    const first = all[0]
    const last = all[all.length - 1]
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 z-[60] flex items-end justify-center p-4"
      onKeyDown={handleKeyDown}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="unsaved-modal-title"
        className="bg-surface border border-border rounded-3xl p-6 w-full max-w-md space-y-4"
      >
        <h3 id="unsaved-modal-title" className="text-primary font-medium text-base">Unsaved changes</h3>
        <p className="text-muted text-sm">You have unsaved changes. Leave without saving?</p>
        <div className="space-y-3 pt-1">
          <button
            ref={leaveRef}
            data-unsaved-modal
            type="button"
            onClick={onLeave}
            className="w-full border border-border text-muted py-4 rounded-2xl text-sm"
          >
            Leave
          </button>
          <button
            data-unsaved-modal
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
  const { session } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { data: profile } = useProfile(userId)
  const { mutateAsync: upsertProfile, isPending } = useUpsertProfile()
  const [selected, setSelected] = useState([])
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [pendingNav, setPendingNav] = useState(null) // path to navigate to if user confirms leave

  useEffect(() => {
    if (profile?.lifestyle_context) setSelected(profile.lifestyle_context)
  }, [profile])

  useEffect(() => {
    if (!saved) return
    const id = setTimeout(() => setSaved(false), 3000)
    return () => clearTimeout(id)
  }, [saved])

  const savedContext = profile?.lifestyle_context ?? []
  const isDirty =
    selected.length !== savedContext.length ||
    selected.some(s => !savedContext.includes(s))

  async function handleSave() {
    setSaveError(null)
    try {
      await upsertProfile({ userId, lifestyleContext: selected })
      setSaved(true)
      if (pendingNav) {
        navigate(pendingNav)
        setPendingNav(null)
      }
    } catch {
      setSaveError('Could not save changes. Please try again.')
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
          <h1 className="text-2xl font-serif font-light tracking-wide text-primary mb-1">Settings</h1>
        </div>

        <div className="px-6 space-y-8 pb-6">
          {/* Account */}
          <div className="pb-6 border-b border-border">
            <h2 className="text-xs text-muted tracking-widest uppercase mb-2">Account</h2>
            <p className="text-primary text-sm">{session?.user?.email}</p>
          </div>

          {/* Appearance — theme toggle */}
          <div className="pb-6 border-b border-border">
            <h2 className="text-xs text-muted tracking-widest uppercase mb-3">Appearance</h2>
            <div className="flex border border-border rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => theme === 'dark' && toggleTheme()}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm transition-colors ${
                  theme === 'light' ? 'text-accent border-r border-accent/40 bg-accent/10' : 'text-muted border-r border-border'
                }`}
              >
                ☀️ Light
              </button>
              <button
                type="button"
                onClick={() => theme === 'light' && toggleTheme()}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm transition-colors ${
                  theme === 'dark' ? 'text-accent bg-accent/10' : 'text-muted'
                }`}
              >
                🌙 Dark
              </button>
            </div>
          </div>

          <div>
            <h2 className="text-xs text-muted tracking-widest uppercase mb-2">Lifestyle context</h2>
            <p className="text-muted text-sm mb-4">These selections tell Drape about your weekly life. They shape how Claude calibrates formality and occasion matching in every outfit recommendation. Update them whenever your routine changes.</p>
            <LifestyleGrid selected={selected} onChange={setSelected} />
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="w-full mt-4 border border-accent text-accent py-3 rounded-2xl text-sm disabled:opacity-40"
            >
              {saved ? 'Saved ✓' : isPending ? 'Saving...' : 'Save changes'}
            </button>
            {saveError && <p className="text-red-400 text-xs mt-2">{saveError}</p>}
          </div>

          <div className="border-t border-border pt-6">
            <button type="button" onClick={handleSignOut} className="text-muted text-sm">Sign out</button>
          </div>
        </div>

        <BottomNav onNavAttempt={handleNavAttempt} />
      </MobileLayout>

      {pendingNav && (
        <UnsavedModal
          onLeave={() => { navigate(pendingNav); setPendingNav(null) }}
          onStay={async () => { setPendingNav(null); await handleSave() }}
        />
      )}
    </>
  )
}
