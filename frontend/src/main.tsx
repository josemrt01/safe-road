import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Only the weights the design uses: light and bold headings, regular and italic subtitles, extra-bold brand.
import '@fontsource/overpass/300.css'
import '@fontsource/overpass/400.css'
import '@fontsource/overpass/400-italic.css'
import '@fontsource/overpass/700.css'
import '@fontsource/overpass/800.css'
// Monospace digits for the forecast clock.
import '@fontsource/overpass-mono/500.css'
import '@fontsource/overpass-mono/700.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
