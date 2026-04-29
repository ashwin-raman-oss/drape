import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import MobileLayout from '../components/layout/MobileLayout'
import BottomNav from '../components/layout/BottomNav'
import OccasionGrid from '../components/home/OccasionGrid'
import { useFlowStore } from '../store/flowStore'

export default function Home() {
  const setOccasion = useFlowStore(s => s.setOccasion)
  const resetFlow = useFlowStore(s => s.resetFlow)
  const [text, setText] = useState('')
  const navigate = useNavigate()

  // Clear any stale flow state from a previous session
  useEffect(() => { resetFlow() }, [])

  function handlePreset(label) {
    setText(label)
  }

  function handleContinue() {
    const trimmed = text.trim()
    if (!trimmed) return
    setOccasion(trimmed)
    navigate('/weather')
  }

  return (
    <MobileLayout className="pb-nav">
      {/* Header */}
      <div className="px-6 pt-14 pb-6">
        <p className="text-muted text-sm tracking-widest uppercase font-medium mb-1">Good morning</p>
        <h1 className="font-serif text-3xl font-light leading-tight text-primary">What's the occasion?</h1>
      </div>

      {/* Preset grid */}
      <div className="px-6 mb-6">
        <OccasionGrid onSelect={handlePreset} selected={text} />
      </div>

      {/* Free text input */}
      <div className="px-6">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Or describe it yourself..."
          rows={2}
          className="w-full bg-transparent border-0 border-b border-border px-0 py-4 text-base font-light text-primary placeholder:text-muted resize-none focus:outline-none focus:border-accent transition-colors"
          aria-label="Occasion description"
        />
      </div>

      <div className="flex-1" />

      {/* CTA */}
      <div className="px-6 pb-6">
        <button
          type="button"
          onClick={handleContinue}
          disabled={!text.trim()}
          className="w-full bg-accent text-bg py-4 rounded-2xl text-sm font-medium tracking-widest uppercase disabled:opacity-40"
        >
          Next
        </button>
      </div>

      <BottomNav />
    </MobileLayout>
  )
}
