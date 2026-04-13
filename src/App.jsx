import { Routes, Route } from 'react-router-dom'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<div className="text-primary p-8">Drape scaffold ✓</div>} />
    </Routes>
  )
}
