import { useState, useCallback } from 'react'
import { entriesApi } from '../api/entries.api'

export const useEntries = () => {
  const [entries, setEntries] = useState([])
  const [pagination, setPagination] = useState({ page: 1, total: 0, hasMore: false })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchEntries = useCallback(async (page = 1) => {
    setLoading(true)
    setError(null)
    try {
      const data = await entriesApi.getEntries(page)
      if (page === 1) {
        setEntries(data.entries || data)
      } else {
        setEntries(prev => [...prev, ...(data.entries || data)])
      }
      setPagination({
        page,
        total: data.total || 0,
        hasMore: data.hasMore || false
      })
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load entries.')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadMore = () => {
    if (pagination.hasMore && !loading) {
      fetchEntries(pagination.page + 1)
    }
  }

  const createEntry = async (content) => {
    setLoading(true)
    setError(null)
    try {
      const newEntry = await entriesApi.createEntry(content)
      setEntries(prev => [newEntry, ...prev])
      return newEntry
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create entry.')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateEntry = async (id, content) => {
    setLoading(true)
    setError(null)
    try {
      const updated = await entriesApi.updateEntry(id, content)
      setEntries(prev => prev.map(e => (e.id === id || e._id === id) ? updated : e))
      return updated
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update entry.')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const deleteEntry = async (id) => {
    setLoading(true)
    setError(null)
    try {
      await entriesApi.deleteEntry(id)
      setEntries(prev => prev.filter(e => e.id !== id && e._id !== id))
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete entry.')
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    entries,
    pagination,
    loading,
    error,
    fetchEntries,
    loadMore,
    createEntry,
    updateEntry,
    deleteEntry
  }
}
