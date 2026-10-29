import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import Layout from './Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Students from './pages/Students.jsx';
import StudentDetail from './pages/StudentDetail.jsx';
import StudentQrScanner from './pages/StudentQrScanner.jsx';
import StudentQrLanding from './pages/StudentQrLanding.jsx';
import Registrations from './pages/Registrations.jsx';
import Requirements from './pages/Requirements.jsx';
import Permissions from './pages/Permissions.jsx';
import ExcelPage from './pages/ExcelPage.jsx';
import Setup from './pages/Setup.jsx';
import Users from './pages/Users.jsx';
import Verify from './pages/Verify.jsx';
import StudentHome from './pages/StudentHome.jsx';
import Arrivals from './pages/Arrivals.jsx';
import Dormitories from './pages/Dormitories.jsx';
import Refectory from './pages/Refectory.jsx';

function Protected({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  return user ? <Layout>{children}</Layout> : <Navigate to="/login" replace state={{ from: location }} />;
}

export default function App() {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const P = (el) => <Protected>{el}</Protected>;
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/verify/:token" element={P(<Verify />)} />
      <Route path="/scan-student" element={P(<StudentQrScanner />)} />
      <Route path="/student-scan/:token" element={P(<StudentQrLanding />)} />
      <Route path="/" element={P(isStudent ? <StudentHome /> : <Dashboard />)} />
      <Route path="/students" element={P(<Students />)} />
      <Route path="/students/:id" element={P(<StudentDetail />)} />
      <Route path="/registrations" element={P(<Registrations />)} />
      <Route path="/requirements" element={P(<Requirements />)} />
      <Route path="/permissions" element={P(<Permissions />)} />
      <Route path="/excel" element={P(<ExcelPage />)} />
      <Route path="/setup" element={P(<Setup />)} />
      <Route path="/users" element={P(<Users />)} />
      <Route path="/arrivals" element={P(<Arrivals />)} />
      <Route path="/dormitories" element={P(<Dormitories />)} />
      <Route path="/refectory" element={P(<Refectory />)} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
