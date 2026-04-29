import { useEffect } from 'react'
import { createPortal } from 'react-dom'

const FORMALITY_LABELS = { 1: 'Casual', 2: 'Smart casual', 3: 'Business', 4: 'Formal', 5: 'Black tie' }

export default function ItemDetailModal({ item, onClose }) {
  // Lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // Close on Escape
  useEffect(() => {
    function handleKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const tags = [
    item.brand || null,
    item.colour || null,
    item.formality ? FORMALITY_LABELS[item.formality] : null,
    item.item_type || null,
  ].filter(Boolean)

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.item_type}
      className="fixed inset-0 z-[100] bg-black/90 flex flex-col"
      onClick={onClose}
    >
      {/* Photo — edge-to-edge, with gradient + floating tag strip */}
      <div
        className="flex-1 relative min-h-0"
        onClick={e => e.stopPropagation()}
      >
        {/* Photo */}
        <div className="w-full h-full flex items-center justify-center">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={`${item.brand ? item.brand + ' ' : ''}${item.item_type}`}
              className="max-h-full w-full object-contain"
            />
          ) : (
            <div className="w-48 h-64 rounded-2xl bg-surface flex items-center justify-center">
              <span className="text-muted text-sm">No photo</span>
            </div>
          )}
        </div>

        {/* Gradient overlay at bottom */}
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

        {/* Floating tag pills over gradient */}
        {tags.length > 0 && (
          <div className="absolute bottom-4 inset-x-0 flex gap-2 overflow-x-auto scrollbar-hide px-6">
            {tags.map((tag, i) => (
              <span
                key={i}
                className="flex-shrink-0 bg-surface/80 backdrop-blur-sm text-primary text-xs px-3 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Close — full-width text button at bottom */}
      <div
        className="flex-shrink-0 pb-[calc(2rem+env(safe-area-inset-bottom))]"
        onClick={e => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="w-full text-white/50 text-xs tracking-widest uppercase py-4 text-center"
        >
          Close
        </button>
      </div>
    </div>,
    document.body
  )
}
