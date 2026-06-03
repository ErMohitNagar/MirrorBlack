export const ReflectionBlock = ({ reflection, onGenerate, isGenerating }) => {
  if (!reflection && !isGenerating) {
    return (
      <div className="mt-16 pt-12 border-t border-black-border">
        <p className="font-mono text-white-muted mb-6">No reflection generated.</p>
        <button 
          onClick={onGenerate}
          className="font-mono text-sm text-white hover:text-accent transition-colors underline underline-offset-4"
        >
          Generate reflection
        </button>
      </div>
    )
  }

  if (isGenerating) {
    return (
      <div className="mt-16 pt-12 border-t border-black-border">
        <p className="font-mono text-white-muted">Analyzing...</p>
      </div>
    )
  }

  return (
    <div className="mt-16 pt-12 border-t border-black-border">
      <h3 className="font-display text-sm uppercase tracking-[0.2em] text-white-faint mb-8">
        MIRRORBLACK
      </h3>
      <div className="font-mono text-white leading-relaxed space-y-6 text-lg">
        {reflection.content?.split('\n').map((paragraph, idx) => (
          paragraph.trim() ? <p key={idx}>{paragraph}</p> : null
        ))}
      </div>
      {reflection.question && (
        <p className="font-display text-2xl italic text-white mt-12 w-full leading-snug">
          {reflection.question}
        </p>
      )}
    </div>
  )
}
