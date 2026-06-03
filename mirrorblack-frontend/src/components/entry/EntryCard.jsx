import { Link } from 'react-router-dom'
import { formatDate } from '../../utils/formatDate'
import { EntryTag } from './EntryTag'

export const EntryCard = ({ entry }) => {
  const tags = entry.tags || []

  return (
    <Link to={`/entries/${entry.id || entry._id}`} className="block border-b border-black-border py-8 group hover:bg-black-soft transition-colors px-4 -mx-4">
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono text-sm text-white-muted">
          {formatDate(entry.createdAt)}
        </span>
        {entry.isLocked && (
          <span className="font-mono text-xs text-white-faint uppercase tracking-widest">Locked</span>
        )}
      </div>
      <p className="font-mono text-white text-base leading-relaxed mb-6 line-clamp-3">
        {entry.content}
      </p>
      {tags.length > 0 && (
        <div className="flex flex-wrap">
          {tags.map((tag, idx) => (
            <EntryTag key={idx} tag={tag} />
          ))}
        </div>
      )}
    </Link>
  )
}
