import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ApiError, keys, MOCK } from './api'
import { App } from './App'
import { Crashed } from './shell/Crashed'
import { FeedbackHost, PageTrail } from './shell/Feedback'
import { BUILD, STAGING } from './lib/env'
import { watchForErrors } from './lib/report'
import { ToastProvider } from './shell/Toast'
import './styles/tokens.css'
import './styles/app.css'

watchForErrors()
if (STAGING) {
  document.title = `Staging · ${document.title}`
  document.documentElement.classList.add('staging')   // makes room for the staging strip (app.css)
}

const queryClient: QueryClient = new QueryClient({
  // A 401 anywhere means the session ended: forget Me, and the route guard sends you to sign up.
  queryCache: new QueryCache({
    // In the demo, a query that goes to the real server (feedback) can be refused without the demo's session ending.
    onError: (err, query) => {
      if (err instanceof ApiError && err.isUnauthorized && !(MOCK && query.meta?.realServer)) queryClient.setQueryData(keys.me, null)
    },
  }),
  defaultOptions: {
    queries: {
      retry: (count, err) => !(err instanceof ApiError && err.status < 500) && count < 2,
      refetchOnWindowFocus: true,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastProvider>
          <PageTrail />
          <Crashed>
            <App />
          </Crashed>
          <FeedbackHost />
          {STAGING && (BUILD.href
            ? <a className="staging-flag" href={BUILD.href} target="_blank" rel="noreferrer" title={BUILD.label}>Staging · {BUILD.label}</a>
            : <div className="staging-flag" aria-hidden>Staging</div>)}
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
