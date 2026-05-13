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
import { buildRecommendationPrompt, buildReplacementPrompt } from '../lib/prompts'

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
  const [looks, setLooks] = useState(null)
  const [lookVersions, setLookVersions] = useState({})
  const [savedLooks, setSavedLooks] = useState({})
  const [savingLook, setSavingLook] = useState(null)
  const [saveError, setSaveError] = useState(null)

  const activeItems = wardrobe.filter(i => i.status === 'active')

  const wardrobeById = useMemo(() => new Map(wardrobe.map(item => [item.id, item])), [wardrobe])

  // Sync local looks state from store (initial load only)
  useEffect(() => {
    if (recommendations?.looks && !looks) {
      setLooks(recommendations.looks)
    }
  }, [recommendations, looks])

  const fetchRecommendations = useCallback(async () => {
    if (activeItems.length < 3) return
    setLoading(true)
    setError(null)
    try {
      const recentRatings = outfitLogs
        .filter(l => l.rating !== null)
        .slice(0, 10)

      const recentReactions = outfitLogs
        .filter(l => l.reaction !== null)
        .slice(0, 10)

      const prompt = buildRecommendationPrompt({
        occasion,
        weather,
        lifestyleContext: profile?.lifestyle_context ?? [],
        wardrobeItems: wardrobe,
        recentRatings,
        recentReactions,
        wardrobeMap: wardrobeById,
      })

      const response = await callClaude({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      })

      const json = extractJSON(response)
      setRecommendations({ looks: json })
      setLooks(json)
    } catch (e) {
      setError(classifyError(e))
    } finally {
      setLoading(false)
    }
  }, [occasion, weather, wardrobe, outfitLogs, profile, activeItems.length, setRecommendations, wardrobeById])

  useEffect(() => {
    if (!occasion || !weather) {
      navigate('/', { replace: true })
      return
    }
    if (!recommendations && wardrobeReady && logsReady && profileReady) {
      fetchRecommendations()
    }
  }, [occasion, weather, recommendations, wardrobeReady, logsReady, profileReady, fetchRecommendations, navigate])

  async function fetchReplacement(downvotedLook, flaggedItems) {
    const prompt = buildReplacementPrompt({
      occasion,
      weather,
      lifestyleContext: profile?.lifestyle_context ?? [],
      wardrobeItems: wardrobe,
      wardrobeMap: wardrobeById,
      downvotedLook,
      flaggedItems,
    })

    const response = await callClaude({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    })

    const json = extractJSON(response)
    const newLook = Array.isArray(json) ? json[0] : json
    setLooks(prev =>
      (prev ?? []).map(l =>
        l.look_number === downvotedLook.look_number
          ? { ...newLook, look_number: downvotedLook.look_number }
          : l
      )
    )
    setLookVersions(prev => ({
      ...prev,
      [downvotedLook.look_number]: (prev[downvotedLook.look_number] ?? 0) + 1,
    }))
  }

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

        {!loading && !error && !showEmptyState && looks?.map(look => (
          <OutfitLook
            key={`${look.look_number}-${lookVersions[look.look_number] ?? 0}`}
            lookNumber={look.look_number}
            items={getLookItems(look.item_ids)}
            reason={look.reason}
            look={look}
            occasion={occasion}
            weather={weather}
            onSave={() => handleSaveLook(look)}
            isSaving={savingLook === look.look_number}
            isSaved={!!savedLooks[look.look_number]}
            onFetchReplacement={fetchReplacement}
          />
        ))}
      </div>

      <BottomNav />
    </MobileLayout>
  )
}
