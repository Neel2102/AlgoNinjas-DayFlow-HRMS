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
import Attendance from "./routes/employee/Attendance";
import LeaveManagement from "./routes/employee/LeaveManagement";
import LeaveApproval from "./routes/admin/LeaveApproval";
import Payroll from "./routes/employee/Payroll";
import PayrollManagement from "./routes/admin/PayrollManagement";
import AdminDashboard from "./routes/admin/Dashboard";
import EmployeeList from "./routes/admin/EmployeeList";
import AttendanceManagement from "./routes/admin/AttendanceManagement";

function Layout() {
  const location = useLocation();
  const path = location.pathname || "/";

  const hideNavbar =
    path === "/dashboard-employee" ||
    path === "/dashboard" ||
    path === "/profile" ||
    path === "/attendance" ||
    path === "/leaves" ||
    path === "/payroll" ||
    path.startsWith("/admin");

  return (
    <>
      {hideNavbar ? null : <Navbar />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/dashboard-employee" element={<EmployeeDashboard />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/leaves" element={<LeaveManagement />} />
          <Route path="/payroll" element={<Payroll />} />

          <Route element={<RequireRoleRoute roles={["admin", "hr"]} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/employees" element={<EmployeeList />} />
            <Route path="/admin/employees/:id" element={<EmployeeDetail />} />
            <Route path="/admin/attendance" element={<AttendanceAdmin />} />
            <Route path="/admin/attendance-management" element={<AttendanceManagement />} />
            <Route path="/admin/leaves" element={<LeaveApproval />} />
            <Route path="/admin/payroll" element={<PayrollManagement />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  )
}

export default App