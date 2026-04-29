export default function PresetTile({ label, emoji, onTap, selected }) {
  return (
    <button
      type="button"
      onClick={() => onTap(label)}
      className={`rounded-2xl py-4 px-3 text-left transition-colors ${
        selected
          ? 'bg-accent/15 border border-accent/40 text-accent'
          : 'bg-surface-2 text-primary active:bg-border'
      }`}
    >
      <span className="block text-xl mb-1">{emoji}</span>
      <span className="text-sm font-medium tracking-wide leading-snug">{label}</span>
    </button>
  )
}
