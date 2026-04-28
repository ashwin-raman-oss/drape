import { useNavigate } from 'react-router-dom'
import MobileLayout from '../components/layout/MobileLayout'

export default function WardrobeIntro() {
  const navigate = useNavigate()

  return (
    <MobileLayout className="px-6 pt-20 pb-10 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
        <p className="text-4xl" aria-hidden="true">👔</p>
        <h1 className="text-2xl font-light text-primary">You're all set.</h1>
        <p className="text-muted text-sm leading-relaxed max-w-xs">
          Now let's build your wardrobe. Add your first piece of clothing so Drape can start recommending outfits.
        </p>
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => navigate('/upload')}
          className="w-full bg-accent text-bg py-4 rounded-2xl font-medium tracking-wide"
        >
          Add your first item
        </button>
        <button
          type="button"
          aria-label="Skip wardrobe setup and go to home"
          onClick={() => navigate('/')}
          className="w-full text-muted text-sm py-3"
        >
          I'll do this later
        </button>
      </div>
    </MobileLayout>
  )
}
