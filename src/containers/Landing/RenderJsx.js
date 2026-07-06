import { useMemo, Component as ReactComponent } from 'react'
import * as Babel from '@babel/standalone'
import React, * as ReactNS from 'react'
import styled, * as StyledNS from 'styled-components'
import * as CoreComponents from '@flast-erp/core/components'
import * as Antd from 'antd'
import * as AntdIcons from '@ant-design/icons'
import * as I18next from 'react-i18next'

const MODULES = {
  react: { ...ReactNS, default: React, __esModule: true },
  'styled-components': { ...StyledNS, default: styled, __esModule: true },
  '@flast-erp/core/components': { ...CoreComponents, __esModule: true },
  antd: { ...Antd, __esModule: true },
  '@ant-design/icons': { ...AntdIcons, __esModule: true },
  'react-i18next': { ...I18next, __esModule: true },
}

const noop = () => { }
const StubComponent = () => null
const STUBS = {
  '@fortawesome/react-fontawesome': { FontAwesomeIcon: StubComponent, default: StubComponent, __esModule: true },
  '@fortawesome/free-solid-svg-icons': new Proxy({ __esModule: true }, { get: (t, p) => (p in t ? t[p] : {}) }),
  '@fortawesome/fontawesome-svg-core': { library: { add: noop }, __esModule: true },
  'js-cookie': { default: { get: noop, set: noop, remove: noop }, __esModule: true },
  'next/link': { default: ({ children }) => children ?? null, __esModule: true },
  'next/navigation': {
    usePathname: () => '',
    useRouter: () => ({ push: noop, replace: noop, back: noop, prefetch: noop }),
    __esModule: true,
  },
}

const makeGenericStub = (name) => {
  const fn = function StubFn() { return null }
  return new Proxy(fn, {
    get(target, prop) {
      if (prop === '__esModule') return false
      if (prop === 'default') return fn
      if (prop in target) return target[prop]
      console.warn(`[RenderJsx] Stub giả cho "${name}" — không hoạt động thật, chỉ để tránh crash.`)
      return makeGenericStub(`${name}.${String(prop)}`)
    },
    apply: () => null,
  })
}

const requireShim = (name) => MODULES[name] ?? STUBS[name] ?? makeGenericStub(name)

/** Transpile 1 file .tsx thành component React, chạy ngay trên trình duyệt. */
function compileJsx(code) {
  const { code: js } = Babel.transform(code, {
    presets: [
      ['react', { runtime: 'classic' }],
      'typescript',
    ],
    plugins: ['transform-modules-commonjs'],
    filename: 'live-preview.tsx',
  })

  const module = { exports: {} }
  // eslint-disable-next-line no-new-func
  const run = new Function('module', 'exports', 'require', 'React', js)
  run(module, module.exports, requireShim, React)

  const exportsObj = module.exports || {}
  let Component = exportsObj.default

  if (Component == null) {
    const namedKeys = Object.keys(exportsObj).filter((k) => k !== '__esModule' && k !== 'default')
    if (namedKeys.length >= 1) {
      Component = exportsObj[namedKeys[0]]
    }
  }

  if (Component == null) {
    throw new Error('File không export default (hoặc named export) một component hợp lệ')
  }
  return Component
}

/** Bắt lỗi phát sinh khi React thực sự render Component . */
class RenderJsxBoundary extends ReactComponent {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ color: '#f87171', padding: 16, fontSize: 13, whiteSpace: 'pre-wrap' }}>
          Lỗi render preview: {this.state.error.message}
        </div>
      )
    }
    return this.props.children
  }
}

export function RenderJsx({ code, props }) {
  const { Component, error } = useMemo(() => {
    if (!code) return { Component: null, error: null }
    try {
      return { Component: compileJsx(code), error: null }
    } catch (err) {
      return { Component: null, error: err.message }
    }
  }, [code])

  if (error) {
    return (
      <div style={{ color: '#f87171', padding: 16, fontSize: 13, whiteSpace: 'pre-wrap' }}>
        Lỗi render preview: {error}
      </div>
    )
  }
  if (!Component) return null

  return (
    <RenderJsxBoundary key={code}>
      <Component {...props} />
    </RenderJsxBoundary>
  )
}
