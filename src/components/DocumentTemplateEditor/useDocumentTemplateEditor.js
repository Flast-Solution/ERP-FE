import { useCallback, useMemo, useState } from 'react'
import { arrayMove } from '@dnd-kit/sortable'
import { createDocumentNode, createEmptyTemplate, createNodeId, serializeTemplate } from './utils'

const cloneTemplate = (template) => JSON.parse(JSON.stringify(template))

const cloneNodeWithNewIds = node => ({
  ...cloneTemplate(node),
  id: createNodeId(),
  children: node.children?.map(cloneNodeWithNewIds),
})

const findNode = (nodes = [], nodeId) => {
  for (const node of nodes) {
    if (node.id === nodeId) return node
    const nested = findNode(node.children, nodeId)
    if (nested) return nested
  }
  return null
}

const updateNodeTree = (nodes = [], nodeId, updater) => nodes.map(node => {
  if (node.id === nodeId) return updater(node)
  if (!node.children?.length) return node
  return { ...node, children: updateNodeTree(node.children, nodeId, updater) }
})

const removeNodeTree = (nodes = [], nodeId) => nodes
  .filter(node => node.id !== nodeId)
  .map(node => node.children?.length
    ? { ...node, children: removeNodeTree(node.children, nodeId) }
    : node)

const duplicateNodeTree = (nodes = [], nodeId, copy) => {
  const result = []
  nodes.forEach((node) => {
    result.push(node)
    if (node.id === nodeId) {
      result.push(copy)
      return
    }
    if (node.children?.length) {
      result[result.length - 1] = { ...node, children: duplicateNodeTree(node.children, nodeId, copy) }
    }
  })
  return result
}

const reorderNodeTree = (nodes = [], activeId, overId) => {
  const oldIndex = nodes.findIndex(node => node.id === activeId)
  const newIndex = nodes.findIndex(node => node.id === overId)
  if (oldIndex >= 0 && newIndex >= 0) return arrayMove(nodes, oldIndex, newIndex)
  return nodes.map(node => node.children?.length
    ? { ...node, children: reorderNodeTree(node.children, activeId, overId) }
    : node)
}

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

  const addNode = useCallback((type, index, parentId, selectAfterAdd = true) => {
    const node = createDocumentNode(type, dataSchema)
    commit(current => {
      const rootNode = current.layout?.mode === 'absolute'
        ? {
          ...node,
          layout: {
            ...(node.layout ?? {}),
            absolute: {
              page: 1,
              x: 40,
              y: 40,
              width: type === 'line' ? 180 : 240,
              height: type === 'rectangle' ? 100 : 40,
              rotation: 0,
            },
          },
        }
        : node
      const selectedNode = findNode(current.nodes, selectedNodeId)
      const targetParentId = parentId === '__root__'
        ? null
        : parentId || (selectedNode?.type === 'container' ? selectedNode.id : null)
      if (targetParentId) {
        const targetParent = findNode(current.nodes, targetParentId)
        const parentColumns = targetParent?.grid?.columns ?? 12
        const childNode = type === 'container'
          ? {
            ...node,
            layout: {
              ...(node.layout ?? {}),
              columnSpan: Math.max(Math.floor(parentColumns / 2), 1),
            },
          }
          : node
        return {
          ...current,
          nodes: updateNodeTree(current.nodes, targetParentId, (parent) => ({
            ...parent,
            children: [...(parent.children ?? []), childNode],
          })),
        }
      }
      const nodes = [...(current.nodes ?? [])]
      const targetIndex = Number.isInteger(index) ? index : nodes.length
      nodes.splice(targetIndex, 0, rootNode)
      return { ...current, nodes }
    })
    if (selectAfterAdd) setSelectedNodeId(node.id)
  }, [commit, dataSchema, selectedNodeId])

  const updateNode = useCallback((nodeId, changes) => {
    commit(current => ({
      ...current,
      nodes: updateNodeTree(current.nodes, nodeId, node => ({
        ...node,
        ...(typeof changes === 'function' ? changes(node) : changes),
      })),
    }))
  }, [commit])

  const removeNode = useCallback((nodeId) => {
    commit(current => ({ ...current, nodes: removeNodeTree(current.nodes, nodeId) }))
    setSelectedNodeId(current => current === nodeId ? null : current)
  }, [commit])

  const duplicateNode = useCallback((nodeId) => {
    commit(current => {
      const source = findNode(current.nodes, nodeId)
      if (!source) return current
      const copy = cloneNodeWithNewIds(source)
      setSelectedNodeId(copy.id)
      return {
        ...current,
        nodes: duplicateNodeTree(current.nodes, nodeId, copy),
      }
    })
  }, [commit])

  const moveNode = useCallback((activeId, overId) => {
    if (!overId || activeId === overId) return
    commit(current => {
      return { ...current, nodes: reorderNodeTree(current.nodes, activeId, overId) }
    })
  }, [commit])

  const updateTemplate = useCallback((changes) => {
    commit(current => ({ ...current, ...changes }))
  }, [commit])

  const replaceTemplate = useCallback((nextTemplate) => {
    commit(cloneTemplate(nextTemplate))
    setSelectedNodeId(null)
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
    () => findNode(template.nodes, selectedNodeId),
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
    replaceTemplate,
    undo,
    redo,
  }
}

export default useDocumentTemplateEditor
