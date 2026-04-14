import { useRef } from 'react'

// Defined at module scope — NOT inside UploadStep1 — to prevent remount on every render
function PhotoSlot({ file, label, inputRef, description }) {
  const preview = file ? URL.createObjectURL(file) : null
  return (
    <button
      type="button"
      onClick={() => inputRef.current.click()}
      className="w-full aspect-[3/4] rounded-3xl border-2 border-dashed border-border bg-surface flex flex-col items-center justify-center overflow-hidden"
    >
      {preview ? (
        <img src={preview} alt={label} className="w-full h-full object-cover" />
      ) : (
        <div className="flex flex-col items-center gap-2 p-6 text-center">
          <span className="text-3xl">+</span>
          <span className="text-sm text-primary font-medium">{label}</span>
          <span className="text-xs text-muted">{description}</span>
        </div>
      )}
    </button>
  )
}

export default function UploadStep1({ itemPhoto, labelPhoto, onItemPhoto, onLabelPhoto, onNext }) {
  const itemRef = useRef()
  const labelRef = useRef()

  function handleFile(e, setter) {
    const file = e.target.files[0]
    if (file) setter(file)
  }

  return (
    <div className="space-y-6">
      <input ref={itemRef} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={e => handleFile(e, onItemPhoto)} />
      <input ref={labelRef} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={e => handleFile(e, onLabelPhoto)} />

      <div className="grid grid-cols-2 gap-3">
        <PhotoSlot file={itemPhoto} label="Item photo" inputRef={itemRef} description="Laid flat or on a hanger" />
        <PhotoSlot file={labelPhoto} label="Label photo" inputRef={labelRef} description="Care label (optional)" />
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
