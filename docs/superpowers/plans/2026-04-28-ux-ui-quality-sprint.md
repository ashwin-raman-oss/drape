# UX/UI Quality Sprint Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 15 identified UX, UI, and product quality issues across the Drape app — covering empty states, feedback loops, visual consistency, and missing features — without touching the database schema.

**Architecture:** All changes are confined to React components and pages. One new page (`Saved.jsx`) and one new page (`WardrobeIntro.jsx`) are added. No new hooks or lib files are needed — all data access uses existing `useSavedLooks`, `useWardrobe`, and `useSaveLook` hooks. Changes are grouped into four commits: critical fixes, important fixes, app-wide polish, and the final build verification.

**Tech Stack:** React 18, React Router v6, Zustand, TanStack Query v5, Tailwind CSS v3, Supabase JS v2.

---

## File Map

**New files:**
- `src/pages/Saved.jsx` — Saved Looks page (Task 3)
- `src/pages/WardrobeIntro.jsx` — Post-onboarding wardrobe CTA interstitial (Task 8)

**Modified files:**
- `src/App.jsx` — add routes for `/saved` and `/wardrobe-intro`
- `src/components/layout/BottomNav.jsx` — add Saved tab, add active indicator dot
- `src/pages/Recommendations.jsx` — empty wardrobe gate, specific errors, save success state, hardcoded colour fix
- `src/components/recommendations/OutfitLook.jsx` — saved/failed persistent state
- `src/components/wardrobe/ItemDetail.jsx` — replace double-tap delete with modal
- `src/components/history/HistoryEntry.jsx` — direct Rate CTA on unrated items, fix h-18
- `src/pages/Onboarding.jsx` — navigate to `/wardrobe-intro` instead of `/`
- `src/pages/Settings.jsx` — isDirty guard before navigation
- `src/pages/Upload.jsx` — retry AI tagging, dismissible banner, error colour
- `src/components/wardrobe/UploadStep3.jsx` — formality labels, relax save gate
- `tailwind.config.js` — document border radius system in comments
- Global: standardise error colours across all files

---

## Task 1: Critical — Empty wardrobe gate on Recommendations

**Files:**
- Modify: `src/pages/Recommendations.jsx`

The fix runs before the Claude call in `fetchRecommendations`. If active wardrobe items are fewer than 3, skip the API entirely and show a friendly empty state with a CTA to `/upload`.

- [ ] **Step 1: Add the wardrobe gate and empty state UI**

Replace `src/pages/Recommendations.jsx` with the following. Key changes:
- Add `activeItems` derived constant (active-only wardrobe items)
- Gate `fetchRecommendations` — if `activeItems.length < 3`, skip API and show empty state
- Replace hardcoded `#ef4444` on line 119 with `text-red-400`
- Replace the single generic error string with a helper `classifyError(e)` that returns specific messages

```jsx
import { useEffect, useState } from 'react'
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
  // savedLooks tracks which look_numbers have been saved in this session
  const [savedLooks, setSavedLooks] = useState({})
  const [savingLook, setSavingLook] = useState(null)
  const [saveError, setSaveError] = useState(null)

  const activeItems = wardrobe.filter(i => i.status === 'active')

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
    if (activeItems.length < 3) return // empty state handled in render
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

  const wardrobeById = new Map(wardrobe.map(item => [item.id, item]))

  function getLookItems(itemIds) {
    return itemIds.map(id => wardrobeById.get(id)).filter(Boolean)
  }

  // Empty wardrobe state — shown before any API call
  const showEmptyState = wardrobeReady && activeItems.length < 3 && !recommendations

  return (
    <MobileLayout className="pb-nav">
      <div className="px-6 pt-14 pb-4">
        <button type="button" aria-label="Go back" onClick={() => navigate(-1)} className="text-muted text-sm mb-6">← Back</button>
        <p className="text-muted text-xs tracking-widest uppercase mb-1">{occasion} · {weather}</p>
        <h1 className="text-2xl font-light text-primary">Your looks</h1>
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
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Recommendations.jsx
git commit -m "fix: empty wardrobe gate, specific error messages, fix hardcoded colour"
```

---

## Task 2: Critical — Save look persistent success/fail state

**Files:**
- Modify: `src/components/recommendations/OutfitLook.jsx`

`OutfitLook` receives two new props: `isSaved` (boolean) and `isSaving` (boolean). When `isSaved` is true the button is replaced with a static "Saved ✓" in accent colour. If save failed the parent passes `saveError` text (handled in Recommendations; here the button just shows idle).

- [ ] **Step 1: Rewrite OutfitLook**

