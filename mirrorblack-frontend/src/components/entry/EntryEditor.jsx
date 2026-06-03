import { useState } from 'react'
import { Textarea } from '../ui/Textarea'
import { Button } from '../ui/Button'
import { useEntries } from '../../hooks/useEntries'

export const EntryEditor = ({ entry, onCancel, onSave }) => {
  const [content, setContent] = useState(entry.content)
  const { updateEntry, loading, error } = useEntries()

  const handleSave = async () => {
    if (content.trim().length < 10) return
    try {
      const updated = await updateEntry(entry.id || entry._id, content)
      onSave(updated)
    } catch (err) {
      // error is handled by the hook
    }
  }

  return (
    <div className="w-full flex flex-col h-[60vh]">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="mb-4"
        disabled={loading}
      />
      {error && <span className="text-[#8b2020] text-sm mb-4 font-mono">{error}</span>}
      <div className="flex items-center space-x-6 mt-auto">
        <Button onClick={handleSave} isLoading={loading} disabled={content.trim().length < 10}>
          Save
        </Button>
        <Button variant="ghost" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
