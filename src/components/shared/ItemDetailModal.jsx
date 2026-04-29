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
      className="fixed inset-0 z-[100] bg-black/80 flex flex-col"
      onClick={onClose}
    >
      {/* Close button */}
      <div className="flex justify-end p-4 flex-shrink-0">
        <button
          type="button"
          aria-label="Close"
          onClick={e => { e.stopPropagation(); onClose() }}
          className="text-white text-base leading-none w-9 h-9 flex items-center justify-center rounded-full bg-white/10"
        >
          ✕
        </button>
      </div>

      {/* Photo — object-contain so full garment is visible */}
      <div
        className="flex-1 flex items-center justify-center px-6 min-h-0"
        onClick={e => e.stopPropagation()}
      >
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={`${item.brand ? item.brand + ' ' : ''}${item.item_type}`}
            className="max-h-full max-w-full object-contain rounded-2xl"
          />
        ) : (
          <div className="w-48 h-64 rounded-2xl bg-surface border border-border flex items-center justify-center">
            <span className="text-muted text-sm">No photo</span>
          </div>
        )}
      </div>

      {/* Tag strip */}
      <div
        className="flex-shrink-0 px-6 py-5 flex gap-2 flex-wrap"
        onClick={e => e.stopPropagation()}
      >
        {tags.map((tag, i) => (
          <span key={i} className="border border-white/20 text-white/70 text-xs px-3 py-1 rounded-full">
            {tag}
          </span>
        ))}
      </div>
    </div>,
    document.body
  )
}
