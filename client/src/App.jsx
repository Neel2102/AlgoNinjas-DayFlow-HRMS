import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/landingpage'
import Navbar from './pages/navbar'
import SignIn from "./routes/auth/SignIn";
import SignUp from "./routes/auth/SignUp";

function App() {
  return (
    <BrowserRouter>
      <Navbar />   {/* Header */}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
