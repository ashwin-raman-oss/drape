import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LifestyleGrid from '../components/onboarding/LifestyleGrid'
import { useUpsertProfile } from '../hooks/useProfile'
import MobileLayout from '../components/layout/MobileLayout'

export default function Onboarding({ userId }) {
  const [selected, setSelected] = useState([])
  const navigate = useNavigate()
  const { mutateAsync, isPending } = useUpsertProfile()

  async function handleContinue() {
    if (!selected.length) return
    await mutateAsync({ userId, lifestyleContext: selected })
    navigate('/')
  }

  return (
    <MobileLayout className="px-6 pt-16 pb-10">
      <h1 className="text-2xl font-light text-primary mb-2">Your typical week</h1>
      <p className="text-muted text-sm mb-8">
        Which of these are part of your life? Select all that apply — this shapes every recommendation.
      </p>

      <LifestyleGrid selected={selected} onChange={setSelected} />

      <div className="flex-1" />

      <button
        onClick={handleContinue}
        disabled={!selected.length || isPending}
        className="w-full bg-accent text-bg py-4 rounded-2xl font-medium tracking-wide mt-8 disabled:opacity-40"
      >
        {isPending ? 'Saving...' : 'Continue'}
      </button>
    </MobileLayout>
  )
}
