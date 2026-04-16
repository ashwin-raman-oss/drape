import { useState, useEffect } from 'react'
import MobileLayout from '../components/layout/MobileLayout'
import BottomNav from '../components/layout/BottomNav'
import LifestyleGrid from '../components/onboarding/LifestyleGrid'
import { useProfile, useUpsertProfile } from '../hooks/useProfile'
import { supabase } from '../lib/supabase'

export default function Settings({ userId }) {
  const { data: profile } = useProfile(userId)
  const { mutateAsync: upsertProfile, isPending } = useUpsertProfile()
  const [selected, setSelected] = useState([])
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (profile?.lifestyle_context) setSelected(profile.lifestyle_context)
  }, [profile])

  async function handleSave() {
    await upsertProfile({ userId, lifestyleContext: selected })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  return (
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

      <BottomNav />
    </MobileLayout>
  )
}
