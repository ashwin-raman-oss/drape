import { useNavigate } from 'react-router-dom'
import MobileLayout from '../components/layout/MobileLayout'
import { useFlowStore } from '../store/flowStore'

export default function AmbiguousCheck() {
  const occasion = useFlowStore(s => s.occasion)
  const setVenueType = useFlowStore(s => s.setVenueType)
  const navigate = useNavigate()

  if (!occasion) {
    navigate('/', { replace: true })
    return null
  }

  return (
    <MobileLayout className="px-6 pt-14">
      <button type="button" onClick={() => navigate(-1)} className="text-muted text-sm mb-8">← Back</button>

      <h1 className="text-2xl font-serif font-light tracking-wide text-primary mb-4">Quick question</h1>
      <p className="text-muted text-sm mb-10">Will you mainly be indoors or outdoors?</p>

      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => { setVenueType('indoor'); navigate('/outdoor-check') }}
          className="w-full bg-surface-2 rounded-2xl py-6 text-primary font-medium text-sm active:bg-border transition-colors"
        >
          Mainly indoors
        </button>
        <button
          type="button"
          onClick={() => { setVenueType('outdoor'); navigate('/weather') }}
          className="w-full bg-surface-2 rounded-2xl py-6 text-primary font-medium text-sm active:bg-border transition-colors"
        >
          Mainly outdoors
        </button>
      </div>
    </MobileLayout>
  )
}
