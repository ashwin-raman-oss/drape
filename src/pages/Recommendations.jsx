import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MobileLayout from '../components/layout/MobileLayout'
import BottomNav from '../components/layout/BottomNav'
import OutfitLook from '../components/recommendations/OutfitLook'
import { useFlowStore } from '../store/flowStore'
import { useWardrobe } from '../hooks/useWardrobe'
import { useOutfitLogs, useSaveLook } from '../hooks/useOutfits'
import { useProfile } from '../hooks/useProfile'
import { useAuth } from '../hooks/useAuth'
import { callClaude, extractJSON } from '../lib/claude'
import { buildRecommendationPrompt } from '../lib/prompts'

export default function Recommendations() {
  const occasion = useFlowStore(s => s.occasion)
  const weather = useFlowStore(s => s.weather)
  const recommendations = useFlowStore(s => s.recommendations)
  const setRecommendations = useFlowStore(s => s.setRecommendations)
  const navigate = useNavigate()
  const { session } = useAuth()
  const { data: wardrobe = [], isSuccess: wardrobeReady } = useWardrobe()
  const { data: outfitLogs = [], isSuccess: logsReady } = useOutfitLogs()
  const { data: profile, isSuccess: profileReady } = useProfile(session?.user?.id)
  const { mutateAsync: saveLook } = useSaveLook()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [savingLook, setSavingLook] = useState(null)
  const [saveError, setSaveError] = useState(null)

  useEffect(() => {
    if (!occasion || !weather) {
      navigate('/', { replace: true })
      return
    }
    if (!recommendations && wardrobeReady && logsReady && profileReady) {
      fetchRecommendations()
    }
  }, [wardrobeReady, logsReady, profileReady]) // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchRecommendations() {
    setLoading(true)
    setError(null)
    try {
      const recentRatings = outfitLogs
        .filter(l => l.rating !== null)
        .slice(0, 10)

      const prompt = buildRecommendationPrompt({
        occasion,
        weather,
        lifestyleContext: profile?.lifestyle_context ?? [],
        wardrobeItems: wardrobe,
        recentRatings,
      })

      const response = await callClaude({
        model: 'claude-sonnet-4-5',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      })

      const json = extractJSON(response)
      setRecommendations({ looks: json })
    } catch (e) {
      setError('Could not generate recommendations. Check your wardrobe has enough active items.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveLook(look) {
    setSavingLook(look.look_number)
    setSaveError(null)
    try {
      await saveLook({ occasion, weather, itemIds: look.item_ids })
    } catch {
      setSaveError('Could not save look. Please try again.')
    } finally {
      setSavingLook(null)
    }
  }

  // Build a Map once for O(1) lookups
  const wardrobeById = new Map(wardrobe.map(item => [item.id, item]))

  function getLookItems(itemIds) {
    return itemIds.map(id => wardrobeById.get(id)).filter(Boolean)
  }

  return (
    <MobileLayout className="pb-nav">
      <div className="px-6 pt-14 pb-4">
        <button type="button" aria-label="Go back" onClick={() => navigate(-1)} className="text-muted text-sm mb-6">← Back</button>
        <p className="text-muted text-xs tracking-widest uppercase mb-1">{occasion} · {weather}</p>
        <h1 className="text-2xl font-light text-primary">Your looks</h1>
      </div>

      <div className="px-6 space-y-4 pb-6">
        {loading && (
          <div className="flex flex-col items-center py-16 gap-3">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="text-muted text-sm">Styling your outfit...</p>
          </div>
        )}

        {error && (
          <div className="bg-surface border border-border rounded-3xl p-6 text-center">
            <p className="text-muted text-sm mb-4">{error}</p>
            <button type="button" onClick={fetchRecommendations} className="text-accent text-sm">Try again</button>
          </div>
        )}

        {saveError && (
          <p className="text-sm text-center" style={{ color: '#ef4444' }}>{saveError}</p>
        )}

        {!loading && !error && recommendations?.looks?.map(look => (
          <OutfitLook
            key={look.look_number}
            lookNumber={look.look_number}
            items={getLookItems(look.item_ids)}
            reason={look.reason}
            onSave={() => handleSaveLook(look)}
            isSaving={savingLook === look.look_number}
          />
        ))}
      </div>

      <BottomNav />
    </MobileLayout>
  )
}
