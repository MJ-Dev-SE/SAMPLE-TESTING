import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}
interface State {
  hasError: boolean
}

/**
 * Last-resort safety net for the whole app (mounted in main.tsx, outside
 * every other provider). Without this, ANY uncaught render error — most
 * commonly a route chunk that failed to load (lib/lazyWithRetry.ts already
 * recovers from the usual transient causes on its own, automatically) —
 * unmounts the entire React tree, leaving a blank white page that only a
 * manual reload fixes. This catches whatever slips past that and shows a
 * small recovery prompt instead of nothing at all.
 *
 * Deliberately self-contained: inline styles, no Tailwind classes, no
 * Layout/i18n/other app components. A fallback that depends on the rest of
 * the app being healthy is not a safety net — if global.css failed to load,
 * or i18n never initialized, this still has to render something legible.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    // console.* is silenced in production (lib/guard.ts) — this is a no-op
    // there and a real stack trace during development.
    console.error('[ErrorBoundary] caught a render error:', error, info.componentStack)
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          padding: '24px',
          textAlign: 'center',
          fontFamily:
            'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}
      >
        <div style={{ maxWidth: '360px' }}>
          <p style={{ fontSize: '15px', lineHeight: 1.6, color: '#333', margin: '0 0 20px' }}>
            Something went wrong. Please reload the page.
            <br />
            문제가 발생했습니다. 페이지를 새로고침해 주세요.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              height: '40px',
              padding: '0 24px',
              background: '#0066e6',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Reload · 새로고침
          </button>
        </div>
      </div>
    )
  }
}
