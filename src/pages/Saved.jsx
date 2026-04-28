import { useNavigate } from 'react-router-dom'
import MobileLayout from '../components/layout/MobileLayout'
import BottomNav from '../components/layout/BottomNav'
import { useSavedLooks } from '../hooks/useOutfits'
import { useWardrobe } from '../hooks/useWardrobe'

export default function Saved() {
  const { data: looks = [], isLoading } = useSavedLooks()
  const { data: wardrobe = [] } = useWardrobe()
  const navigate = useNavigate()

  const wardrobeById = new Map(wardrobe.map(item => [item.id, item]))

  return (
    <MobileLayout className="pb-nav">
      <div className="px-6 pt-14 pb-4">
        <h1 className="text-2xl font-light text-primary">Saved looks</h1>
        <p className="text-muted text-sm">Outfits you've saved from recommendations.</p>
      </div>

      <div className="px-6 space-y-4 pb-6">
        {isLoading && (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && looks.length === 0 && (
          <div className="bg-surface border border-border rounded-3xl p-8 text-center mt-4 space-y-3">
            <p className="text-muted text-sm leading-relaxed">
              Looks you save from recommendations will appear here.
            </p>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-accent text-sm"
            >
              Get a recommendation
            </button>
          </div>
        )}

        {looks.map(look => {
          const items = (look.item_ids ?? [])
            .map(id => wardrobeById.get(id))
            .filter(Boolean)

          return (
            <div key={look.id} className="bg-surface border border-border rounded-3xl p-5 space-y-3">
              <div>
                <p className="text-primary text-sm font-medium">{look.occasion}</p>
                <p className="text-muted text-xs">{look.weather} · {new Date(look.created_at).toLocaleDateString()}</p>
              </div>

              {/* Item thumbnails — horizontal scroll */}
              <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                {items.map(item => (
                  <div key={item.id} className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div className="w-20 h-28 rounded-2xl overflow-hidden bg-bg border border-border">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.item_type} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-muted text-xs">—</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted text-center w-20 truncate">{item.item_type}</p>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <BottomNav />
    </MobileLayout>
  )
}
