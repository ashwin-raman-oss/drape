import { useState } from 'react'
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

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function uploadImage(file, userId, slot) {
  const ext = file.name.split('.').pop()
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

  const navigate = useNavigate()
  const { session } = useAuth()
  const { mutateAsync: addItem } = useAddItem()

  async function handleTagWithAI() {
    setStep(2)
    try {
      const itemB64 = await fileToBase64(itemPhoto)
      const content = [
        { type: 'text', text: buildTaggingPrompt() },
        { type: 'image', source: { type: 'base64', media_type: itemPhoto.type, data: itemB64 } },
      ]
      if (labelPhoto) {
        const labelB64 = await fileToBase64(labelPhoto)
        content.push({ type: 'image', source: { type: 'base64', media_type: labelPhoto.type, data: labelB64 } })
      }
      const response = await callClaude({
        model: 'claude-sonnet-4-5',
        max_tokens: 512,
        messages: [{ role: 'user', content }],
      })
      const parsed = extractJSON(response)
      setTags(parsed)
      setStep(3)
    } catch {
      // Fall through to step 3 with empty tags for manual entry
      setTags({})
      setStep(3)
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
        formality: tags.formality || 3,
        style_notes: tags.style_notes || null,
        condition_flags: conditionFlags,
        personal_notes: personalNotes || null,
      })
      navigate('/wardrobe')
    } catch {
      setSaveError('Could not save item. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <MobileLayout className="px-6 pt-14 pb-10">
      <button
        type="button"
        aria-label={step === 1 ? 'Cancel upload' : 'Go back'}
        onClick={() => step === 1 ? navigate(-1) : setStep(step - 1)}
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
        <p className="text-sm text-center mb-4" style={{ color: '#ef4444' }}>{saveError}</p>
      )}

      {step === 1 && (
        <UploadStep1
          itemPhoto={itemPhoto}
          labelPhoto={labelPhoto}
          onItemPhoto={setItemPhoto}
          onLabelPhoto={setLabelPhoto}
          onNext={handleTagWithAI}
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
        />
      )}
    </MobileLayout>
  )
}
