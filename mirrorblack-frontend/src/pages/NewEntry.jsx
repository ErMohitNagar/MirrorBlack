import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEntries } from '../hooks/useEntries'
import { reflectionsApi } from '../api/reflections.api'
import { Textarea } from '../components/ui/Textarea'
import { Button } from '../components/ui/Button'
import { formatDate } from '../utils/formatDate'

export const NewEntry = () => {
  const [content, setContent] = useState('')
  const [status, setStatus] = useState('idle')
  const { createEntry } = useEntries()
  const navigate = useNavigate()
  const today = new Date().toISOString()

  const handleSubmit = async () => {
    if (content.trim().length < 10) return
    setStatus('submitting')
    try {
      const entry = await createEntry(content)
      setStatus('analyzing')
      
      try {
        await reflectionsApi.createReflection(entry.id || entry._id)
      } catch (err) {
        // Reflection failed, we still navigate
      }
      
      navigate(`/entries/${entry.id || entry._id}`)
    } catch (err) {
      setStatus('idle')
    }
  }

  if (status === 'analyzing') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <p className="font-mono text-white-muted text-lg">Analyzing...</p>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-120px)] flex flex-col pt-8">
      <div className="flex justify-between items-center mb-12">
        <button 
          onClick={() => navigate('/dashboard')}
          className="font-mono text-white hover:text-white-muted transition-colors"
        >
          ← Back
        </button>
        <span className="font-mono text-white-muted text-sm">
          {formatDate(today)}
        </span>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start typing..."
          autoFocus
          className="flex-1 text-xl leading-loose"
          disabled={status !== 'idle'}
        />
      </div>

      <div className="mt-8 flex justify-between items-center py-6 border-t border-black-border">
        <span className="font-mono text-sm text-white-faint">
          {content.length} / 10000
        </span>
        <Button 
          onClick={handleSubmit} 
          disabled={content.trim().length < 10 || status !== 'idle'}
          isLoading={status === 'submitting'}
        >
          {status === 'submitting' ? 'Submitted' : 'Submit'}
        </Button>
      </div>
    </div>
  )
}
