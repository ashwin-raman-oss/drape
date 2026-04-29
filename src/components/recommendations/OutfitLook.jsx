import ItemPhoto from './ItemPhoto'

export default function OutfitLook({ lookNumber, items, reason, onSave, isSaving, isSaved }) {
  return (
    <div className="bg-surface card-shadow rounded-3xl px-5 pt-6 pb-5 space-y-4">
      {/* Look label + separator */}
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

      {/* Save */}
      {isSaved ? (
        <div className="w-full py-3 text-center text-accent uppercase tracking-widest text-xs font-medium">
          Saved ✓
        </div>
      ) : (
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="w-full border border-accent text-accent py-3 rounded-2xl uppercase tracking-widest text-xs font-medium disabled:opacity-40"
        >
          {isSaving ? 'Saving...' : 'Save this look'}
        </button>
      )}
    </div>
  )
}
