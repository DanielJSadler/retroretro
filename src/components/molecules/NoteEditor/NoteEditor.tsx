'use client'

import { useLayoutEffect, useRef } from 'react'

interface NoteEditorProps {
  value: string
  onChange: (value: string) => void
  onSave: () => void
  onCancel: () => void
  busy?: boolean
  saveLabel?: string
}

export default function NoteEditor({ value, onChange, onSave, onCancel, busy = false, saveLabel = 'Save' }: NoteEditorProps) {
  const textarea = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => {
    if (!textarea.current) return
    textarea.current.style.height = 'auto'
    textarea.current.style.height = `${textarea.current.scrollHeight}px`
  }, [value])

  return (
    <div className="flex min-w-0 flex-col gap-2" onClick={event => event.stopPropagation()} onMouseDown={event => event.stopPropagation()}>
      <textarea
        ref={textarea}
        aria-label="Note content"
        value={value}
        onChange={event => onChange(event.target.value)}
        onKeyDown={event => {
          if (event.nativeEvent.isComposing || busy) return
          if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); onSave() }
          if (event.key === 'Escape') { event.preventDefault(); onCancel() }
        }}
        className="w-full min-h-[80px] p-2 text-base md:text-lg bg-white/40 border border-black/10 rounded-md focus:outline-none focus:ring-2 focus:ring-black/20 focus:bg-white/60 resize-none overflow-hidden leading-snug placeholder-gray-500/50"
        rows={1}
        placeholder="Write your thought..."
        autoFocus
      />
      <div className="flex flex-wrap justify-end gap-2">
        <span className="mr-auto self-center text-[10px] text-gray-500">Enter to save, Shift+Enter for new line</span>
        <button type="button" onClick={onCancel} disabled={busy} className="rounded bg-black/10 px-3 py-1 text-xs font-bold text-gray-800 hover:bg-black/20 disabled:opacity-50">Cancel</button>
        <button type="button" onClick={onSave} disabled={busy} className="rounded bg-black/80 px-3 py-1 text-xs font-bold text-white shadow-sm hover:bg-black disabled:opacity-50">{saveLabel}</button>
      </div>
    </div>
  )
}