```jsx
import ItemPhoto from './ItemPhoto'

export default function OutfitLook({ lookNumber, items, reason, onSave, isSaving, isSaved }) {
  return (
    <div className="bg-surface border border-border rounded-3xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted tracking-widest uppercase">Look {lookNumber}</span>
      </div>

      {/* Item photos — horizontal scroll on small screens */}
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {items.map(item => (
          <ItemPhoto key={item.id} item={item} />
        ))}
      </div>

      {/* Reason */}
      <p className="text-sm text-muted leading-relaxed">{reason}</p>

      {/* Save — persists to Saved ✓ once saved */}
      {isSaved ? (
        <div className="w-full py-3 text-center text-accent text-sm font-medium tracking-wide">
          Saved ✓
        </div>
      ) : (
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="w-full border border-accent text-accent py-3 rounded-2xl text-sm font-medium tracking-wide disabled:opacity-40"
        >
          {isSaving ? 'Saving...' : 'Save this look'}
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/recommendations/OutfitLook.jsx
git commit -m "fix: save look shows persistent Saved checkmark after success"
```

---

## Task 3: Critical — Saved Looks page + BottomNav tab

**Files:**
- Create: `src/pages/Saved.jsx`
- Modify: `src/components/layout/BottomNav.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Create `src/pages/Saved.jsx`**

```jsx
import { useNavigate } from 'react-router-dom'
import MobileLayout from '../components/layout/MobileLayout'
import BottomNav from '../components/layout/BottomNav'
import { useSavedLooks } from '../hooks/useOutfits'
import { useWardrobe } from '../hooks/useWardrobe'

