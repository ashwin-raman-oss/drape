export default function ItemCard({ item, onClick }) {
  return (
    <button type="button" onClick={onClick} className="block w-full text-left">
      <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-surface border border-border mb-2 flex items-center justify-center">
        {item.image_url ? (
          <img src={item.image_url} alt={`${item.brand ? item.brand + ' ' : ''}${item.item_type}${item.colour ? ', ' + item.colour : ''}`} className="w-full h-full object-cover" />
        ) : (
          <span className="text-muted text-xs">No photo</span>
        )}
      </div>
      <p className="text-xs text-primary truncate px-1">{item.item_type}</p>
      <p className="text-xs text-muted px-1">{item.colour}</p>
    </button>
  )
}
