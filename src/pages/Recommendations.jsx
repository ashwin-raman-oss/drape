import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import MobileLayout from '../components/layout/MobileLayout'
import BottomNav from '../components/layout/BottomNav'
import OutfitLook from '../components/recommendations/OutfitLook'
import { useFlowStore } from '../store/flowStore'
import { useWardrobe } from '../hooks/useWardrobe'
import { useOutfitLogs, useSaveLook, useAddOutfitLog } from '../hooks/useOutfits'
import { useProfile } from '../hooks/useProfile'
import { useAuth } from '../hooks/useAuth'
import { callClaude, extractJSON } from '../lib/claude'
import { buildRecommendationPrompt } from '../lib/prompts'

function classifyError(e) {
  const msg = e?.message ?? ''
  if (msg.includes('401') || msg.includes('403')) {
    return 'Something went wrong with authentication. Try signing out and back in.'
  }
  if (msg.includes('429')) {
    return 'Too many requests. Wait a moment and try again.'
  }
  if (msg.includes('fetch') || msg.includes('network') || msg.includes('Failed to fetch')) {
    return 'Unable to connect. Check your internet connection and try again.'
  }
  return 'Something went wrong generating your outfit. Try again.'
}

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
  const { mutateAsync: addOutfitLog } = useAddOutfitLog()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [savedLooks, setSavedLooks] = useState({})
  const [savingLook, setSavingLook] = useState(null)
  const [saveError, setSaveError] = useState(null)

  const activeItems = wardrobe.filter(i => i.status === 'active')

  const fetchRecommendations = useCallback(async () => {
    if (activeItems.length < 3) return
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
        wardrobeMap: wardrobeById,
      })

      const response = await callClaude({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      })

      const json = extractJSON(response)
      setRecommendations({ looks: json })
    } catch (e) {
      setError(classifyError(e))
    } finally {
      setLoading(false)
    }
  }, [occasion, weather, wardrobe, outfitLogs, profile, activeItems.length, setRecommendations])

  useEffect(() => {
    if (!occasion || !weather) {
      navigate('/', { replace: true })
      return
    }
    if (!recommendations && wardrobeReady && logsReady && profileReady) {
      fetchRecommendations()
    }
  }, [occasion, weather, recommendations, wardrobeReady, logsReady, profileReady, fetchRecommendations, navigate])

  async function handleSaveLook(look) {
    setSavingLook(look.look_number)
    setSaveError(null)
    try {
      await Promise.all([
        saveLook({ occasion, weather, itemIds: look.item_ids }),
        addOutfitLog({ occasion, weather, itemIds: look.item_ids }),
      ])
      setSavedLooks(prev => ({ ...prev, [look.look_number]: true }))
    } catch {
      setSaveError('Could not save look. Please try again.')
    } finally {
      setSavingLook(null)
    }
  }

  const wardrobeById = useMemo(() => new Map(wardrobe.map(item => [item.id, item])), [wardrobe])

  function getLookItems(itemIds) {
    return itemIds.map(id => wardrobeById.get(id)).filter(Boolean)
  }

  const showEmptyState = wardrobeReady && activeItems.length < 3 && !recommendations

  return (
    <MobileLayout className="pb-nav">
      <div className="px-6 pt-14 pb-4">
        <button type="button" aria-label="Go back" onClick={() => navigate(-1)} className="text-muted text-sm mb-6">← Back</button>
        <p className="text-muted text-xs tracking-widest uppercase mb-1">{occasion} · {weather}</p>
        <h1 className="text-2xl font-serif font-light tracking-wide text-primary">Your looks</h1>
      </div>

      <div className="px-6 space-y-4 pb-6">
        {showEmptyState && (
          <div className="bg-surface border border-border rounded-3xl p-8 text-center space-y-4 mt-4">
            <p className="text-primary text-sm leading-relaxed">
              Your wardrobe needs a few items before Drape can recommend outfits. Add at least 3 pieces to get started.
            </p>
            <button
              type="button"
              onClick={() => navigate('/upload')}
              className="w-full bg-accent text-bg py-4 rounded-2xl font-medium tracking-wide"
            >
              Add clothes now
            </button>
          </div>
        )}

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
          <p className="text-sm text-center text-red-400">{saveError}</p>
        )}

        {!loading && !error && !showEmptyState && recommendations?.looks?.map(look => (
          <OutfitLook
            key={look.look_number}
            lookNumber={look.look_number}
            items={getLookItems(look.item_ids)}
            reason={look.reason}
            onSave={() => handleSaveLook(look)}
            isSaving={savingLook === look.look_number}
            isSaved={!!savedLooks[look.look_number]}
          />
        ))}
      </div>

      <BottomNav />
    </MobileLayout>
  )
}
