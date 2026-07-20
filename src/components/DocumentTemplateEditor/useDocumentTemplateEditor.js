import { useCallback, useMemo, useState } from 'react'
import { arrayMove } from '@dnd-kit/sortable'
import { createDocumentNode, createEmptyTemplate, serializeTemplate } from './utils'

const cloneTemplate = (template) => JSON.parse(JSON.stringify(template))

const useDocumentTemplateEditor = ({ initialTemplate, dataSchema, documentType }) => {
  const [template, setTemplate] = useState(() => cloneTemplate(
    initialTemplate ?? createEmptyTemplate({ documentType }),
  ))
  const [selectedNodeId, setSelectedNodeId] = useState(null)
  const [history, setHistory] = useState([])
  const [future, setFuture] = useState([])

  const commit = useCallback((updater) => {
    setTemplate(current => {
      const next = typeof updater === 'function' ? updater(current) : updater
      if (next === current) return current
      setHistory(items => [...items.slice(-29), cloneTemplate(current)])
      setFuture([])
      return next
    })
  }, [])

  const addNode = useCallback((type, index) => {
    const node = createDocumentNode(type, dataSchema)
    commit(current => {
      const nodes = [...(current.nodes ?? [])]
      const targetIndex = Number.isInteger(index) ? index : nodes.length
      nodes.splice(targetIndex, 0, node)
      return { ...current, nodes }
    })
    setSelectedNodeId(node.id)
  }, [commit, dataSchema])

  const updateNode = useCallback((nodeId, changes) => {
    commit(current => ({
      ...current,
      nodes: current.nodes.map(node => (
        node.id === nodeId
          ? { ...node, ...(typeof changes === 'function' ? changes(node) : changes) }
          : node
      )),
    }))
  }, [commit])

  const removeNode = useCallback((nodeId) => {
    commit(current => ({ ...current, nodes: current.nodes.filter(node => node.id !== nodeId) }))
    setSelectedNodeId(current => current === nodeId ? null : current)
  }, [commit])

  const duplicateNode = useCallback((nodeId) => {
    commit(current => {
      const index = current.nodes.findIndex(node => node.id === nodeId)
      if (index < 0) return current
      const source = current.nodes[index]
      const copy = createDocumentNode(source.type, dataSchema)
      const nodes = [...current.nodes]
      nodes.splice(index + 1, 0, { ...cloneTemplate(source), id: copy.id })
      setSelectedNodeId(copy.id)
      return { ...current, nodes }
    })
  }, [commit, dataSchema])

  const moveNode = useCallback((activeId, overId) => {
    if (!overId || activeId === overId) return
    commit(current => {
      const oldIndex = current.nodes.findIndex(node => node.id === activeId)
      const newIndex = current.nodes.findIndex(node => node.id === overId)
      if (oldIndex < 0 || newIndex < 0) return current
      return { ...current, nodes: arrayMove(current.nodes, oldIndex, newIndex) }
    })
  }, [commit])

  const updateTemplate = useCallback((changes) => {
    commit(current => ({ ...current, ...changes }))
  }, [commit])

  const undo = useCallback(() => {
    setHistory(items => {
      if (!items.length) return items
      const previous = items[items.length - 1]
      setTemplate(current => {
        setFuture(next => [cloneTemplate(current), ...next].slice(0, 30))
        return previous
      })
      return items.slice(0, -1)
    })
  }, [])

  const redo = useCallback(() => {
    setFuture(items => {
      if (!items.length) return items
      const next = items[0]
      setTemplate(current => {
        setHistory(previous => [...previous, cloneTemplate(current)].slice(-30))
        return next
      })
      return items.slice(1)
    })
  }, [])

  const selectedNode = useMemo(
    () => template.nodes.find(node => node.id === selectedNodeId) ?? null,
    [selectedNodeId, template.nodes],
  )

  return {
    template,
    serializedTemplate: serializeTemplate(template),
    selectedNode,
    selectedNodeId,
    canUndo: history.length > 0,
    canRedo: future.length > 0,
    setSelectedNodeId,
    addNode,
    updateNode,
    removeNode,
    duplicateNode,
    moveNode,
    updateTemplate,
    undo,
    redo,
  }
}

export default useDocumentTemplateEditor
