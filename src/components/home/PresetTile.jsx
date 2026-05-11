export default function PresetTile({ label, emoji, onTap }) {
  return (
    <button
      type="button"
      onClick={() => onTap(label)}
      className="px-4 py-2 rounded-full bg-surface-2 text-sm text-muted font-medium whitespace-nowrap active:opacity-70 transition-opacity"
    >
      {emoji} {label}
    </button>
  )
}
