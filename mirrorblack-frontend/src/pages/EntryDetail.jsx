import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { entriesApi } from '../api/entries.api'
import { reflectionsApi } from '../api/reflections.api'
import { useEntries } from '../hooks/useEntries'
import { formatDate } from '../utils/formatDate'
import { EntryTag } from '../components/entry/EntryTag'
import { ReflectionBlock } from '../components/reflection/ReflectionBlock'
import { EntryEditor } from '../components/entry/EntryEditor'

export const EntryDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { deleteEntry } = useEntries()
  const [entry, setEntry] = useState(null)
  const [reflection, setReflection] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [generatingRef, setGeneratingRef] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        const entryData = await entriesApi.getEntry(id)
        setEntry(entryData.entry || entryData)
        try {
          const refData = await reflectionsApi.getReflection(id)
          setReflection(refData.reflection || refData)
        } catch (e) {
          // Reflection might not exist yet
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load entry.')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id])

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        await deleteEntry(id)
        navigate('/dashboard')
      } catch (err) {
        alert('Failed to delete entry.')
      }
    }
  }

  const handleGenerateReflection = async () => {
    setGeneratingRef(true)
    try {
      const data = await reflectionsApi.createReflection(id)
      setReflection(data.reflection || data)
    } catch (err) {
      alert('Failed to generate reflection.')
    } finally {
      setGeneratingRef(false)
    }
  }

  if (loading) {
    return <p className="font-mono text-white-muted pt-8">Loading...</p>
  }

  if (error || !entry) {
    return <p className="text-[#8b2020] font-mono pt-8">{error || 'Entry not found.'}</p>
  }

  return (
    <div className="pt-8 pb-24 relative max-w-[680px] mx-auto">
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center space-x-4">
          <span className="font-mono text-white-muted text-sm">
            {formatDate(entry.createdAt)}
          </span>
          {entry.isLocked && (
            <span className="font-mono text-xs text-white-faint uppercase tracking-widest">Locked</span>
          )}
        </div>
        <div className="flex items-center space-x-4">
          {!entry.isLocked && !isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              className="font-mono text-sm text-white-muted hover:text-white transition-colors"
            >
              Edit
            </button>
          )}
          <button 
            onClick={handleDelete}
            className="font-mono text-sm text-[#8b2020] hover:text-[#ff3b3b] transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {isEditing ? (
        <EntryEditor 
          entry={entry} 
          onCancel={() => setIsEditing(false)}
          onSave={(updated) => {
            setEntry(updated)
            setIsEditing(false)
          }}
        />
      ) : (
        <>
          <div className="font-mono text-white text-lg leading-relaxed mb-16 space-y-6">
            {entry.content?.split('\n').map((paragraph, idx) => (
              paragraph.trim() ? <p key={idx}>{paragraph}</p> : null
            ))}
          </div>

          {(entry.tags && entry.tags.length > 0) && (
            <div className="mb-8">
              <h4 className="font-mono text-xs text-white-faint uppercase tracking-[0.1em] mb-4">Detected</h4>
              <div className="flex flex-wrap">
                {entry.tags.map((tag, idx) => (
                  <EntryTag key={idx} tag={tag} />
                ))}
              </div>
            </div>
          )}

          <ReflectionBlock 
            reflection={reflection} 
            onGenerate={handleGenerateReflection}
            isGenerating={generatingRef}
          />
        </>
      )}
    </div>
  )
}
