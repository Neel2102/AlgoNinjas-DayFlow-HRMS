import './App.css'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import LandingPage from './pages/landingpage'
import Navbar from './pages/navbar'
import EmployeeDashboard from './pages/Employeedashboard.jsx'
import SignIn from "./routes/auth/SignIn";
import SignUp from "./routes/auth/SignUp";
import ProtectedRoute from "./components/common/ProtectedRoute";
import Dashboard from "./routes/employee/Dashboard";
import Profile from "./routes/employee/Profile";
import RequireRoleRoute from "./components/common/RequireRoleRoute";
import EmployeeDetail from "./routes/admin/EmployeeDetail";
import AttendanceAdmin from "./routes/admin/AttendanceAdmin";

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

      <Navbar />   {/* Header */}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />

          <Route element={<RequireRoleRoute roles={["admin"]} />}>
            <Route path="/admin/employees/:id" element={<EmployeeDetail />} />
            <Route path="/admin/attendance" element={<AttendanceAdmin />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App