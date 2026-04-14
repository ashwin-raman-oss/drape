import { useState } from 'react'
import { useUpdateOutfitLog } from '../../hooks/useOutfits'

export default function HistoryEntry({ log, wardrobeItems }) {
  const { mutateAsync: updateLog } = useUpdateOutfitLog()
  const [comment, setComment] = useState(log.comment ?? '')
  const [showRating, setShowRating] = useState(false)

  const items = (log.item_ids ?? [])
    .map(id => wardrobeItems.find(w => w.id === id))
    .filter(Boolean)

  async function markWorn() {
    await updateLog({ id: log.id, worn_at: new Date().toISOString() })
    setShowRating(true)
  }

  async function rate(rating) {
    await updateLog({ id: log.id, rating, comment })
    setShowRating(false)
  }

  async function saveComment() {
    if (log.rating) {
      await updateLog({ id: log.id, rating: log.rating, comment })
    }
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-primary text-sm font-medium">{log.occasion}</p>
          <p className="text-muted text-xs">{log.weather} · {new Date(log.created_at).toLocaleDateString()}</p>
        </div>
        {log.worn_at ? (
          <span className="text-xs text-muted border border-border px-2 py-1 rounded-lg">Worn</span>
        ) : (
          <button type="button" onClick={markWorn} className="text-xs text-accent border border-accent px-3 py-1 rounded-lg">
            Mark worn
          </button>
        )}
      </div>

      {/* Item thumbnails */}
      {items.length > 0 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {items.map(item => (
            <div key={item.id} className="w-14 h-[72px] rounded-xl overflow-hidden flex-shrink-0 border border-border">
              {item.image_url ? (
                <img src={item.image_url} alt={item.item_type} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-surface">
                  <span className="text-muted text-[10px]">—</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Rating — shown after mark worn, or if already worn */}
      {(log.worn_at || showRating) && (
        <div className="flex items-center gap-3">
          {[{ val: 1, emoji: '👍' }, { val: -1, emoji: '👎' }].map(({ val, emoji }) => (
            <button
              key={val}
              type="button"
              onClick={() => rate(val)}
              className={`text-xl px-3 py-1 rounded-xl border transition-colors ${
                log.rating === val ? 'border-accent' : 'border-border opacity-50'
              }`}
            >
              {emoji}
            </button>
          ))}
          <input
            value={comment}
            onChange={e => setComment(e.target.value)}
            onBlur={saveComment}
            placeholder="Comment..."
            className="flex-1 bg-transparent text-xs text-muted border-b border-border focus:outline-none focus:border-accent py-1"
          />
        </div>
      )}
    </div>
  )
}
