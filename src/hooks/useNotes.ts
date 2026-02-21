import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'
import { Note, NoteColor, Section, Session } from '@/types'

export function useNotes(boardId: string, session: Session | null, currentUser: any) {
  const createNote = useMutation(api.notes.create)
  const updateNote = useMutation(api.notes.update)
  const moveNote = useMutation(api.notes.move)
  const deleteNote = useMutation(api.notes.remove)
  const voteNote = useMutation(api.notes.vote)

  const handleAddNote = async (
    content: string,
    color: NoteColor,
    sectionId: string,
    position?: { x: number; y: number }
  ) => {
    if (!currentUser || !session) return

    const finalPosition = position || {
      x: 5 + Math.random() * 30,
      y: 5 + Math.random() * 30,
    }

    try {
      await createNote({
        boardId: boardId as Id<'boards'>,
        sectionId: sectionId as Id<'sections'>,
        content,
        color,
        positionX: finalPosition.x,
        positionY: finalPosition.y,
      })
    } catch (error) {
      console.error('Failed to add note:', error)
    }
  }

  const handleUpdateNote = async (id: string, updates: Partial<Note>) => {
    try {
      const updateData: {
        noteId: Id<'notes'>
        content?: string
        positionX?: number
        positionY?: number
        sectionId?: Id<'sections'>
        color?: NoteColor
      } = { noteId: id as Id<'notes'> }

      if (updates.content !== undefined) updateData.content = updates.content
      if (updates.position) {
        updateData.positionX = updates.position.x
        updateData.positionY = updates.position.y
      }
      if (updates.sectionId) updateData.sectionId = updates.sectionId as Id<'sections'>
      if (updates.color) updateData.color = updates.color

      await updateNote(updateData)
    } catch (error) {
      console.error('Failed to update note:', error)
    }
  }

  const handleDeleteNote = async (id: string) => {
    try {
      await deleteNote({ noteId: id as Id<'notes'> })
    } catch (error) {
      console.error('Failed to delete note:', error)
    }
  }

  const handleVote = async (noteId: string) => {
    try {
      await voteNote({
        noteId: noteId as Id<'notes'>,
        boardId: boardId as Id<'boards'>,
      })
    } catch (error) {
      console.error('Failed to vote:', error)
    }
  }

  const canSeeNote = (note: Note): 'full' | 'ghost' | 'hidden' => {
    if (!session) return 'hidden'
    if (session.phase === 'writing') {
      return note.createdBy === currentUser.name ? 'full' : 'ghost'
    }
    return 'full'
  }

  const canEditNote = (note: Note) => {
    return note.createdBy === currentUser?.name
  }

  const getRemainingVotes = () => {
    if (!session || !currentUser) return 0
    const usedVotes = session.notes.reduce((count, note) => count + (note.votes?.includes(currentUser.id) ? 1 : 0), 0)
    return session.votesPerPerson - usedVotes
  }

  const hasVotedForNote = (note: Note) => {
    if (!currentUser) return false
    return note.votes?.includes(currentUser.id) || false
  }

  const isActionsSection = (section: Section): boolean => {
    const name = section.name.toLowerCase()
    return name.includes('action') || name.includes('todo') || name.includes('next step')
  }

  const handleCreateAction = async (sourceNote: Note) => {
    if (!session) return

    const actionsSection = session.sections.find(s => isActionsSection(s))
    if (!actionsSection) {
      alert('No actions section found! Add a section with "Action" in the name.')
      return
    }

    await handleAddNote(`ACTION: ${sourceNote.content}`, actionsSection.color, actionsSection.id)
  }

  const handleNoteDragEnd = async (
    noteId: string,
    clientX: number,
    clientY: number,
    sectionRefs: React.MutableRefObject<Map<string, HTMLDivElement | null>>
  ) => {
    if (!session) return

    const noteCenterX = clientX + 80
    const noteCenterY = clientY + 60

    for (const [sectionId, ref] of sectionRefs.current.entries()) {
      if (ref) {
        const rect = ref.getBoundingClientRect()
        if (
          noteCenterX >= rect.left &&
          noteCenterX <= rect.right &&
          noteCenterY >= rect.top &&
          noteCenterY <= rect.bottom
        ) {
          const xPercent = Math.max(2, Math.min(85, ((clientX - rect.left) / rect.width) * 100))
          const yPercent = Math.max(2, Math.min(85, ((clientY - rect.top) / rect.height) * 100))

          const note = session.notes.find(n => n.id === noteId)
          const targetSection = session.sections.find(s => s.id === sectionId)

          if (note) {
            const moveData: {
              noteId: Id<'notes'>
              positionX: number
              positionY: number
              sectionId?: Id<'sections'>
            } = {
              noteId: noteId as Id<'notes'>,
              positionX: xPercent,
              positionY: yPercent,
            }

            if (note.sectionId !== sectionId) {
              moveData.sectionId = sectionId as Id<'sections'>
            }

            try {
              await moveNote(moveData)

              if (note.sectionId !== sectionId && targetSection && canEditNote(note)) {
                await updateNote({
                  noteId: noteId as Id<'notes'>,
                  color: targetSection.color,
                })
              }
            } catch (error) {
              console.error('Failed to move note:', error)
            }
          }
          break
        }
      }
    }
  }

  return {
    handleAddNote,
    handleUpdateNote,
    handleDeleteNote,
    handleVote,
    handleCreateAction,
    handleNoteDragEnd,
    canSeeNote,
    canEditNote,
    getRemainingVotes,
    hasVotedForNote,
    isActionsSection,
  }
}
