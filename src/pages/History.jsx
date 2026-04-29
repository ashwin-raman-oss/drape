import MobileLayout from '../components/layout/MobileLayout'
import BottomNav from '../components/layout/BottomNav'
import HistoryEntry from '../components/history/HistoryEntry'
import { useOutfitLogs } from '../hooks/useOutfits'
import { useWardrobe } from '../hooks/useWardrobe'

export default function History() {
  const { data: logs = [], isLoading } = useOutfitLogs()
  const { data: wardrobe = [] } = useWardrobe()

  return (
    <MobileLayout className="pb-nav">
      <div className="px-6 pt-14 pb-4">
        <h1 className="text-2xl font-serif font-light tracking-wide text-primary">History</h1>
        <p className="text-muted text-sm">Your outfit decisions over time.</p>
      </div>

      <div className="px-6 pb-6">
        {isLoading && <p className="text-muted text-sm text-center py-10">Loading...</p>}
        {!isLoading && !logs.length && (
          <p className="text-muted text-sm text-center py-10">No outfits logged yet.</p>
        )}
        {logs.map(log => (
          <HistoryEntry key={log.id} log={log} wardrobeItems={wardrobe} />
        ))}
      </div>

      <BottomNav />
    </MobileLayout>
  )
}
