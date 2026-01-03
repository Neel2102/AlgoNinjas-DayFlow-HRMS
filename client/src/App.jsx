import './App.css'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import LandingPage from './pages/landingpage'
import Navbar from './pages/navbar'
import EmployeeDashboard from './pages/Employeedashboard.jsx'

function AppContent() {
  const location = useLocation();
  
  return (
    <>
      {/* Only show Navbar if NOT on dashboard route */}
      {location.pathname !== '/dashboard-employee' && <Navbar />}
      
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard-employee" element={<EmployeeDashboard />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App