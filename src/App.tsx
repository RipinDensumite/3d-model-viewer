import { Routes, Route } from 'react-router'
import DisplayModel from './pages/DisplayModel'
import Home from './pages/Home'

function App() {
  return (
     <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/display" element={<DisplayModel />} />
      <Route path='*' element={<h1>404 Not Found</h1>} />
    </Routes>
  )
}

export default App