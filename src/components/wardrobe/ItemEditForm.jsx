import { useState } from 'react'
import { useUpdateItem } from '../../hooks/useWardrobe'

const CATEGORIES = ['Top', 'Bottom', 'Shoes', 'Outer layer']
const CONDITION_FLAGS = ['Casual only', 'Cold weather only', 'Formal only', 'Handle with care']
const FORMALITY_LABELS = { 1: 'Loungewear', 2: 'Casual', 3: 'Smart casual', 4: 'Business', 5: 'Formal' }

function Field({ label, value, onChange }) {
  const id = 'edit-' + label.toLowerCase().replace(/\s+/g, '-')
  return (
    <div>
      <label htmlFor={id} className="text-xs text-muted tracking-wide uppercase mb-1 block">{label}</label>
      <input
        id={id}
        type="text"
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-primary text-sm focus:outline-none focus:border-accent"
      />
    </div>
  )
}

export default function ItemEditForm({ item, onDone }) {
  const { mutateAsync: updateItem, isPending: isSaving } = useUpdateItem()
  const [error, setError] = useState(null)

  const [category, setCategory] = useState(item.category ?? '')
  const [itemType, setItemType] = useState(item.item_type ?? '')
  const [colour, setColour] = useState(item.colour ?? '')
  const [material, setMaterial] = useState(item.material ?? '')
  const [brand, setBrand] = useState(item.brand ?? '')
  const [formality, setFormality] = useState(item.formality ?? 3)
  const [styleNotes, setStyleNotes] = useState(item.style_notes ?? '')
  const [conditionFlags, setConditionFlags] = useState(item.condition_flags ?? [])
  const [personalNotes, setPersonalNotes] = useState(item.personal_notes ?? '')
  const [status, setStatus] = useState(item.status ?? 'active')

  function toggleFlag(flag) {
    setConditionFlags(prev =>
      prev.includes(flag) ? prev.filter(f => f !== flag) : [...prev, flag]
    )
  }

  async function handleSave() {
    setError(null)
    try {
      await updateItem({
        id: item.id,
        category,
        item_type: itemType,
        colour,
        material: material || null,
        brand: brand || null,
        formality,
        style_notes: styleNotes || null,
        condition_flags: conditionFlags,
        personal_notes: personalNotes || null,
        status,
      })
      onDone()
    } catch (err) {
      setError(err?.message ? `Could not save: ${err.message}` : 'Could not save item. Please try again.')
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="text-xs text-muted tracking-wide uppercase mb-2 block">Category</label>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-xl text-sm border transition-colors ${
                category === cat ? 'border-accent text-accent' : 'border-border text-muted'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <Field label="Item type" value={itemType} onChange={setItemType} />
      <Field label="Colour" value={colour} onChange={setColour} />
      <Field label="Material" value={material} onChange={setMaterial} />
      <Field label="Brand" value={brand} onChange={setBrand} />

      <div>
        <label className="text-xs text-muted tracking-wide uppercase mb-2 block">
          Formality — {FORMALITY_LABELS[formality] ?? ''}
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => setFormality(n)}
              className={`flex-1 py-3 rounded-xl text-sm border transition-colors ${
                formality === n ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <Field label="Style notes" value={styleNotes} onChange={setStyleNotes} />

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

      <div>
        <label className="text-xs text-muted tracking-wide uppercase mb-1 block">Personal notes</label>
        <textarea
          value={personalNotes}
          onChange={e => setPersonalNotes(e.target.value)}
          placeholder="Anything Claude should know about this piece..."
          rows={2}
          className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-primary text-sm resize-none focus:outline-none focus:border-accent"
        />
      </div>

      <div>
        <label className="text-xs text-muted tracking-wide uppercase mb-2 block">Status</label>
        <div className="flex gap-2">
          {[['active', 'Active'], ['archived', 'Archived']].map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => setStatus(val)}
              className={`px-4 py-2 rounded-xl text-sm border transition-colors ${
                status === val ? 'border-accent text-accent' : 'border-border text-muted'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-red-500 text-sm text-center">{error}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving || !category || !itemType}
        className="w-full bg-accent text-bg py-4 rounded-2xl font-medium tracking-wide disabled:opacity-40"
      >
        {isSaving ? 'Saving...' : 'Save changes'}
      </button>
    </div>
  )
}
