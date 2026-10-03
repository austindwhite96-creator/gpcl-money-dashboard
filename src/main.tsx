import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { captureKeyFromUrl } from './lib/accessKey'

// Personal link: …/#k=<token>. Save the key and remove it from the address bar before anything renders.
captureKeyFromUrl()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
