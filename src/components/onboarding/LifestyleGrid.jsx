const OPTIONS = [
  { id: 'office', label: 'Office or hybrid work' },
  { id: 'wfh', label: 'Working from home or café' },
  { id: 'social', label: 'Dinners or social events' },
  { id: 'gym', label: 'Gym or active days' },
  { id: 'client', label: 'Client meetings or presentations' },
  { id: 'travel', label: 'Business or leisure travel' },
  { id: 'formal', label: 'Weddings or formal events' },
]

export default function LifestyleGrid({ selected, onChange }) {
  function toggle(id) {
    onChange(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id])
  }

  return (
    <div className="space-y-3">
      {OPTIONS.map(opt => {
        const active = selected.includes(opt.id)
        return (
          <button
            key={opt.id}
            onClick={() => toggle(opt.id)}
            className={`w-full text-left px-5 py-4 rounded-2xl border transition-colors ${
              active
                ? 'border-accent bg-accent/10 text-primary'
                : 'border-border bg-surface text-muted'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
