interface Cursor {
  id: string
  userId?: string
  name: string
  cursorX?: number
  cursorY?: number
}

interface CursorOverlayProps {
  cursors?: Cursor[]
  currentUserId?: string
}

const CURSOR_COLORS = [
  { border: 'border-l-red-500', bg: 'bg-red-500' },
  { border: 'border-l-orange-500', bg: 'bg-orange-500' },
  { border: 'border-l-amber-500', bg: 'bg-amber-500' },
  { border: 'border-l-lime-500', bg: 'bg-lime-500' },
  { border: 'border-l-green-500', bg: 'bg-green-500' },
  { border: 'border-l-emerald-500', bg: 'bg-emerald-500' },
  { border: 'border-l-teal-500', bg: 'bg-teal-500' },
  { border: 'border-l-cyan-500', bg: 'bg-cyan-500' },
  { border: 'border-l-sky-500', bg: 'bg-sky-500' },
  { border: 'border-l-blue-500', bg: 'bg-blue-500' },
  { border: 'border-l-indigo-500', bg: 'bg-indigo-500' },
  { border: 'border-l-violet-500', bg: 'bg-violet-500' },
  { border: 'border-l-purple-500', bg: 'bg-purple-500' },
  { border: 'border-l-fuchsia-500', bg: 'bg-fuchsia-500' },
  { border: 'border-l-pink-500', bg: 'bg-pink-500' },
  { border: 'border-l-rose-500', bg: 'bg-rose-500' },
]

function getCursorColor(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length]
}

export default function CursorOverlay({ cursors, currentUserId }: CursorOverlayProps) {
  if (!cursors) return null

  return (
    <>
      {cursors
        .filter(c => c.cursorX !== undefined && c.cursorY !== undefined && c.userId !== currentUserId)
        .map(cursor => {
          const color = getCursorColor(cursor.userId || cursor.id)
          return (
            <div
              key={cursor.id}
              className="absolute z-50 pointer-events-none transition-all duration-300 ease-linear"
              style={{ left: cursor.cursorX, top: cursor.cursorY }}
            >
              <div
                className={`-rotate-135 inline-block w-0 h-0 border-solid border-t-[5px] border-r-0 border-l-[10px] border-b-[6px] border-r-transparent border-t-transparent border-b-transparent ${color.border}`}
              />
              <p
                className={`whitespace-nowrap translate-x-3 -translate-y-2 text-xs font-semibold text-white px-1.5 py-0.5 rounded shadow-sm ${color.bg}`}
              >
                {cursor.name}
              </p>
            </div>
          )
        })}
    </>
  )
}
