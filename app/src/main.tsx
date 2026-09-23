import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import { BRAND } from './brand'

// Placeholder root. The app lane replaces this with the router and the shell.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <main style={{ padding: 16 }}><h1>{BRAND.name}</h1></main>
  </StrictMode>,
)
