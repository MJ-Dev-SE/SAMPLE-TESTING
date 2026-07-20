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
import { queryClient, queryPersister, QUERY_CACHE_BUSTER } from './lib/queryClient'
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
      persistOptions={{ persister: queryPersister, buster: QUERY_CACHE_BUSTER }}
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
