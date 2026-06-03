import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEntries } from '../hooks/useEntries'
import { EntryCard } from '../components/entry/EntryCard'
import { Button } from '../components/ui/Button'

export const Dashboard = () => {
  const { entries, fetchEntries, loadMore, pagination, loading, error } = useEntries()
  const navigate = useNavigate()

  useEffect(() => {
    fetchEntries(1)
  }, [fetchEntries])

  return (
    <div className="pt-8 relative min-h-screen">
      <div className="flex justify-between items-center mb-12">
        <h2 className="font-mono text-sm text-white-muted uppercase tracking-widest">
          {pagination.total} entries
        </h2>
        <div className="hidden md:block">
          <Button onClick={() => navigate('/entries/new')} variant="outline" className="text-sm px-4 py-2">
            New entry
          </Button>
        </div>
      </div>

      {error && <p className="text-[#8b2020] font-mono mb-8">{error}</p>}

      {!loading && entries.length === 0 && !error && (
        <div className="mt-32 text-center">
          <p className="font-mono text-white-muted text-lg">No entries.</p>
        </div>
      )}

      <div className="space-y-0">
        {entries.map(entry => (
          <EntryCard key={entry.id || entry._id} entry={entry} />
        ))}
      </div>

      {pagination.hasMore && (
        <div className="mt-16 mb-24 text-center">
          <Button variant="outline" onClick={loadMore} isLoading={loading} className="mx-auto">
            Load more
          </Button>
        </div>
      )}

      {loading && entries.length === 0 && (
        <p className="font-mono text-white-muted mt-8">Loading...</p>
      )}

      <div className="md:hidden fixed bottom-6 right-6 z-10">
        <Button onClick={() => navigate('/entries/new')} className="shadow-none">
          New entry
        </Button>
      </div>
    </div>
  )
}
