import { useState } from 'react'
import ItemDetailModal from '../shared/ItemDetailModal'

export default function ItemPhoto({ item }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="flex flex-col items-center gap-0 w-36 flex-shrink-0">
        <div
          className="w-36 h-48 rounded-2xl overflow-hidden bg-surface-2 card-shadow flex items-center justify-center cursor-pointer"
          onClick={() => setOpen(true)}
        >
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.item_type}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-muted text-xs text-center px-2">No photo</span>
          )}
        </div>
        <p className="text-xs text-muted font-light leading-tight truncate mt-2 w-36 text-center px-1">{item.item_type}</p>
      </div>

      {open && <ItemDetailModal item={item} onClose={() => setOpen(false)} />}
    </>
  )
}
