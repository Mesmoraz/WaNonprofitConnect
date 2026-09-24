import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ApiError, keys } from './api'
import { App } from './App'
import { Crashed } from './shell/Crashed'
import { FeedbackHost, PageTrail } from './shell/Feedback'
import { watchForErrors } from './lib/report'
import { ToastProvider } from './shell/Toast'
import './styles/tokens.css'
import './styles/app.css'

watchForErrors()

const queryClient: QueryClient = new QueryClient({
  // A 401 anywhere means the session ended: forget Me, and the route guard sends you to sign up.
  queryCache: new QueryCache({
    onError: err => { if (err instanceof ApiError && err.isUnauthorized) queryClient.setQueryData(keys.me, null) },
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
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
