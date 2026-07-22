import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import './i18n'
import './styles/global.css'
import App from './App'
import { AuthProvider } from './lib/auth'
import { installAccessGuard } from './lib/guard'
import { queryClient, queryPersister, QUERY_CACHE_BUSTER, NON_PERSISTED_QUERY_KEYS } from './lib/queryClient'
import { activeBrand } from './config/brand'

// TEMPORARY inspect/console access deterrent — production builds only, so the
// dev workflow (and all site functions) stay untouched. See src/lib/guard.ts.
if (import.meta.env.PROD) {
  installAccessGuard()
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
  </React.StrictMode>,
)