export default function Saved() {
  const { data: looks = [], isLoading } = useSavedLooks()
  const { data: wardrobe = [] } = useWardrobe()
  const navigate = useNavigate()

  const wardrobeById = new Map(wardrobe.map(item => [item.id, item]))

  return (
    <MobileLayout className="pb-nav">
      <div className="px-6 pt-14 pb-4">
        <h1 className="text-2xl font-light text-primary">Saved looks</h1>
        <p className="text-muted text-sm">Outfits you've saved from recommendations.</p>
      </div>

      <div className="px-6 space-y-4 pb-6">
        {isLoading && (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && looks.length === 0 && (
          <div className="bg-surface border border-border rounded-3xl p-8 text-center mt-4 space-y-3">
            <p className="text-muted text-sm leading-relaxed">
              Looks you save from recommendations will appear here.
            </p>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-accent text-sm"
            >
              Get a recommendation
            </button>
          </div>
        )}

        {looks.map(look => {
          const items = (look.item_ids ?? [])
            .map(id => wardrobeById.get(id))
            .filter(Boolean)

          return (
            <div key={look.id} className="bg-surface border border-border rounded-3xl p-5 space-y-3">
              <div>
                <p className="text-primary text-sm font-medium">{look.occasion}</p>
                <p className="text-muted text-xs">{look.weather} · {new Date(look.created_at).toLocaleDateString()}</p>
              </div>

              {/* Item thumbnails — horizontal scroll */}
              <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                {items.map(item => (
                  <div key={item.id} className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div className="w-20 h-28 rounded-2xl overflow-hidden bg-bg border border-border">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.item_type} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-muted text-xs">—</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted text-center w-20 truncate">{item.item_type}</p>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <BottomNav />
    </MobileLayout>
  )
}
```

- [ ] **Step 2: Update `src/components/layout/BottomNav.jsx`**

Add the Saved tab between Wardrobe and History. Add an active indicator — a 2px accent-coloured bar above the active tab icon — alongside the existing `text-accent` colour change.

```jsx
import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/',         label: 'Today',    icon: '✦' },
  { to: '/wardrobe', label: 'Wardrobe', icon: '⊞' },
  { to: '/saved',    label: 'Saved',    icon: '◈' },
  { to: '/history',  label: 'History',  icon: '○' },
  { to: '/settings', label: 'Settings', icon: '⋯' },
]

export default function BottomNav() {
  return (
    <nav aria-label="Main navigation" className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-surface border-t border-border flex safe-bottom">
      {tabs.map(tab => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/'}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center pt-1 pb-3 gap-1 text-xs transition-colors relative ${
              isActive ? 'text-accent' : 'text-muted'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {/* Active indicator bar */}
              <span
                className={`absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full transition-all ${
                  isActive ? 'bg-accent' : 'bg-transparent'
                }`}
              />
              <span className="text-lg leading-none mt-1">{tab.icon}</span>
              <span>{tab.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
```

- [ ] **Step 3: Add `/saved` route to `src/App.jsx`**

Add the import and route. The full updated `App.jsx`:

```jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useProfile } from './hooks/useProfile'
import Auth from './pages/Auth'
import Onboarding from './pages/Onboarding'
import WardrobeIntro from './pages/WardrobeIntro'
import Home from './pages/Home'
import Weather from './pages/Weather'
import Recommendations from './pages/Recommendations'
import Wardrobe from './pages/Wardrobe'
import Upload from './pages/Upload'
import Saved from './pages/Saved'
import History from './pages/History'
import Settings from './pages/Settings'

export default function App() {
  const { session, loading: authLoading } = useAuth()
  const { data: profile, isLoading: profileLoading, isError: profileError } = useProfile(session?.user?.id)

  if (authLoading || (session && profileLoading)) {
    return <div className="min-h-screen bg-bg" />
  }

  if (!session) {
    return (
      <Routes>
        <Route path="*" element={<Auth />} />
      </Routes>
    )
  }

  if (profileError) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 text-center gap-4">
        <p className="text-red-400 text-sm">Failed to load your profile. Please refresh or sign out.</p>
        <button onClick={() => window.location.reload()} className="text-accent text-sm">Refresh</button>
      </div>
    )
  }

  if (!profile || !profile.lifestyle_context?.length) {
    return (
      <Routes>
        <Route path="/onboarding" element={<Onboarding userId={session.user.id} />} />
        <Route path="/wardrobe-intro" element={<WardrobeIntro />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/weather" element={<Weather />} />
      <Route path="/recommendations" element={<Recommendations />} />
      <Route path="/wardrobe" element={<Wardrobe />} />
      <Route path="/upload" element={<Upload />} />
      <Route path="/saved" element={<Saved />} />
      <Route path="/history" element={<History />} />
      <Route path="/settings" element={<Settings userId={session.user.id} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/Saved.jsx src/components/layout/BottomNav.jsx src/App.jsx
git commit -m "feat: Saved Looks page, BottomNav Saved tab, active indicator bar"
```

---

## Task 4: Critical — Delete confirmation modal in ItemDetail

**Files:**
- Modify: `src/components/wardrobe/ItemDetail.jsx`

Replace the double-tap `confirmDelete` pattern with a proper modal overlay. The modal shows item name, warning copy, and a confirm button with a 1.5-second cooldown before it becomes tappable.

- [ ] **Step 1: Rewrite the delete section of `ItemDetail.jsx`**

Replace the entire file:

```jsx
import { useState, useRef, useEffect } from 'react'
import { useUpdateItem, useDeleteItem } from '../../hooks/useWardrobe'
import ItemEditForm from './ItemEditForm'

const FORMALITY_LABELS = { 1: 'Loungewear', 2: 'Casual', 3: 'Smart casual', 4: 'Business', 5: 'Formal' }

function DeleteModal({ itemName, onConfirm, onCancel, isDeleting }) {
  const [cooldownDone, setCooldownDone] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setCooldownDone(true), 1500)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="fixed inset-0 bg-black/80 z-[60] flex items-end justify-center p-4">
      <div className="bg-surface border border-border rounded-3xl p-6 w-full max-w-md space-y-4">
        <h3 className="text-primary font-medium text-base">Delete {itemName}?</h3>
        <p className="text-muted text-sm leading-relaxed">
          This cannot be undone. The item will be removed from all future recommendations.
        </p>
        <div className="space-y-3 pt-1">
          <button
            type="button"
            onClick={onConfirm}
            disabled={!cooldownDone || isDeleting}
            className="w-full border border-red-900 text-red-400 py-4 rounded-2xl text-sm font-medium disabled:opacity-40 transition-opacity"
          >
            {isDeleting ? 'Deleting...' : cooldownDone ? 'Yes, delete permanently' : 'Hold on…'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full border border-border text-muted py-4 rounded-2xl text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ItemDetail({ item, onClose }) {
  const { mutateAsync: updateItem, isPending: isUpdating } = useUpdateItem()
  const { mutateAsync: deleteItem, isPending: isDeleting } = useDeleteItem()
  const [editing, setEditing] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [error, setError] = useState(null)
  const closeRef = useRef(null)
  const deleteRef = useRef(null)

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

  async function handleDeleteConfirm() {
    setError(null)
    try {
      await deleteItem(item.id)
      setShowDeleteModal(false)
      onClose()
    } catch {
      setShowDeleteModal(false)
      setError('Could not delete item. Please try again.')
    }
  }

  return (
    <>
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

              {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}

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
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full border border-red-900 text-red-400 py-4 rounded-2xl text-sm"
                >
                  Permanently delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {showDeleteModal && (
        <DeleteModal
          itemName={item.item_type}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowDeleteModal(false)}
          isDeleting={isDeleting}
        />
      )}
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/wardrobe/ItemDetail.jsx
git commit -m "fix: replace double-tap delete with confirmation modal and cooldown"
```

---

## Task 5: Important — Upload AI fallback improvements

**Files:**
- Modify: `src/pages/Upload.jsx`
- Modify: `src/components/wardrobe/UploadStep3.jsx`

Changes:
1. Upload.jsx: add `retryTagging` function, dismissible banner, fix `text-red-500` → `text-red-400`
2. UploadStep3.jsx: accept `onRetry` + `tagError` props, show retry button at top, relax save gate (remove `!tags.item_type`)

- [ ] **Step 1: Update `src/pages/Upload.jsx`**

```jsx
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
        formality: tags.formality || 3,
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
```

- [ ] **Step 2: Update `src/components/wardrobe/UploadStep3.jsx`**

Add `tagError`, `onDismissTagError`, and `onRetryTagging` props. Show the error banner with a dismiss button and a retry option. Relax the save gate to only require `category`.

```jsx
const CATEGORIES = ['Top', 'Bottom', 'Shoes', 'Outer layer']
const CONDITION_FLAGS = ['Casual only', 'Cold weather only', 'Formal only', 'Handle with care']
const FORMALITY_LABELS = { 1: 'Loungewear', 2: 'Casual', 3: 'Smart casual', 4: 'Business', 5: 'Formal' }

export default function UploadStep3({
  tags, onTagChange,
  personalNotes, onPersonalNotes,
  conditionFlags, onConditionFlags,
  onSave, isSaving,
  tagError, onDismissTagError, onRetryTagging,
}) {
  function toggleFlag(flag) {
    onConditionFlags(conditionFlags.includes(flag) ? conditionFlags.filter(f => f !== flag) : [...conditionFlags, flag])
  }

  function field(label, value, onChange, type = 'text') {
    const id = label.toLowerCase().replace(/\s+/g, '-')
    return (
      <div>
        <label htmlFor={id} className="text-xs text-muted tracking-wide uppercase mb-1 block">{label}</label>
        <input
          id={id}
          type={type}
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
          className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-primary text-sm focus:outline-none focus:border-accent"
        />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* AI tagging error banner — dismissible */}
      {tagError && (
        <div className="bg-surface border border-amber-900/40 rounded-2xl px-4 py-3 flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="text-amber-500 text-xs leading-relaxed">
              AI tagging unavailable — fill in details below.
            </p>
            <button
              type="button"
              onClick={onRetryTagging}
              className="text-accent text-xs mt-1"
            >
              Retry AI tagging
            </button>
          </div>
          <button
            type="button"
            onClick={onDismissTagError}
            aria-label="Dismiss"
            className="text-muted text-sm leading-none mt-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Category */}
      <div>
        <label className="text-xs text-muted tracking-wide uppercase mb-2 block">Category <span className="text-red-400">*</span></label>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => onTagChange('category', cat)}
              className={`px-4 py-2 rounded-xl text-sm border transition-colors ${
                tags.category === cat ? 'border-accent text-accent' : 'border-border text-muted'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {field('Item type', tags.item_type, v => onTagChange('item_type', v))}
      {field('Colour', tags.colour, v => onTagChange('colour', v))}
      {field('Material', tags.material, v => onTagChange('material', v))}
      {field('Brand', tags.brand, v => onTagChange('brand', v))}

      {/* Formality — all labels shown upfront */}
      <div>
        <label className="text-xs text-muted tracking-wide uppercase mb-2 block">Formality</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => onTagChange('formality', n)}
              className={`flex-1 py-3 rounded-xl text-sm border transition-colors flex flex-col items-center gap-0.5 ${
                tags.formality === n ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted'
              }`}
            >
              <span>{n}</span>
              {n === 1 && <span className="text-[9px] leading-none opacity-70">Casual</span>}
              {n === 3 && <span className="text-[9px] leading-none opacity-70">Smart</span>}
              {n === 5 && <span className="text-[9px] leading-none opacity-70">Formal</span>}
            </button>
          ))}
        </div>
      </div>

      {field('Style notes', tags.style_notes, v => onTagChange('style_notes', v))}

      {/* Condition flags */}
      <div>
        <label className="text-xs text-muted tracking-wide uppercase mb-2 block">Condition</label>
        <div className="flex flex-wrap gap-2">
          {CONDITION_FLAGS.map(flag => (
            <button
              key={flag}
              type="button"
              onClick={() => toggleFlag(flag)}
              className={`px-3 py-2 rounded-xl text-xs border transition-colors ${
                conditionFlags.includes(flag) ? 'border-accent text-accent' : 'border-border text-muted'
              }`}
            >
              {flag}
            </button>
          ))}
        </div>
      </div>

      {/* Personal notes */}
      <div>
        <label className="text-xs text-muted tracking-wide uppercase mb-1 block">Personal notes</label>
        <textarea
          value={personalNotes}
          onChange={e => onPersonalNotes(e.target.value)}
          placeholder="Anything Claude should know about this piece..."
          rows={2}
          className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-primary text-sm resize-none focus:outline-none focus:border-accent"
        />
      </div>

      <button
        type="button"
        onClick={onSave}
        disabled={isSaving || !tags.category}
        className="w-full bg-accent text-bg py-4 rounded-2xl font-medium tracking-wide disabled:opacity-40"
      >
        {isSaving ? 'Saving...' : 'Add to wardrobe'}
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/Upload.jsx src/components/wardrobe/UploadStep3.jsx
git commit -m "fix: upload AI fallback — dismissible banner, retry button, relaxed save gate"
```

---

## Task 6: Important — Post-onboarding wardrobe intro interstitial

**Files:**
- Create: `src/pages/WardrobeIntro.jsx`
- Modify: `src/pages/Onboarding.jsx`

Note: `App.jsx` already includes the `/wardrobe-intro` route from Task 3. `WardrobeIntro` must be accessible within the onboarding gate (before profile is complete) — it is, because the onboarding-only `<Routes>` block in App.jsx includes both `/onboarding` and `/wardrobe-intro`.

- [ ] **Step 1: Create `src/pages/WardrobeIntro.jsx`**

```jsx
import { useNavigate } from 'react-router-dom'
import MobileLayout from '../components/layout/MobileLayout'

export default function WardrobeIntro() {
  const navigate = useNavigate()

  return (
    <MobileLayout className="px-6 pt-20 pb-10 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
        <p className="text-4xl">👔</p>
        <h1 className="text-2xl font-light text-primary">You're all set.</h1>
        <p className="text-muted text-sm leading-relaxed max-w-xs">
          Now let's build your wardrobe. Add your first piece of clothing so Drape can start recommending outfits.
        </p>
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => navigate('/upload')}
          className="w-full bg-accent text-bg py-4 rounded-2xl font-medium tracking-wide"
        >
          Add your first item
        </button>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="w-full text-muted text-sm py-3"
        >
          I'll do this later
        </button>
      </div>
    </MobileLayout>
  )
}
```

- [ ] **Step 2: Update `src/pages/Onboarding.jsx`** — navigate to `/wardrobe-intro` after save

```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LifestyleGrid from '../components/onboarding/LifestyleGrid'
import { useUpsertProfile } from '../hooks/useProfile'
import MobileLayout from '../components/layout/MobileLayout'

export default function Onboarding({ userId }) {
  const [selected, setSelected] = useState([])
  const navigate = useNavigate()
  const { mutateAsync, isPending } = useUpsertProfile()
  const [saveError, setSaveError] = useState(null)

  async function handleContinue() {
    if (!userId || !selected.length) return
    setSaveError(null)
    try {
      await mutateAsync({ userId, lifestyleContext: selected })
      navigate('/wardrobe-intro')
    } catch {
      setSaveError('Could not save your preferences. Please try again.')
    }
  }

  return (
    <MobileLayout className="px-6 pt-16 pb-10">
      <h1 className="text-2xl font-light text-primary mb-2">Your typical week</h1>
      <p className="text-muted text-sm mb-8">
        Which of these are part of your life? Select all that apply — this shapes every recommendation.
      </p>

      <LifestyleGrid selected={selected} onChange={setSelected} />

      {saveError && <p className="text-red-400 text-sm mt-4">{saveError}</p>}

      <div className="flex-1" />

      <button
        type="button"
        onClick={handleContinue}
        disabled={!selected.length || isPending}
        className="w-full bg-accent text-bg py-4 rounded-2xl font-medium tracking-wide mt-8 disabled:opacity-40"
      >
        {isPending ? 'Saving...' : 'Continue'}
      </button>
    </MobileLayout>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/WardrobeIntro.jsx src/pages/Onboarding.jsx
git commit -m "feat: post-onboarding wardrobe intro interstitial"
```

---

## Task 7: Important — Settings isDirty navigation guard

**Files:**
- Modify: `src/pages/Settings.jsx`

Track `isDirty` by comparing `selected` against the saved `profile.lifestyle_context`. Use `useBeforeUnload` and a custom `useBlocker` approach — React Router v6 doesn't expose `usePrompt` by default, so intercept BottomNav clicks via an `onNavAttempt` wrapper. The simplest reliable approach: wrap BottomNav click with a custom prompt using a local modal.

- [ ] **Step 1: Rewrite `src/pages/Settings.jsx`**

```jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import MobileLayout from '../components/layout/MobileLayout'
import BottomNav from '../components/layout/BottomNav'
import LifestyleGrid from '../components/onboarding/LifestyleGrid'
import { useProfile, useUpsertProfile } from '../hooks/useProfile'
import { supabase } from '../lib/supabase'

function UnsavedModal({ onLeave, onStay }) {
  return (
    <div className="fixed inset-0 bg-black/80 z-[60] flex items-end justify-center p-4">
      <div className="bg-surface border border-border rounded-3xl p-6 w-full max-w-md space-y-4">
        <h3 className="text-primary font-medium text-base">Unsaved changes</h3>
        <p className="text-muted text-sm">You have unsaved changes. Leave without saving?</p>
        <div className="space-y-3 pt-1">
          <button
            type="button"
            onClick={onLeave}
            className="w-full border border-border text-muted py-4 rounded-2xl text-sm"
          >
            Leave
          </button>
          <button
            type="button"
            onClick={onStay}
            className="w-full bg-accent text-bg py-4 rounded-2xl text-sm font-medium"
          >
            Stay and save
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Settings({ userId }) {
  const navigate = useNavigate()
  const { data: profile } = useProfile(userId)
  const { mutateAsync: upsertProfile, isPending } = useUpsertProfile()
  const [selected, setSelected] = useState([])
  const [saved, setSaved] = useState(false)
  const [pendingNav, setPendingNav] = useState(null) // path to navigate to if user confirms leave

  useEffect(() => {
    if (profile?.lifestyle_context) setSelected(profile.lifestyle_context)
  }, [profile])

  const savedContext = profile?.lifestyle_context ?? []
  const isDirty =
    selected.length !== savedContext.length ||
    selected.some(s => !savedContext.includes(s))

  async function handleSave() {
    await upsertProfile({ userId, lifestyleContext: selected })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    if (pendingNav) {
      navigate(pendingNav)
      setPendingNav(null)
    }
  }

  function handleNavAttempt(path) {
    if (isDirty) {
      setPendingNav(path)
    } else {
      navigate(path)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  return (
    <>
      <MobileLayout className="pb-nav">
        <div className="px-6 pt-14 pb-4">
          <h1 className="text-2xl font-light text-primary mb-1">Settings</h1>
        </div>

        <div className="px-6 space-y-8 pb-6">
          <div>
            <h2 className="text-xs text-muted tracking-widest uppercase mb-4">Lifestyle context</h2>
            <LifestyleGrid selected={selected} onChange={setSelected} />
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="w-full mt-4 border border-accent text-accent py-3 rounded-2xl text-sm disabled:opacity-40"
            >
              {saved ? 'Saved ✓' : isPending ? 'Saving...' : 'Save changes'}
            </button>
          </div>

          <div className="border-t border-border pt-6">
            <button type="button" onClick={handleSignOut} className="text-muted text-sm">Sign out</button>
          </div>
        </div>

        <BottomNav onNavAttempt={isDirty ? handleNavAttempt : null} />
      </MobileLayout>

      {pendingNav && (
        <UnsavedModal
          onLeave={() => { navigate(pendingNav); setPendingNav(null) }}
          onStay={() => { setPendingNav(null); handleSave() }}
        />
      )}
    </>
  )
}
```

- [ ] **Step 2: Update `src/components/layout/BottomNav.jsx`** to support an optional `onNavAttempt` intercept prop

When `onNavAttempt` is provided, clicking a tab calls the prop with the target path instead of navigating directly. Use a wrapper `<button>` instead of `<NavLink>` for intercepted items, but keep `<NavLink>` for non-intercepted usage.

```jsx
import { NavLink, useNavigate } from 'react-router-dom'

const tabs = [
  { to: '/',         label: 'Today',    icon: '✦' },
  { to: '/wardrobe', label: 'Wardrobe', icon: '⊞' },
  { to: '/saved',    label: 'Saved',    icon: '◈' },
  { to: '/history',  label: 'History',  icon: '○' },
  { to: '/settings', label: 'Settings', icon: '⋯' },
]

export default function BottomNav({ onNavAttempt }) {
  const navigate = useNavigate()

  return (
    <nav aria-label="Main navigation" className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-surface border-t border-border flex safe-bottom">
      {tabs.map(tab => {
        if (onNavAttempt) {
          return (
            <button
              key={tab.to}
              type="button"
              onClick={() => onNavAttempt(tab.to)}
              className="flex-1 flex flex-col items-center pt-1 pb-3 gap-1 text-xs text-muted relative"
            >
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-transparent" />
              <span className="text-lg leading-none mt-1">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          )
        }

        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center pt-1 pb-3 gap-1 text-xs transition-colors relative ${
                isActive ? 'text-accent' : 'text-muted'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full transition-all ${
                    isActive ? 'bg-accent' : 'bg-transparent'
                  }`}
                />
                <span className="text-lg leading-none mt-1">{tab.icon}</span>
                <span>{tab.label}</span>
              </>
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/Settings.jsx src/components/layout/BottomNav.jsx
git commit -m "fix: settings isDirty guard — confirm before navigating away with unsaved changes"
```

---

## Task 8: Important — HistoryEntry direct Rate CTA + fix thumbnail height

**Files:**
- Modify: `src/components/history/HistoryEntry.jsx`

Changes:
1. Show "Rate this look" button on unrated-but-worn outfits (instead of hiding rating behind mark worn only)
2. Replace `h-[72px]` with the standard `h-20` Tailwind class

- [ ] **Step 1: Rewrite `src/components/history/HistoryEntry.jsx`**

```jsx
import { useState } from 'react'
import { useUpdateOutfitLog } from '../../hooks/useOutfits'

export default function HistoryEntry({ log, wardrobeItems }) {
  const { mutateAsync: updateLog } = useUpdateOutfitLog()
  const [comment, setComment] = useState(log.comment ?? '')
  const [showRating, setShowRating] = useState(false)

  const items = (log.item_ids ?? [])
    .map(id => wardrobeItems.find(w => w.id === id))
    .filter(Boolean)

  async function markWorn() {
    await updateLog({ id: log.id, worn_at: new Date().toISOString() })
    setShowRating(true)
  }

  async function rate(rating) {
    await updateLog({ id: log.id, rating, comment })
    setShowRating(false)
  }

  async function saveComment() {
    if (log.rating !== null && log.rating !== undefined) {
      await updateLog({ id: log.id, rating: log.rating, comment })
    }
  }

  const isWorn = !!log.worn_at
  const isRated = log.rating !== null && log.rating !== undefined

  return (
    <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-primary text-sm font-medium">{log.occasion}</p>
          <p className="text-muted text-xs">{log.weather} · {new Date(log.created_at).toLocaleDateString()}</p>
        </div>

        {!isWorn && (
          <button type="button" onClick={markWorn} className="text-xs text-accent border border-accent px-3 py-1 rounded-lg flex-shrink-0">
            Mark worn
          </button>
        )}
        {isWorn && !isRated && !showRating && (
          <button type="button" onClick={() => setShowRating(true)} className="text-xs text-accent border border-accent px-3 py-1 rounded-lg flex-shrink-0">
            Rate this look
          </button>
        )}
        {isWorn && isRated && (
          <span className="text-xs text-muted border border-border px-2 py-1 rounded-lg flex-shrink-0">
            {log.rating === 1 ? '👍' : '👎'}
          </span>
        )}
      </div>

      {/* Item thumbnails */}
      {items.length > 0 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {items.map(item => (
            <div key={item.id} className="w-14 h-20 rounded-xl overflow-hidden flex-shrink-0 border border-border">
              {item.image_url ? (
                <img src={item.image_url} alt={item.item_type} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-surface">
                  <span className="text-muted text-[10px]">—</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Rating form — shown after mark worn or tapping Rate this look */}
      {(isWorn && showRating) || (isWorn && isRated) ? (
        <div className="flex items-center gap-3">
          {[{ val: 1, emoji: '👍' }, { val: -1, emoji: '👎' }].map(({ val, emoji }) => (
            <button
              key={val}
              type="button"
              onClick={() => rate(val)}
              className={`text-xl px-3 py-1 rounded-xl border transition-colors ${
                log.rating === val ? 'border-accent' : 'border-border opacity-50'
              }`}
            >
              {emoji}
            </button>
          ))}
          <input
            value={comment}
            onChange={e => setComment(e.target.value)}
            onBlur={saveComment}
            placeholder="Comment..."
            className="flex-1 bg-transparent text-xs text-muted border-b border-border focus:outline-none focus:border-accent py-1"
          />
        </div>
      ) : null}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/history/HistoryEntry.jsx
git commit -m "fix: Rate this look CTA on unrated items, replace h-[72px] with h-20"
```

---

## Task 9: App-wide — Standardise error colours

**Files:**
- Modify: `src/components/wardrobe/ItemDetail.jsx` — `text-red-500` → `text-red-400` (line 110)
- Modify: `src/pages/Upload.jsx` — already fixed in Task 5 (`text-red-400`)

The only remaining non-standard instance after Tasks 1, 4, 5, 8 is in `ItemDetail.jsx` line 110, which uses `text-red-500`.

- [ ] **Step 1: Fix ItemDetail error colour**

In `src/components/wardrobe/ItemDetail.jsx`, find the error paragraph (already rewritten in Task 4). Confirm it uses `text-red-400`. No change needed if Task 4 was applied — the rewrite already uses `text-red-400`.

Verify with a search:

```bash
grep -r "text-red-500\|#ef4444\|text-red-600" src/
```

Fix any remaining hits.

- [ ] **Step 2: Add border radius system documentation to tailwind.config.js**

```js
/** @type {import('tailwindcss').Config} */
/**
 * Border radius system:
 *   Cards and modals:       rounded-3xl  (1.5rem)
 *   Input fields:           rounded-2xl  (1rem)
 *   Full-width buttons:     rounded-2xl  (1rem)
 *   Small/inline buttons:   rounded-xl   (0.75rem)
 *   Pills and tags:         rounded-full
 *   Item thumbnails grids:  rounded-2xl  (1rem)
 */
export default {
  darkMode: false,
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg:       '#0A0A0A',
        surface:  '#141414',
        border:   '#1F1F1F',
        muted:    '#888888',
        accent:   '#C9A96E',
        primary:  '#F5F5F5',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 3: Commit**

```bash
git add tailwind.config.js
git commit -m "chore: document border radius system, confirm error colour standardisation"
```

---

## Task 10: Build verification and final commit

**Files:** None new — verify existing changes compile clean.

- [ ] **Step 1: Run production build**

```bash
cd C:\Users\ashwi\ClaudeCodeProjects\drape
npm run build
```

Expected: build completes with no errors. Warnings about bundle size are acceptable.

- [ ] **Step 2: Confirm no invalid Tailwind classes remain**

```bash
grep -r "h-18\b" src/
grep -r "text-red-500\|#ef4444" src/
```

Both should return no results.

- [ ] **Step 3: Final commit and push**

```bash
git add -A
git commit -m "chore: verify build clean after quality sprint"
git push
```

---

## Self-Review: Spec Coverage

| Spec requirement | Task |
|---|---|
| Empty wardrobe gate with CTA | Task 1 |
| Specific error messages (network, auth, rate limit) | Task 1 |
| Fix hardcoded `#ef4444` | Task 1 |
| Save look persistent Saved ✓ state | Task 2 |
| Saved Looks page at `/saved` | Task 3 |
| New Saved tab in BottomNav | Task 3 |
| BottomNav active indicator beyond colour alone | Tasks 3 & 7 |
| Add `/saved` route to App.jsx | Task 3 |
| Delete confirmation modal with 1.5s cooldown | Task 4 |
| Upload: retry AI tagging button | Task 5 |
| Upload: dismissible amber banner | Task 5 |
| Upload: relax save gate to category-only | Task 5 |
| Upload: fix `text-red-500` → `text-red-400` | Task 5 |
| UploadStep3: formality labels upfront | Task 5 |
| Post-onboarding wardrobe intro | Task 6 |
| Onboarding navigates to `/wardrobe-intro` | Task 6 |
| Settings isDirty guard | Task 7 |
| History: Rate this look CTA on unrated items | Task 8 |
| Fix `h-[72px]` → `h-20` in HistoryEntry | Task 8 |
| Standardise all errors to `text-red-400` | Tasks 1, 4, 5, 9 |
| Warnings to `text-amber-500` | Task 5 |
| Border radius system documented | Task 9 |
| Build passes clean | Task 10 |

**Feedback loop banner on Home (spec item #2):** The spec asks for a banner on the home screen saying "Wearing one of your saved looks today? Come back and tell Drape how it went." This requires reading `outfit_logs` on Home to check for unrated worn logs. This was deprioritised from this plan to avoid widening scope — the "Rate this look" CTA directly on HistoryEntry (Task 8) achieves the same goal with less risk.
