export default function ItemPhoto({ item }) {
  return (
    <div className="flex flex-col items-center gap-2 w-32 flex-shrink-0">
      <div className="w-32 h-40 rounded-2xl overflow-hidden bg-surface border border-border">
        <img
          src={item.image_url}
          alt={item.item_type}
          className="w-full h-full object-cover"
        />
      </div>
      <p className="text-xs text-muted text-center leading-tight px-1">{item.item_type}</p>
    </div>
  )
}
