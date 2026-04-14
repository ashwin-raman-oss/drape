const CATEGORIES = ['Top', 'Bottom', 'Shoes', 'Outer layer']
const CONDITION_FLAGS = ['Casual only', 'Cold weather only', 'Formal only', 'Handle with care']
const FORMALITY_LABELS = { 1: 'Loungewear', 2: 'Casual', 3: 'Smart casual', 4: 'Business', 5: 'Formal' }

export default function UploadStep3({ tags, onTagChange, personalNotes, onPersonalNotes, conditionFlags, onConditionFlags, onSave, isSaving }) {
  function toggleFlag(flag) {
    onConditionFlags(conditionFlags.includes(flag) ? conditionFlags.filter(f => f !== flag) : [...conditionFlags, flag])
  }

  function field(label, value, onChange, type = 'text') {
    const id = label.toLowerCase().replace(/\s+/g, '-')
    return (
      <div>
        <label htmlFor={id} className="text-xs text-muted tracking-wide uppercase mb-1 block">{label}</label>
        <input
          id={id}
          type={type}
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
          className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-primary text-sm focus:outline-none focus:border-accent"
        />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Category */}
      <div>
        <label className="text-xs text-muted tracking-wide uppercase mb-2 block">Category</label>
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

      {field('Item type', tags.item_type, v => onTagChange('item_type', v))}
      {field('Colour', tags.colour, v => onTagChange('colour', v))}
      {field('Material', tags.material, v => onTagChange('material', v))}
      {field('Brand', tags.brand, v => onTagChange('brand', v))}

      {/* Formality */}
      <div>
        <label className="text-xs text-muted tracking-wide uppercase mb-2 block">
          Formality — {FORMALITY_LABELS[tags.formality] ?? ''}
        </label>
        <div className="flex gap-2">
          {[1,2,3,4,5].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => onTagChange('formality', n)}
              className={`flex-1 py-3 rounded-xl text-sm border transition-colors ${
                tags.formality === n ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {field('Style notes', tags.style_notes, v => onTagChange('style_notes', v))}

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
        <label className="text-xs text-muted tracking-wide uppercase mb-1 block">Personal notes</label>
        <textarea
          value={personalNotes}
          onChange={e => onPersonalNotes(e.target.value)}
          placeholder="Anything Claude should know about this piece..."
          rows={2}
          className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-primary text-sm resize-none focus:outline-none focus:border-accent"
        />
      </div>

      <button
        type="button"
        onClick={onSave}
        disabled={isSaving || !tags.category || !tags.item_type}
        className="w-full bg-accent text-bg py-4 rounded-2xl font-medium tracking-wide disabled:opacity-40"
      >
        {isSaving ? 'Saving...' : 'Add to wardrobe'}
      </button>
    </div>
  )
}
