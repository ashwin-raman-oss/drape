import PresetTile from './PresetTile'

const PRESETS = [
  { label: 'Coffee shop workday',           emoji: '☕' },
  { label: 'Casual errand',                 emoji: '🛍️' },
  { label: 'Casual social',                 emoji: '👋' },
  { label: 'Date night',                    emoji: '🕯️' },
  { label: 'Smart casual dinner',           emoji: '🍷' },
  { label: 'Office day',                    emoji: '💼' },
  { label: 'Formal event',                  emoji: '🎩' },
  { label: 'Job interview',                 emoji: '🤝' },
]

export default function OccasionGrid({ onSelect, selected }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {PRESETS.map(p => (
        <PresetTile
          key={p.label}
          label={p.label}
          emoji={p.emoji}
          onTap={onSelect}
          selected={selected === p.label}
        />
      ))}
    </div>
  )
}
