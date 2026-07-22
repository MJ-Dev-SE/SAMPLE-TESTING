import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import './i18n'
import './styles/global.css'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import { AuthProvider } from './lib/auth'
import { installAccessGuard } from './lib/guard'
import { queryClient, queryPersister, QUERY_CACHE_BUSTER, NON_PERSISTED_QUERY_KEYS } from './lib/queryClient'
import { activeBrand } from './config/brand'

// TEMPORARY inspect/console access deterrent — production builds only, so the
// dev workflow (and all site functions) stay untouched. See src/lib/guard.ts.
if (import.meta.env.PROD) {
  installAccessGuard()
}

// Google Translate (and similar in-page translators) rewrites text nodes
// directly in the live DOM without React knowing. When React later tries to
// remove/insert those exact nodes during its own reconciliation, the browser
// throws "Failed to execute 'removeChild'/'insertBefore' on 'Node': ... is
// not a child of this node" — an uncaught error that unmounts the whole tree
// (caught by ErrorBoundary below, forcing a reload). index.html now asks
// Google Translate not to run (`translate="no"` + notranslate meta) since the
// site has its own EN/KO switcher, but a user can still override that
// manually — this patch is the fallback: skip the operation instead of
// throwing when the node was already detached by something else.
// (Well-known React/Google-Translate conflict: facebook/react#11538.)
if (typeof Node === 'function' && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild
  Node.prototype.removeChild = function <T extends Node>(this: Node, child: T): T {
    if (child.parentNode !== this) return child
    return originalRemoveChild.call(this, child) as T
  }

  const originalInsertBefore = Node.prototype.insertBefore
  Node.prototype.insertBefore = function <T extends Node>(this: Node, newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) return newNode
    return originalInsertBefore.call(this, newNode, referenceNode) as T
  }
}

// Per-hostname branding (src/config/brand.ts): index.html is one static shell
// shared by every domain, so before first paint swap the tab title/favicon for
// brands that override them. The default brand sets neither — its index.html
// values stand untouched.
if (activeBrand.documentTitle) document.title = activeBrand.documentTitle
if (activeBrand.favicon) {
  const icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
  if (icon) {
    icon.type = '' // let the browser sniff — brand icons may not be image/jpeg
    icon.href = activeBrand.favicon
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* Outermost — a last-resort catch for ANY uncaught render error (see
        ErrorBoundary.tsx). Most route-chunk failures never even reach this,
        since lazyWithRetry (App.tsx) already retries/self-heals them; this is
        the net for whatever's left, so a bug never means a blank white page. */}
    <ErrorBoundary>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: queryPersister,
          buster: QUERY_CACHE_BUSTER,
          // Keep the default (persist only successful queries) but never persist
          // the admin-editable directory families — those stay fresh on reload so
          // an admin's delete/edit never lingers as a ghost on other clients.
          dehydrateOptions: {
            shouldDehydrateQuery: (query) =>
              query.state.status === 'success' && !NON_PERSISTED_QUERY_KEYS.has(String(query.queryKey[0])),
          },
        }}
      >
        <HelmetProvider>
          <BrowserRouter>
            <AuthProvider>
              <App />
            </AuthProvider>
          </BrowserRouter>
        </HelmetProvider>
      </PersistQueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
