import ItemPhoto from './ItemPhoto'

export default function OutfitLook({ lookNumber, items, reason, onSave, isSaving, isSaved }) {
  return (
    <div className="bg-surface card-shadow rounded-3xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted tracking-widest uppercase">Look {lookNumber}</span>
      </div>

      {/* Item photos — horizontal scroll on small screens */}
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {items.map(item => (
          <ItemPhoto key={item.id} item={item} />
        ))}
      </div>

      {/* Reason */}
      <p className="font-serif font-light italic text-base text-muted leading-relaxed">{reason}</p>

      {/* Save — persists to Saved ✓ once saved */}
      {isSaved ? (
        <div className="w-full py-3 text-center text-accent text-sm font-medium tracking-wide">
          Saved ✓
        </div>
      ) : (
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="w-full border border-accent text-accent py-3 rounded-2xl text-sm font-medium tracking-wide disabled:opacity-40"
        >
          {isSaving ? 'Saving...' : 'Save this look'}
        </button>
      )}
    </div>
  )
}
