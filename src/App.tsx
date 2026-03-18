import { GameCanvas } from './components/GameCanvas'
import { GameUi } from './components/GameUi'

function App() {
  return (
    <main className="app-shell">
      <GameCanvas />
      <GameUi />
    </main>
  )
}

export default App
