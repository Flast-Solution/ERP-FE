import { useEffect, useMemo, useRef, useState } from 'react'

const LOADER_SRC = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs/loader.js'
const MONACO_BASE = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs'

let monacoLoaderPromise = null

const loadMonaco = () => {
  if (window.monaco?.editor) {
    return Promise.resolve(window.monaco)
  }

  if (monacoLoaderPromise) {
    return monacoLoaderPromise
  }

  monacoLoaderPromise = new Promise((resolve, reject) => {
    const finishLoad = () => {
      if (!window.require) {
        reject(new Error('Monaco loader is not available.'))
        return
      }

      window.require.config({ paths: { vs: MONACO_BASE } })
      window.require(['vs/editor/editor.main'], () => {
        if (window.monaco?.editor) {
          resolve(window.monaco)
        } else {
          reject(new Error('Monaco editor failed to initialize.'))
        }
      }, reject)
    }

    const existingScript = document.querySelector(`script[src="${LOADER_SRC}"]`)
    if (existingScript) {
      if (window.require) {
        finishLoad()
        return
      }
      existingScript.addEventListener('load', finishLoad, { once: true })
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Monaco loader.')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = LOADER_SRC
    script.async = true
    script.onload = finishLoad
    script.onerror = () => reject(new Error('Failed to load Monaco loader.'))
    document.body.appendChild(script)
  })

  return monacoLoaderPromise
}

const createSnippetSuggestions = (monaco) => ([
  {
    label: 'FormInput',
    kind: monaco.languages.CompletionItemKind.Snippet,
    insertText: [
      '<FormInput',
      '\tname="${1:field_key}"',
      '\tlabel="${2:Label}"',
      '\tplaceholder="${3:Placeholder}"',
      '/>',
    ].join('\n'),
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Snippet cho FormInput',
  },
  {
    label: 'FormSelect',
    kind: monaco.languages.CompletionItemKind.Snippet,
    insertText: [
      '<FormSelect',
      '\tname="${1:field_key}"',
      '\tlabel="${2:Label}"',
      '\tplaceholder="${3:Chon...}"',
      '\tresourceData={${4:options}}',
      '/>',
    ].join('\n'),
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Snippet cho FormSelect',
  },
  {
    label: 'Row/Col Field',
    kind: monaco.languages.CompletionItemKind.Snippet,
    insertText: [
      '<Col span={${1:12}}>',
      '\t<${2:FormInput}',
      '\t\tname="${3:field_key}"',
      '\t\tlabel="${4:Label}"',
      '\t/>',
      '</Col>',
    ].join('\n'),
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Snippet block field trong Row/Col',
  },
])

const createFieldKeySuggestions = (monaco, fieldKeys) => (
  fieldKeys
    .filter(Boolean)
    .map(fieldKey => ({
      label: fieldKey,
      kind: monaco.languages.CompletionItemKind.Variable,
      insertText: fieldKey,
      documentation: `fieldKey tu schema hien tai: ${fieldKey}`,
    }))
)

const createPropSuggestions = (monaco) => ([
  'name',
  'label',
  'placeholder',
  'required',
  'resourceData',
  'mode',
  'entity',
  'labelField',
  'min',
  'max',
  'precision',
].map(prop => ({
  label: prop,
  kind: monaco.languages.CompletionItemKind.Property,
  insertText: prop,
  documentation: `Prop JSX: ${prop}`,
})))

const MonacoCodeEditor = ({
  value,
  onChange,
  readOnly = true,
  fieldKeys = [],
  fallback,
}) => {
  const containerRef = useRef(null)
  const editorRef = useRef(null)
  const monacoRef = useRef(null)
  const completionProviderRef = useRef(null)
  const [loadError, setLoadError] = useState('')

  const safeFieldKeys = useMemo(() => Array.from(new Set(fieldKeys.filter(Boolean))), [fieldKeys])

  useEffect(() => {
    let mounted = true

    loadMonaco()
      .then(monaco => {
        if (!mounted || !containerRef.current) return

        monacoRef.current = monaco
        monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
          jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
          allowNonTsExtensions: true,
          target: monaco.languages.typescript.ScriptTarget.ES2020,
        })

        const editor = monaco.editor.create(containerRef.current, {
          value,
          language: 'javascript',
          theme: 'vs-dark',
          readOnly,
          automaticLayout: true,
          minimap: { enabled: false },
          fontSize: 12.5,
          lineHeight: 20,
          tabSize: 2,
          scrollBeyondLastLine: false,
          wordWrap: 'off',
          suggestOnTriggerCharacters: true,
          quickSuggestions: {
            other: true,
            comments: false,
            strings: true,
          },
          padding: { top: 12, bottom: 12 },
        })

        editorRef.current = editor
        editor.onDidChangeModelContent(() => {
          if (!editorRef.current) return
          onChange?.(editorRef.current.getValue())
        })
      })
      .catch(err => {
        if (!mounted) return
        setLoadError(err.message || 'Khong the tai Monaco.')
      })

    return () => {
      mounted = false
      if (completionProviderRef.current) {
        completionProviderRef.current.dispose()
        completionProviderRef.current = null
      }
      if (editorRef.current) {
        editorRef.current.dispose()
        editorRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return

    if (editor.getValue() !== value) {
      editor.setValue(value)
    }
  }, [value])

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    editor.updateOptions({ readOnly })
  }, [readOnly])

  useEffect(() => {
    const monaco = monacoRef.current
    if (!monaco) return

    if (completionProviderRef.current) {
      completionProviderRef.current.dispose()
    }

    completionProviderRef.current = monaco.languages.registerCompletionItemProvider('javascript', {
      triggerCharacters: ['"', '<', ' ', '{'],
      provideCompletionItems: () => ({
        suggestions: [
          ...createSnippetSuggestions(monaco),
          ...createFieldKeySuggestions(monaco, safeFieldKeys),
          ...createPropSuggestions(monaco),
        ],
      }),
    })
  }, [safeFieldKeys])

  if (loadError) {
    return fallback?.(loadError) ?? null
  }

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}

export default MonacoCodeEditor
