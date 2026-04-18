import { useState, useRef, useEffect } from 'react'
import { useUpdateItem, useDeleteItem } from '../../hooks/useWardrobe'
import ItemEditForm from './ItemEditForm'

const FORMALITY_LABELS = { 1: 'Loungewear', 2: 'Casual', 3: 'Smart casual', 4: 'Business', 5: 'Formal' }

export default function ItemDetail({ item, onClose }) {
  const { mutateAsync: updateItem, isPending: isUpdating } = useUpdateItem()
  const { mutateAsync: deleteItem, isPending: isDeleting } = useDeleteItem()
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState(null)
  const closeRef = useRef(null)
  const deleteRef = useRef(null)

  // Move focus into modal on mount; restore to opener on unmount
  useEffect(() => {
    const opener = document.activeElement
    closeRef.current?.focus()
    return () => { opener?.focus() }
  }, [])

  function handleKeyDown(e) {
    if (editing || e.key !== 'Tab') return
    const focusable = [closeRef.current, deleteRef.current].filter(Boolean)
    if (!focusable.length) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

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
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.item_type}
      onKeyDown={handleKeyDown}
      className="fixed inset-0 bg-bg/95 z-50 overflow-y-auto"
    >
      <div className="max-w-md mx-auto px-6 pt-6 pb-10">
        <button
          ref={closeRef}
          type="button"
          aria-label={editing ? 'Back to item detail' : 'Close'}
          onClick={editing ? () => setEditing(false) : onClose}
          className="text-muted text-sm mb-6"
        >
          {editing ? '← Back' : '✕ Close'}
        </button>

        {editing ? (
          <>
            <h2 className="text-xl font-light text-primary mb-6">Edit item</h2>
            <ItemEditForm item={item} onDone={onClose} />
          </>
        ) : (
          <>
            <div className="aspect-[3/4] rounded-3xl overflow-hidden mb-6 bg-surface border border-border flex items-center justify-center">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={`${item.brand ? item.brand + ' ' : ''}${item.item_type}${item.colour ? ', ' + item.colour : ''}`}
                  className="w-full h-full object-cover"
                />
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
                onClick={() => setEditing(true)}
                className="w-full border border-border text-muted py-4 rounded-2xl text-sm"
              >
                Edit item
              </button>

              <button
                type="button"
                onClick={handleArchive}
                disabled={isUpdating}
                className="w-full border border-border text-muted py-4 rounded-2xl text-sm disabled:opacity-40"
              >
                {isUpdating ? 'Updating...' : item.status === 'active' ? 'Archive item' : 'Restore to wardrobe'}
              </button>

              <button
                ref={deleteRef}
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full border border-red-900 text-red-400 py-4 rounded-2xl text-sm disabled:opacity-40"
              >
                {isDeleting ? 'Deleting...' : confirmDelete ? 'Tap again to confirm delete' : 'Permanently delete'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
