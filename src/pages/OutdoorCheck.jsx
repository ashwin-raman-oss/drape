import { useNavigate } from 'react-router-dom'
import MobileLayout from '../components/layout/MobileLayout'
import { useFlowStore } from '../store/flowStore'

export default function OutdoorCheck() {
  const occasion = useFlowStore(s => s.occasion)
  const setOutdoorTravel = useFlowStore(s => s.setOutdoorTravel)
  const navigate = useNavigate()

  if (!occasion) {
    navigate('/', { replace: true })
    return null
  }

  function handleSelect(willBeOutside) {
    setOutdoorTravel(willBeOutside)
    navigate(willBeOutside ? '/weather' : '/recommendations')
  }

  return (
    <MobileLayout className="px-6 pt-14">
      <button type="button" onClick={() => navigate(-1)} className="text-muted text-sm mb-8">← Back</button>

      <h1 className="text-2xl font-serif font-light tracking-wide text-primary mb-4">One quick thing</h1>
      <p className="text-muted text-sm mb-10">Your event sounds like it's indoors. Will you be spending any time outside getting there?</p>

      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => handleSelect(true)}
          className="w-full bg-surface-2 rounded-2xl py-6 text-primary font-medium text-sm active:bg-border transition-colors"
        >
          Yes — I'll be outside for a bit
        </button>
        <button
          type="button"
          onClick={() => handleSelect(false)}
          className="w-full bg-surface-2 rounded-2xl py-6 text-primary font-medium text-sm active:bg-border transition-colors"
        >
          No — straight indoors
        </button>
      </div>
    </MobileLayout>
  )
}
