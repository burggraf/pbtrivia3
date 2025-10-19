import { Routes, Route } from 'react-router-dom'

console.log('Routes and Route components used in JSX below')

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<div>Trivia Party App - Home</div>} />
          <Route path="/host" element={<div>Host Dashboard - Coming Soon</div>} />
          <Route path="/join" element={<div>Join Game - Coming Soon</div>} />
          <Route path="/tv/:gameCode" element={<div>TV Display - Coming Soon</div>} />
        </Routes>
      </main>
    </div>
  )
}

export default App