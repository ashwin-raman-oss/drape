import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import MobileLayout from '../components/layout/MobileLayout'
import BottomNav from '../components/layout/BottomNav'
import OccasionGrid from '../components/home/OccasionGrid'
import { useFlowStore } from '../store/flowStore'
import { classifyOccasion } from '../lib/claude'

export default function Home() {
  const setOccasion = useFlowStore(s => s.setOccasion)
  const resetFlow = useFlowStore(s => s.resetFlow)
  const [text, setText] = useState('')
  const [isClassifying, setIsClassifying] = useState(false)
  const navigate = useNavigate()
  const textareaRef = useRef(null)

  useEffect(() => { resetFlow() }, [])
  useEffect(() => { textareaRef.current?.focus() }, [])

  function handlePreset(label) {
    setText(prev => {
      const trimmed = prev.trim()
      return trimmed ? `${trimmed}, ${label}` : label
    })
  }

  async function handleContinue() {
    const trimmed = text.trim()
    if (!trimmed || isClassifying) return
    setOccasion(trimmed)
    setIsClassifying(true)
    const venueType = await classifyOccasion(trimmed)
    setIsClassifying(false)
    if (venueType === 'outdoor') navigate('/weather')
    else if (venueType === 'indoor') navigate('/outdoor-check')
    else navigate('/ambiguous-check')
  }

  return (
    <MobileLayout className="pb-nav">
      {/* Header */}
      <div className="px-6 pt-14 pb-6">
        <p className="text-muted text-sm tracking-widest uppercase font-medium mb-1">Good morning</p>
        <h1 className="font-serif text-3xl font-light leading-tight text-primary">What's the occasion?</h1>
      </div>

      {/* Primary textarea */}
      <div className="px-6">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Describe your day — where are you going, what's the vibe?"
          className="w-full bg-transparent border-0 border-b border-border px-0 py-4 text-base font-light text-primary placeholder:text-muted resize-none focus:outline-none focus:border-accent transition-colors min-h-[120px]"
          aria-label="Occasion description"
        />
      </div>

      {/* Quick picks */}
      <p className="px-6 text-xs tracking-widest uppercase text-muted mt-6 mb-3">Quick picks</p>
      <div className="px-6">
        <OccasionGrid onSelect={handlePreset} />
      </div>

      <div className="flex-1" />

      {/* CTA */}
      <div className="px-6 pb-6">
        <button
          type="button"
          onClick={handleContinue}
          disabled={!text.trim() || isClassifying}
          className="w-full bg-accent text-bg py-4 rounded-2xl text-sm font-medium tracking-widest uppercase disabled:opacity-40"
        >
          {isClassifying ? 'Thinking...' : 'Next'}
        </button>
      </div>

      <BottomNav />
    </MobileLayout>
  )
}
