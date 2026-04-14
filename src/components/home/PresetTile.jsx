export default function PresetTile({ label, emoji, onTap }) {
  return (
    <button
      type="button"
      onClick={() => onTap(label)}
      className="bg-surface border border-border rounded-2xl p-4 text-left active:bg-border transition-colors"
    >
      <span className="block text-xl mb-1">{emoji}</span>
      <span className="text-sm text-primary leading-snug">{label}</span>
    </button>
  )
}
