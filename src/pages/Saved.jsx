import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import MobileLayout from '../components/layout/MobileLayout'
import BottomNav from '../components/layout/BottomNav'
import { useSavedLooks, useDeleteSavedLook } from '../hooks/useOutfits'
import { useWardrobe } from '../hooks/useWardrobe'
import ItemDetailModal from '../components/shared/ItemDetailModal'

function SavedLookCard({ look, items, onDelete, isDeleting }) {
  const [confirming, setConfirming] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const timerRef = useRef(null)

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  function handleDeleteClick() {
    if (confirming) {
      clearTimeout(timerRef.current)
      timerRef.current = null
      setConfirming(false)
      onDelete()
    } else {
      setConfirming(true)
      timerRef.current = setTimeout(() => {
        setConfirming(false)
        timerRef.current = null
      }, 2000)
    }
  }

  return (
    <>
    <div className="py-5 border-b border-border/30 relative">
      {/* ✕ delete — top-right, two-tap confirmation */}
      <button
        type="button"
        onClick={handleDeleteClick}
        disabled={isDeleting}
        className={`absolute top-5 right-0 text-xs transition-colors disabled:opacity-40 ${
          confirming ? 'text-red-400' : 'text-muted'
        }`}
      >
        {isDeleting ? '…' : confirming ? 'Confirm' : '✕'}
      </button>

      {/* Header */}
      <div className="pr-8">
        <p className="text-xs tracking-widest uppercase text-muted font-medium mb-1">
          {new Date(look.created_at).toLocaleDateString()}
        </p>
        <p className="font-serif text-lg font-light text-primary">{look.occasion}</p>
        <p className="text-xs text-muted mt-0.5">{look.weather}</p>
      </div>

      {/* Item thumbnails — horizontal scroll */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide mt-3">
        {items.map(item => (
          <div
            key={item.id}
            className="w-14 h-24 rounded-2xl overflow-hidden flex-shrink-0 bg-surface-2 cursor-pointer"
            onClick={() => setSelectedItem(item)}
          >
            {item.image_url ? (
              <img src={item.image_url} alt={item.item_type} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-muted text-[10px]">—</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>

    {selectedItem && (
      <ItemDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
    )}
    </>
  )
}

export default function Saved() {
  const { data: looks = [], isLoading } = useSavedLooks()
  const { data: wardrobe = [] } = useWardrobe()
  const { mutateAsync: deleteLook, isPending: isDeleting, variables: deletingId } = useDeleteSavedLook()
  const navigate = useNavigate()

  const wardrobeById = new Map(wardrobe.map(item => [item.id, item]))

  return (
    <MobileLayout className="pb-nav">
      <div className="px-6 pt-14 pb-4">
        <h1 className="text-2xl font-serif font-light tracking-wide text-primary">Saved looks</h1>
        <p className="text-muted text-sm">Outfits you've saved from recommendations.</p>
      </div>

      <div className="px-6 pb-6">
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
            <SavedLookCard
              key={look.id}
              look={look}
              items={items}
              onDelete={() => deleteLook(look.id)}
              isDeleting={isDeleting && deletingId === look.id}
            />
          )
        })}
      </div>

      <BottomNav />
    </MobileLayout>
  )
}
