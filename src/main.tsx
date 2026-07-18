import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import './i18n'
import './styles/global.css'
import App from './App'
import { AuthProvider } from './lib/auth'
import { installAccessGuard } from './lib/guard'

// TEMPORARY inspect/console access deterrent — production builds only, so the
// dev workflow (and all site functions) stay untouched. See src/lib/guard.ts.
if (import.meta.env.PROD) {
  installAccessGuard()
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>,
)
