import { useNavigate } from 'react-router-dom'
import MobileLayout from '../components/layout/MobileLayout'
import { useFlowStore } from '../store/flowStore'

const WEATHER_OPTIONS = [
  { key: 'Warm',  emoji: '☀️', label: 'Warm',  sub: '20°C+' },
  { key: 'Mild',  emoji: '🌤️', label: 'Mild',  sub: '12–20°C' },
  { key: 'Cold',  emoji: '🧥', label: 'Cold',  sub: 'Below 12°C' },
  { key: 'Rainy', emoji: '🌧️', label: 'Rainy', sub: 'Any temp' },
]

export default function Weather() {
  // Separate selectors avoid creating a new object on every render (rerender-no-inline-components)
  const occasion = useFlowStore(s => s.occasion)
  const setWeather = useFlowStore(s => s.setWeather)
  const navigate = useNavigate()

  // Guard: if user lands here without an occasion (direct URL / browser history), send back to Home
  if (!occasion) {
    navigate('/', { replace: true })
    return null
  }

  function handleSelect(key) {
    setWeather(key)
    navigate('/recommendations')
  }

  return (
    <MobileLayout className="px-6 pt-14">
      {/* Back */}
      <button type="button" onClick={() => navigate(-1)} className="text-muted text-sm mb-8">← Back</button>

      <p className="text-muted text-xs tracking-widest uppercase mb-1">{occasion}</p>
      <h1 className="text-2xl font-serif font-light tracking-wide text-primary mb-10">What's the weather like?</h1>

      <div className="grid grid-cols-2 gap-4">
        {WEATHER_OPTIONS.map(opt => (
          <button
            key={opt.key}
            type="button"
            aria-label={`${opt.label} — ${opt.sub}`}
            onClick={() => handleSelect(opt.key)}
            className="bg-surface border border-border rounded-3xl py-8 flex flex-col items-center gap-2 active:bg-border transition-colors"
          >
            <span className="text-5xl">{opt.emoji}</span>
            <span className="text-primary font-medium">{opt.label}</span>
            <span className="text-muted text-xs">{opt.sub}</span>
          </button>
        ))}
      </div>
    </MobileLayout>
  )
}
