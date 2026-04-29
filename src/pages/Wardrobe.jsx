import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import MobileLayout from '../components/layout/MobileLayout'
import BottomNav from '../components/layout/BottomNav'
import WardrobeGrid from '../components/wardrobe/WardrobeGrid'
import ItemDetail from '../components/wardrobe/ItemDetail'
import { useWardrobe } from '../hooks/useWardrobe'

export default function Wardrobe() {
  const { data: items = [], isLoading } = useWardrobe()
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('active')
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const activeCount = useMemo(() => items.filter(i => i.status === 'active').length, [items])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return items.filter(i => {
      if (i.status !== filter) return false
      if (!term) return true
      return (
        i.item_type?.toLowerCase().includes(term) ||
        i.colour?.toLowerCase().includes(term) ||
        i.brand?.toLowerCase().includes(term) ||
        i.style_notes?.toLowerCase().includes(term)
      )
    })
  }, [items, filter, search])

  return (
    <MobileLayout className="pb-nav">
      <div className="px-6 pt-14 pb-4 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-light text-primary">Wardrobe</h1>
          <p className="text-muted text-sm">{activeCount} active items</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/upload')}
          className="bg-accent text-bg px-5 py-2.5 rounded-2xl text-sm font-medium"
        >
          + Add
        </button>
      </div>

      {/* Search bar */}
      <div className="px-6 mb-4 relative">
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by colour, brand or type…"
          className="w-full bg-surface border border-border rounded-2xl px-4 py-3 pr-10 text-primary text-sm placeholder:text-muted focus:outline-none focus:border-accent"
        />
        {search && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setSearch('')}
            className="absolute right-9 top-1/2 -translate-y-1/2 text-muted text-sm leading-none"
          >
            ✕
          </button>
        )}
      </div>

      {/* Category filter tabs */}
      <div className="flex px-6 mb-4 gap-3">
        {['active', 'archived'].map(f => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm capitalize transition-colors ${
              filter === f ? 'bg-surface border border-accent text-accent' : 'text-muted'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="px-6">
        {isLoading ? (
          <div className="text-center py-16 text-muted text-sm">Loading...</div>
        ) : filtered.length === 0 && search ? (
          <p className="text-center py-16 text-muted text-sm">No items match "{search}"</p>
        ) : (
          <WardrobeGrid items={filtered} onItemClick={setSelected} />
        )}
      </div>

      {selected && <ItemDetail item={selected} onClose={() => setSelected(null)} />}

      <BottomNav />
    </MobileLayout>
  )
}
