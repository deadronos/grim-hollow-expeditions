import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useGameStore } from './game/store.ts'

if (import.meta.env.DEV) {
  ;(window as Window & { __grimStore?: typeof useGameStore }).__grimStore = useGameStore
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
