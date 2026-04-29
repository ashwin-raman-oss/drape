import ItemCard from './ItemCard'

export default function WardrobeGrid({ items = [], onItemClick }) {
  if (!items.length) {
    return (
      <div className="text-center py-16">
        <p className="text-muted text-sm">Your wardrobe is empty.</p>
        <p className="text-muted text-xs mt-1">Add your first item to get started.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {items.map(item => (
        <ItemCard key={item.id} item={item} onClick={() => onItemClick(item)} />
      ))}
    </div>
  )
}
