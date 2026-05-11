import { useState } from 'react'
import ItemPhoto from './ItemPhoto'
import { useAddReaction, useUpdateReaction } from '../../hooks/useOutfits'

const CATEGORIES = ['Top', 'Bottom', 'Shoes', 'Outer layer', 'All of it']

export default function OutfitLook({
  lookNumber, items, reason, look, occasion, weather,
  onSave, isSaving, isSaved, onFetchReplacement,
}) {
  const [reaction, setReaction] = useState(null)
  const [showItemPicker, setShowItemPicker] = useState(false)
  const [flaggedItems, setFlaggedItems] = useState([])
  const [reactionComment, setReactionComment] = useState('')
  const [isSubmittingReaction, setIsSubmittingReaction] = useState(false)
  const [isLoadingReplacement, setIsLoadingReplacement] = useState(false)
  const [visible, setVisible] = useState(true)
  const [logId, setLogId] = useState(null)

  const { mutateAsync: addReaction } = useAddReaction()
  const { mutateAsync: updateReaction } = useUpdateReaction()

  async function handleThumbsUp() {
    if (reaction) return
    setReaction('thumbs_up')
    try {
      await addReaction({ occasion, weather, itemIds: look.item_ids, reaction: 'thumbs_up', reactionItems: [], reactionComment: '' })
    } catch { /* silently fail — reaction is non-critical */ }
  }

  async function handleThumbsDown() {
    if (reaction) return
    setReaction('thumbs_down')
    setShowItemPicker(true)
    try {
      const log = await addReaction({ occasion, weather, itemIds: look.item_ids, reaction: 'thumbs_down', reactionItems: [], reactionComment: '' })
      setLogId(log.id)
    } catch { /* continue to show picker even if log fails */ }
  }

  function toggleCategory(cat) {
    if (cat === 'All of it') {
      setFlaggedItems(prev => prev.includes('All of it') ? [] : ['All of it'])
    } else {
      setFlaggedItems(prev => {
        const without = prev.filter(c => c !== 'All of it' && c !== cat)
        return prev.includes(cat) ? without : [...without, cat]
      })
    }
  }

  async function handleSubmitFeedback() {
    setIsSubmittingReaction(true)
    try {
      if (logId) {
        await updateReaction({ id: logId, reactionItems: flaggedItems, reactionComment })
      }
      setShowItemPicker(false)
      setVisible(false)
      await new Promise(resolve => setTimeout(resolve, 200))
      setIsLoadingReplacement(true)
      await onFetchReplacement(look, flaggedItems)
      setIsLoadingReplacement(false)
      setVisible(true)
    } catch {
      setIsLoadingReplacement(false)
      setVisible(true)
    } finally {
      setIsSubmittingReaction(false)
    }
  }

  if (isLoadingReplacement) {
    return (
      <div className="bg-surface card-shadow rounded-3xl px-5 pt-6 pb-5 space-y-4">
        <div className="border-b border-border/40 pb-3">
          <span className="text-xs tracking-widest uppercase font-medium text-muted">Look {lookNumber}</span>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="flex gap-4">
            <div className="w-24 h-32 bg-surface-2 rounded-2xl flex-shrink-0" />
            <div className="w-24 h-32 bg-surface-2 rounded-2xl flex-shrink-0" />
            <div className="w-24 h-32 bg-surface-2 rounded-2xl flex-shrink-0" />
          </div>
          <div className="h-4 bg-surface-2 rounded w-3/4" />
          <div className="h-4 bg-surface-2 rounded w-1/2" />
        </div>
        <p className="text-muted text-sm text-center">Finding a better look...</p>
      </div>
    )
  }

  return (
    <div className={`bg-surface card-shadow rounded-3xl px-5 pt-6 pb-5 space-y-4 transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      {/* Look label */}
      <div className="border-b border-border/40 pb-3">
        <span className="text-xs tracking-widest uppercase font-medium text-muted">Look {lookNumber}</span>
      </div>

      {/* Item photos — horizontal scroll */}
      <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-hide">
        {items.map(item => (
          <ItemPhoto key={item.id} item={item} />
        ))}
      </div>

      {/* Reason */}
      <p className="font-serif font-light italic text-lg text-muted leading-relaxed">{reason}</p>

      {/* Item picker (after 👎) or reaction row */}
      {showItemPicker ? (
        <div className="space-y-3">
          <p className="text-xs tracking-widest uppercase text-muted font-medium">What's not working?</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  flaggedItems.includes(cat)
                    ? 'border-accent text-accent'
                    : 'border-border text-muted'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <textarea
            value={reactionComment}
            onChange={e => setReactionComment(e.target.value)}
            placeholder="e.g. colours clash, too formal..."
            rows={2}
            className="w-full bg-transparent border-0 border-b border-border px-0 py-2 text-sm font-light text-primary placeholder:text-muted resize-none focus:outline-none focus:border-accent transition-colors"
          />
          <button
            type="button"
            onClick={handleSubmitFeedback}
            disabled={isSubmittingReaction}
            className="w-full bg-accent text-bg py-3 rounded-2xl text-sm font-medium tracking-widest uppercase disabled:opacity-40"
          >
            {isSubmittingReaction ? 'Submitting...' : 'Submit feedback'}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          {/* Thumbs up */}
          <button
            type="button"
            onClick={handleThumbsUp}
            disabled={!!reaction}
            className={`w-10 h-10 rounded-xl border flex items-center justify-center text-base flex-shrink-0 transition-colors disabled:opacity-60 ${
              reaction === 'thumbs_up' ? 'border-accent text-accent' : 'border-border'
            }`}
          >
            {reaction === 'thumbs_up' ? '✓' : '👍'}
          </button>
          {/* Thumbs down */}
          <button
            type="button"
            onClick={handleThumbsDown}
            disabled={!!reaction}
            className="w-10 h-10 rounded-xl border border-border flex items-center justify-center text-base flex-shrink-0 disabled:opacity-60"
          >
            👎
          </button>
          {/* Save */}
          {isSaved ? (
            <div className="flex-1 py-3 text-center text-accent uppercase tracking-widest text-xs font-medium">
              Saved ✓
            </div>
          ) : (
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="flex-1 border border-accent text-accent py-3 rounded-2xl uppercase tracking-widest text-xs font-medium disabled:opacity-40"
            >
              {isSaving ? 'Saving...' : 'Save this look'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
