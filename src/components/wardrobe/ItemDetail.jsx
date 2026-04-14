import { useState } from 'react'
import { useUpdateItem, useDeleteItem } from '../../hooks/useWardrobe'

const FORMALITY_LABELS = { 1: 'Loungewear', 2: 'Casual', 3: 'Smart casual', 4: 'Business', 5: 'Formal' }

export default function ItemDetail({ item, onClose }) {
  const { mutateAsync: updateItem, isPending: isUpdating } = useUpdateItem()
  const { mutateAsync: deleteItem, isPending: isDeleting } = useDeleteItem()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState(null)

  async function handleArchive() {
    setError(null)
    try {
      await updateItem({ id: item.id, status: item.status === 'active' ? 'archived' : 'active' })
      onClose()
    } catch {
      setError('Could not update item. Please try again.')
    }
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setError(null)
    try {
      await deleteItem(item.id)
      onClose()
    } catch {
      setError('Could not delete item. Please try again.')
    }
  }

  return (
    <div className="fixed inset-0 bg-bg/95 z-50 overflow-y-auto">
      <div className="max-w-md mx-auto px-6 pt-6 pb-10">
        <button type="button" aria-label="Close" onClick={onClose} className="text-muted text-sm mb-6">✕ Close</button>

        <div className="aspect-[3/4] rounded-3xl overflow-hidden mb-6 bg-surface border border-border flex items-center justify-center">
          {item.image_url ? (
            <img src={item.image_url} alt={item.item_type} className="w-full h-full object-cover" />
          ) : (
            <span className="text-muted text-xs">No photo</span>
          )}
        </div>

        <h2 className="text-xl font-light text-primary mb-1">{item.item_type}</h2>
        <p className="text-muted text-sm mb-6">{item.brand ?? ''} · {item.colour} · {FORMALITY_LABELS[item.formality]}</p>

        {item.style_notes && <p className="text-sm text-muted mb-4">{item.style_notes}</p>}
        {item.condition_flags?.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-4">
            {item.condition_flags.map(f => (
              <span key={f} className="border border-border text-muted text-xs px-3 py-1 rounded-full">{f}</span>
            ))}
          </div>
        )}
        {item.personal_notes && <p className="text-xs text-muted italic mb-6">{item.personal_notes}</p>}

        {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleArchive}
            disabled={isUpdating}
            className="w-full border border-border text-muted py-4 rounded-2xl text-sm disabled:opacity-40"
          >
            {isUpdating ? '...' : item.status === 'active' ? 'Archive item' : 'Restore to wardrobe'}
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-full border border-red-900 text-red-400 py-4 rounded-2xl text-sm disabled:opacity-40"
          >
            {isDeleting ? 'Deleting...' : confirmDelete ? 'Tap again to confirm delete' : 'Permanently delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
