import { useState } from 'react'
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
  const navigate = useNavigate()

  const filtered = items.filter(i => i.status === filter)

  return (
    <MobileLayout className="pb-nav">
      <div className="px-6 pt-14 pb-4 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-light text-primary">Wardrobe</h1>
          <p className="text-muted text-sm">{items.filter(i => i.status === 'active').length} active items</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/upload')}
          className="bg-accent text-bg px-5 py-2.5 rounded-2xl text-sm font-medium"
        >
          + Add
        </button>
      </div>

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
        ) : (
          <WardrobeGrid items={filtered} onItemClick={setSelected} />
        )}
      </div>

      {selected && <ItemDetail item={selected} onClose={() => setSelected(null)} />}

      <BottomNav />
    </MobileLayout>
  )
}
