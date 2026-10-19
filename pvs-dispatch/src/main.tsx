import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import App from './App'
import { PrintView } from './screens/PrintView'
import { applyTheme, useUi } from './lib/store'
import './index.css'

// Hidden print windows load the app with #print/<kind>?…: render the print
// document alone, no shell, no theme.
const isPrintRoute = window.location.hash.startsWith('#print/')

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5_000, retry: 1 },
  },
})

if (!isPrintRoute) {
  applyTheme(useUi.getState().theme)
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    applyTheme(useUi.getState().theme)
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isPrintRoute ? (
      <PrintView />
    ) : (
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster richColors position="bottom-right" />
      </QueryClientProvider>
    )}
  </React.StrictMode>,
)
