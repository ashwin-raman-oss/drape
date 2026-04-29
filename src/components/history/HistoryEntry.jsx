import { useState, useRef, useEffect } from 'react'
import { useUpdateOutfitLog, useDeleteOutfitLog } from '../../hooks/useOutfits'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'

export default function HistoryEntry({ log, wardrobeItems }) {
  const { mutateAsync: updateLog } = useUpdateOutfitLog()
  const { mutateAsync: deleteLog, isPending: isDeleting } = useDeleteOutfitLog()
  const { session } = useAuth()
  const [comment, setComment] = useState(log.comment ?? '')
  const [showRating, setShowRating] = useState(false)
  const [actionError, setActionError] = useState(null)
  const [confirming, setConfirming] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  function handleDeleteClick() {
    if (confirming) {
      clearTimeout(timerRef.current)
      timerRef.current = null
      setConfirming(false)
      deleteLog(log.id).catch(() => setActionError('Could not remove. Try again.'))
    } else {
      setConfirming(true)
      timerRef.current = setTimeout(() => {
        setConfirming(false)
        timerRef.current = null
      }, 2000)
    }
  }

  const items = (log.item_ids ?? [])
    .map(id => wardrobeItems.find(w => w.id === id))
    .filter(Boolean)

  async function markWorn() {
    setActionError(null)
    try {
      const wornAt = new Date().toISOString()
      await updateLog({ id: log.id, worn_at: wornAt })

      // Backfill last_worn_at on each wardrobe item in this outfit
      const itemIds = log.item_ids ?? []
      if (itemIds.length > 0 && session?.user?.id) {
        await supabase
          .from('wardrobe_items')
          .update({ last_worn_at: wornAt })
          .in('id', itemIds)
          .eq('user_id', session.user.id)
      }

      setShowRating(true)
    } catch {
      setActionError('Could not update. Try again.')
    }
  }

  async function rate(rating) {
    setActionError(null)
    try {
      await updateLog({ id: log.id, rating, comment })
      setShowRating(false)
    } catch {
      setActionError('Could not save rating. Try again.')
    }
  }

  async function saveComment() {
    if (log.rating !== null && log.rating !== undefined) {
      await updateLog({ id: log.id, rating: log.rating, comment })
    }
  }

  const isWorn = !!log.worn_at
  const isRated = log.rating !== null && log.rating !== undefined

  return (
    <div className="bg-surface card-shadow rounded-2xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-primary text-sm font-medium">{log.occasion}</p>
          <p className="text-muted text-xs">{log.weather} · {new Date(log.created_at).toLocaleDateString()}</p>
        </div>

        {!isWorn && (
          <button type="button" onClick={markWorn} className="text-xs text-accent border border-accent px-3 py-1 rounded-lg flex-shrink-0">
            Mark worn
          </button>
        )}
        {isWorn && !isRated && !showRating && (
          <button type="button" onClick={() => setShowRating(true)} className="text-xs text-accent border border-accent px-3 py-1 rounded-lg flex-shrink-0">
            Rate this look
          </button>
        )}
        {isWorn && isRated && (
          <span className="text-xs text-muted border border-border px-2 py-1 rounded-lg flex-shrink-0">
            {log.rating === 1 ? '👍' : '👎'}
          </span>
        )}
      </div>

      {/* Item thumbnails */}
      {items.length > 0 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {items.map(item => (
            <div key={item.id} className="w-14 h-20 rounded-xl overflow-hidden flex-shrink-0 border border-border">
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

      {actionError && <p className="text-red-400 text-xs">{actionError}</p>}

      {/* Rating form — shown after mark worn or tapping Rate this look */}
      {(isWorn && showRating) || (isWorn && isRated) ? (
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
      ) : null}

      {/* Delete — unobtrusive; turns red only on confirm state */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleDeleteClick}
          disabled={isDeleting}
          className={`text-xs px-3 py-1 rounded-lg border transition-colors disabled:opacity-40 ${
            confirming
              ? 'border-red-900/40 text-red-400'
              : 'border-transparent text-muted'
          }`}
        >
          {isDeleting ? 'Removing...' : confirming ? 'Confirm delete' : 'Remove'}
        </button>
      </div>
    </div>
  )
}
