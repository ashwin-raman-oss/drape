import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import MobileLayout from '../components/layout/MobileLayout'
import UploadStep1 from '../components/wardrobe/UploadStep1'
import UploadStep2 from '../components/wardrobe/UploadStep2'
import UploadStep3 from '../components/wardrobe/UploadStep3'
import { callClaude, extractJSON } from '../lib/claude'
import { buildTaggingPrompt } from '../lib/prompts'
import { supabase } from '../lib/supabase'
import { useAddItem } from '../hooks/useWardrobe'
import { useAuth } from '../hooks/useAuth'

const MAX_VISION_PX = 1024
const VISION_QUALITY = 0.8

async function fileToBase64ForVision(file) {
  const bitmap = await createImageBitmap(file)
  const { width, height } = bitmap
  const scale = Math.min(1, MAX_VISION_PX / Math.max(width, height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width * scale)
  canvas.height = Math.round(height * scale)
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (!blob) { reject(new Error('Canvas toBlob failed')); return }
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result.split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(blob)
      },
      'image/jpeg',
      VISION_QUALITY,
    )
  })
}

async function uploadImage(file, userId, slot) {
  const MIME_TO_EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/heic': 'heic' }
  const ext = MIME_TO_EXT[file.type] ?? 'jpg'
  const path = `${userId}/${Date.now()}-${slot}.${ext}`
  const { error } = await supabase.storage.from('wardrobe-images').upload(path, file)
  if (error) throw error
  const { data } = supabase.storage.from('wardrobe-images').getPublicUrl(path)
  return data.publicUrl
}

export default function Upload() {
  const [step, setStep] = useState(1)
  const [itemPhoto, setItemPhoto] = useState(null)
  const [labelPhoto, setLabelPhoto] = useState(null)
  const [tags, setTags] = useState({})
  const [conditionFlags, setConditionFlags] = useState([])
  const [personalNotes, setPersonalNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [tagError, setTagError] = useState(null)

  const abortRef = useRef(false)

  const navigate = useNavigate()
  const { session } = useAuth()
  const { mutateAsync: addItem } = useAddItem()

  async function runTagging() {
    abortRef.current = false
    setTagError(null)
    setStep(2)
    try {
      const itemB64 = await fileToBase64ForVision(itemPhoto)
      const content = [
        { type: 'text', text: buildTaggingPrompt() },
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: itemB64 } },
      ]
      if (labelPhoto) {
        const labelB64 = await fileToBase64ForVision(labelPhoto)
        content.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: labelB64 } })
      }
      const response = await callClaude({
        model: 'claude-sonnet-4-6',
        max_tokens: 512,
        messages: [{ role: 'user', content }],
      })
      if (!abortRef.current) {
        const parsed = extractJSON(response)
        setTags(parsed)
        setStep(3)
      }
    } catch (err) {
      if (!abortRef.current) {
        setTagError(err?.message ?? 'AI tagging failed — fill in details below.')
        setTags({})
        setStep(3)
      }
    }
  }

  function handleTagChange(field, value) {
    setTags(prev => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    if (!session?.user?.id) return
    setIsSaving(true)
    setSaveError(null)
    try {
      const userId = session.user.id
      const imageUrl = await uploadImage(itemPhoto, userId, 'item')
      const labelImageUrl = labelPhoto ? await uploadImage(labelPhoto, userId, 'label') : null

      await addItem({
        image_url: imageUrl,
        label_image_url: labelImageUrl,
        category: tags.category,
        item_type: tags.item_type,
        colour: tags.colour,
        material: tags.material || null,
        brand: tags.brand || null,
        formality: tags.formality ?? 3,
        style_notes: tags.style_notes || null,
        condition_flags: conditionFlags,
        personal_notes: personalNotes || null,
      })
      navigate('/wardrobe')
    } catch (err) {
      setSaveError(err?.message ? `Could not save item: ${err.message}` : 'Could not save item. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <MobileLayout className="px-6 pt-14 pb-10">
      <button
        type="button"
        aria-label={step === 1 ? 'Cancel upload' : 'Go back'}
        onClick={() => {
          abortRef.current = true
          if (step === 1) navigate(-1)
          else setStep(step - 1)
        }}
        className="text-muted text-sm mb-6"
      >
        {step === 1 ? '← Cancel' : '← Back'}
      </button>

      <h1 className="text-2xl font-light text-primary mb-8">
        {step === 1 && 'Add item'}
        {step === 2 && 'Analysing...'}
        {step === 3 && 'Confirm details'}
      </h1>

      {saveError && (
        <p className="text-sm text-center mb-4 text-red-400">{saveError}</p>
      )}

      {step === 1 && (
        <UploadStep1
          itemPhoto={itemPhoto}
          labelPhoto={labelPhoto}
          onItemPhoto={setItemPhoto}
          onLabelPhoto={setLabelPhoto}
          onNext={runTagging}
        />
      )}
      {step === 2 && <UploadStep2 />}
      {step === 3 && (
        <UploadStep3
          tags={tags}
          onTagChange={handleTagChange}
          personalNotes={personalNotes}
          onPersonalNotes={setPersonalNotes}
          conditionFlags={conditionFlags}
          onConditionFlags={setConditionFlags}
          onSave={handleSave}
          isSaving={isSaving}
          tagError={tagError}
          onDismissTagError={() => setTagError(null)}
          onRetryTagging={runTagging}
        />
      )}
    </MobileLayout>
  )
}
