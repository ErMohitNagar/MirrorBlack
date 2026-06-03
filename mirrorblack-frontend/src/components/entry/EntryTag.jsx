export const EntryTag = ({ tag }) => {
  return (
    <span className="inline-block font-mono text-xs text-white-muted border border-black-border px-3 py-1 mr-2 mb-2 uppercase tracking-widest">
      {tag?.label || tag}
    </span>
  )
}
