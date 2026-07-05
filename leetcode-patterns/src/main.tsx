import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { primeWallpaper } from './lib/wallpaper.ts'

// Start the wallpaper fetch chain before React mounts — on first visits this
// shaves the render cycle App's effect would otherwise wait for.
primeWallpaper()

// Dev-only visual reference: append ?darkreader to the dev URL to view the site
// through Dark Reader. The native (non-darkreader) theme should look the same —
// use this toggle to compare the two side by side. The dynamic import keeps
// darkreader out of production bundles (the DEV branch is dead-code-eliminated).
const darkReaderRequested = new URLSearchParams(window.location.search).has('darkreader')
if (import.meta.env.DEV && darkReaderRequested) {
  import('darkreader').then(({ enable: enableDarkReader }) => {
    enableDarkReader({
      brightness: 100,
      contrast: 90,
      sepia: 10,
    })
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
