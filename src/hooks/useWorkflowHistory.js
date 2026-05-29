import { useEffect } from 'react'
import { useUndo, useRedo, useCanUndo, useCanRedo } from '@/hooks/useWorkflowStore'

/**
 * Gắn keyboard shortcut Ctrl+Z (undo) và Ctrl+Shift+Z / Ctrl+Y (redo).
 * Mount hook này 1 lần duy nhất trong FlowCanvas hoặc WorkflowDesigner page.
 *
 * Cũng export canUndo / canRedo để CanvasToolbar hiển thị trạng thái nút.
 *
 * Usage:
 *   const { canUndo, canRedo, undo, redo } = useWorkflowHistory()
 */
const useWorkflowHistory = () => {
  const undo = useUndo()
  const redo = useRedo()
  const canUndo = useCanUndo()
  const canRedo = useCanRedo()

  useEffect(() => {
    const handleKeyDown = (e) => {
      const isMac = navigator.platform?.toUpperCase().includes('MAC')
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey

      if (!ctrlOrCmd) return

      // Không trigger khi đang gõ trong input / textarea / contenteditable
      const tag = document.activeElement?.tagName?.toLowerCase()
      const isEditing =
        tag === 'input' ||
        tag === 'textarea' ||
        document.activeElement?.isContentEditable

      if (isEditing) return

      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
        return
      }

      if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
        e.preventDefault()
        redo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])

  return { canUndo, canRedo, undo, redo }
}

export default useWorkflowHistory
