import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/landingpage'
import Navbar from './pages/navbar'

function App() {
  return (
    <BrowserRouter>
      <Navbar />   {/* Header */}
      <Routes>
        <Route path="/" element={<LandingPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
