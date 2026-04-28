const CATEGORIES = ['Top', 'Bottom', 'Shoes', 'Outer layer']
const CONDITION_FLAGS = ['Casual only', 'Cold weather only', 'Formal only', 'Handle with care']

function Field({ label, value, onChange, type = 'text' }) {
  const id = label.toLowerCase().replace(/\s+/g, '-')
  return (
    <div>
      <label htmlFor={id} className="text-xs text-muted tracking-wide uppercase mb-1 block">{label}</label>
      <input
        id={id}
        type={type}
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-primary text-sm focus:outline-none focus:border-accent"
      />
    </div>
  )
}

export default function UploadStep3({
  tags, onTagChange,
  personalNotes, onPersonalNotes,
  conditionFlags, onConditionFlags,
  onSave, isSaving,
  tagError, onDismissTagError, onRetryTagging,
}) {
  function toggleFlag(flag) {
    onConditionFlags(conditionFlags.includes(flag) ? conditionFlags.filter(f => f !== flag) : [...conditionFlags, flag])
  }

  return (
    <div className="space-y-5">
      {/* AI tagging error banner — dismissible */}
      {tagError && (
        <div className="bg-surface border border-amber-900/40 rounded-2xl px-4 py-3 flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="text-amber-500 text-xs leading-relaxed">
              AI tagging unavailable — fill in details below.
            </p>
            <button
              type="button"
              onClick={onRetryTagging}
              className="text-accent text-xs mt-1"
            >
              Retry AI tagging
            </button>
          </div>
          <button
            type="button"
            onClick={onDismissTagError}
            aria-label="Dismiss"
            className="text-muted text-sm leading-none mt-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Category */}
      <div>
        <label className="text-xs text-muted tracking-wide uppercase mb-2 block">Category <span className="text-red-400">*</span></label>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => onTagChange('category', cat)}
              className={`px-4 py-2 rounded-xl text-sm border transition-colors ${
                tags.category === cat ? 'border-accent text-accent' : 'border-border text-muted'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <Field label="Item type" value={tags.item_type} onChange={v => onTagChange('item_type', v)} />
      <Field label="Colour" value={tags.colour} onChange={v => onTagChange('colour', v)} />
      <Field label="Material" value={tags.material} onChange={v => onTagChange('material', v)} />
      <Field label="Brand" value={tags.brand} onChange={v => onTagChange('brand', v)} />

      {/* Formality — all labels shown upfront */}
      <div>
        <label className="text-xs text-muted tracking-wide uppercase mb-2 block">Formality</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => onTagChange('formality', n)}
              className={`flex-1 py-3 rounded-xl text-sm border transition-colors flex flex-col items-center gap-0.5 ${
                tags.formality === n ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted'
              }`}
            >
              <span>{n}</span>
              {n === 1 && <span className="text-[9px] leading-none opacity-70">Casual</span>}
              {n === 3 && <span className="text-[9px] leading-none opacity-70">Smart</span>}
              {n === 5 && <span className="text-[9px] leading-none opacity-70">Formal</span>}
            </button>
          ))}
        </div>
      </div>

      <Field label="Style notes" value={tags.style_notes} onChange={v => onTagChange('style_notes', v)} />

      {/* Condition flags */}
      <div>
        <label className="text-xs text-muted tracking-wide uppercase mb-2 block">Condition</label>
        <div className="flex flex-wrap gap-2">
          {CONDITION_FLAGS.map(flag => (
            <button
              key={flag}
              type="button"
              onClick={() => toggleFlag(flag)}
              className={`px-3 py-2 rounded-xl text-xs border transition-colors ${
                conditionFlags.includes(flag) ? 'border-accent text-accent' : 'border-border text-muted'
              }`}
            >
              {flag}
            </button>
          ))}
        </div>
      </div>

      {/* Personal notes */}
      <div>
        <label htmlFor="personal-notes" className="text-xs text-muted tracking-wide uppercase mb-1 block">Personal notes</label>
        <textarea
          id="personal-notes"
          value={personalNotes}
          onChange={e => onPersonalNotes(e.target.value)}
          placeholder="Anything Claude should know about this piece..."
          rows={2}
          className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-primary text-sm resize-none focus:outline-none focus:border-accent"
        />
      </div>

      <button
        type="button"
        onClick={onSave}
        disabled={isSaving || !tags.category}
        className="w-full bg-accent text-bg py-4 rounded-2xl font-medium tracking-wide disabled:opacity-40"
      >
        {isSaving ? 'Saving...' : 'Add to wardrobe'}
      </button>
    </div>
  )
}
