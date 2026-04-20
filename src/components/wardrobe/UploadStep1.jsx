import { useRef, useMemo, useEffect } from 'react'

// Defined at module scope to prevent remount on every render
function PhotoSlot({ file, label, description, cameraRef, galleryRef }) {
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  return (
    <div className="flex flex-col gap-2">
      <div className="aspect-[3/4] rounded-3xl border-2 border-dashed border-border bg-surface overflow-hidden flex flex-col items-center justify-center">
        {preview ? (
          <img src={preview} alt={label} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-3 px-3 py-5 text-center w-full">
            <span className="text-sm text-primary font-medium">{label}</span>
            <span className="text-xs text-muted">{description}</span>
            <button
              type="button"
              onClick={() => cameraRef.current.click()}
              className="w-full border border-border text-muted text-xs py-2 rounded-xl transition-colors active:border-accent active:text-accent"
            >
              Take photo
            </button>
            <button
              type="button"
              onClick={() => galleryRef.current.click()}
              className="w-full border border-border text-muted text-xs py-2 rounded-xl transition-colors active:border-accent active:text-accent"
            >
              Choose from gallery
            </button>
          </div>
        )}
      </div>

      {preview && (
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => cameraRef.current.click()}
            className="flex-1 border border-border text-muted text-xs py-2 rounded-xl transition-colors active:border-accent active:text-accent"
          >
            Retake
          </button>
          <button
            type="button"
            onClick={() => galleryRef.current.click()}
            className="flex-1 border border-border text-muted text-xs py-2 rounded-xl transition-colors active:border-accent active:text-accent"
          >
            Gallery
          </button>
        </div>
      )}
    </div>
  )
}

export default function UploadStep1({ itemPhoto, labelPhoto, onItemPhoto, onLabelPhoto, onNext }) {
  const itemCameraRef = useRef()
  const itemGalleryRef = useRef()
  const labelCameraRef = useRef()
  const labelGalleryRef = useRef()

  function handleFile(e, setter) {
    const file = e.target.files[0]
    if (file && file.type.startsWith('image/')) setter(file)
    // Reset so selecting the same file again still fires onChange
    e.target.value = ''
  }

  return (
    <div className="space-y-6">
      <input ref={itemCameraRef}  type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleFile(e, onItemPhoto)} />
      <input ref={itemGalleryRef} type="file" accept="image/*" className="hidden"                       onChange={e => handleFile(e, onItemPhoto)} />
      <input ref={labelCameraRef}  type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleFile(e, onLabelPhoto)} />
      <input ref={labelGalleryRef} type="file" accept="image/*" className="hidden"                       onChange={e => handleFile(e, onLabelPhoto)} />

      <div className="grid grid-cols-2 gap-3">
        <PhotoSlot
          file={itemPhoto}
          label="Item photo"
          description="Laid flat or on a hanger"
          cameraRef={itemCameraRef}
          galleryRef={itemGalleryRef}
        />
        <PhotoSlot
          file={labelPhoto}
          label="Label photo"
          description="Care label (optional)"
          cameraRef={labelCameraRef}
          galleryRef={labelGalleryRef}
        />
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={!itemPhoto}
        className="w-full bg-accent text-bg py-4 rounded-2xl font-medium tracking-wide disabled:opacity-40"
      >
        Tag with AI
      </button>
    </div>
  )
}
